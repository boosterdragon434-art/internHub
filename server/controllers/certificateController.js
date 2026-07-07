const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const r2Service = require('../services/r2Service');
const {
  generateQRCode,
  buildCertificatePDF,
  generateSecureCertificateId,
  generateVerificationHash,
  computeFileHash,
} = require('../services/certificateService');
const { BULK_GENERATION_LIMIT } = require('../config/constants');
const { validateBase64MagicBytes } = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const escapeRegex = require('../utils/escapeRegex');

// ─────────────────────────────────────────────────────────────
// Template CRUD Handlers
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all certificate templates with search, filter, and pagination
 * @route   GET /api/certificates/templates
 * @access  Admin
 */
const getTemplates = async (req, res, next) => {
  try {
    const { search, status, sort = '-createdAt', page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }
    if (req.query.documentCategory) {
      filter.documentCategory = req.query.documentCategory;
    }
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const total = await CertificateTemplate.countDocuments(filter);

    const templates = await CertificateTemplate.find(filter)
      .sort(sort === 'name' ? { name: 1 } : { isDefault: -1, createdAt: -1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)))
      .populate('createdBy', 'name email');

    ApiResponse.success(res, 200, 'Templates fetched successfully.', templates, ApiResponse.paginate(
      parseInt(page), Math.min(100, parseInt(limit)), total
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get template statistics (count, storage usage)
 * @route   GET /api/certificates/templates/stats
 * @access  Admin
 */
const getTemplateStats = async (req, res, next) => {
  try {
    const [totalCount, activeCount, storageResult] = await Promise.all([
      CertificateTemplate.countDocuments(),
      CertificateTemplate.countDocuments({ status: 'active' }),
      CertificateTemplate.aggregate([
        { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } },
      ]),
    ]);

    const totalBytes = storageResult[0]?.totalBytes || 0;

    ApiResponse.success(res, 200, 'Template stats fetched.', {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount,
      storageBytesUsed: totalBytes,
      storageFormatted: totalBytes > 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(totalBytes / 1024).toFixed(1)} KB`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new certificate template
 * @route   POST /api/certificates/templates
 * @access  Admin
 *
 * Accepts base64 background image and uploads it to R2 object storage.
 */
const createTemplate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      backgroundImage, // base64 string
      layout,
      typography,
      overlays,
      metadata,
      width,
      height,
      isDefault,
      documentCategory,
      customTextTemplate,
      pageFormat,
      orientation,
    } = req.body;

    if (!name || !name.trim()) {
      return next(ApiError.badRequest('Template name is required.'));
    }

    let backgroundImageUrl = '';
    let cloudinaryPublicId = '';
    let fileSize = 0;
    let fileHash = '';
    let templateType = 'image';

    // Upload background image to Drive if provided
    if (backgroundImage) {
      // Validate base64 magic bytes
      const { valid, detectedMime, buffer: imageBuffer } = validateBase64MagicBytes(backgroundImage);
      if (!valid || !imageBuffer) {
        return next(ApiError.badRequest('Invalid or corrupted image file. Please upload a valid PNG, JPG, or PDF.'));
      }

      // Check file size (buffer size)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return next(ApiError.badRequest('File size exceeds 10MB limit.'));
      }

      // Compute file hash for duplicate detection
      fileHash = computeFileHash(imageBuffer);

      // Check for duplicate uploads
      const existingWithHash = await CertificateTemplate.findOne({ fileHash });
      if (existingWithHash) {
        return next(
          ApiError.conflict(`A template with this exact image already exists: "${existingWithHash.name}".`)
        );
      }

      fileSize = imageBuffer.length;
      templateType = detectedMime === 'application/pdf' ? 'pdf' : 'image';



      const { publicId, secureUrl } = await r2Service.uploadFile(
        imageBuffer,
        'internhub/templates',
        'auto'
      );
      backgroundImageUrl = secureUrl;
      cloudinaryPublicId = publicId;
    }

    // If marking as default, un-default all others
    if (isDefault) {
      await CertificateTemplate.updateMany({}, { isDefault: false });
    }

    const template = await CertificateTemplate.create({
      name: name.trim(),
      description: description?.trim() || '',
      backgroundImageUrl,
      cloudinaryPublicId,
      status: 'active',
      templateType,
      fileSize,
      fileHash,
      width: width || 842,
      height: height || 595,
      layout: layout || {},
      typography: typography || {},
      overlays: overlays || [],
      metadata: metadata || {},
      isDefault: isDefault || false,
      documentCategory: documentCategory || 'certificate',
      customTextTemplate: customTextTemplate || '',
      pageFormat: pageFormat || 'A4',
      orientation: orientation || 'landscape',
      createdBy: req.user.id,
    });

    logger.info(`Certificate template created: ${template.name} by ${req.user.email}`);
    ApiResponse.success(res, 201, 'Template created successfully.', template);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a certificate template (overlays, layout, metadata, background)
 * @route   PUT /api/certificates/templates/:id
 * @access  Admin
 */
const updateTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }

    const { name, description, layout, typography, isDefault, backgroundImage, overlays, metadata, width, height, documentCategory, customTextTemplate, pageFormat, orientation } = req.body;

    if (name) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (width) template.width = width;
    if (height) template.height = height;
    if (documentCategory) template.documentCategory = documentCategory;
    if (customTextTemplate !== undefined) template.customTextTemplate = customTextTemplate;
    if (pageFormat) template.pageFormat = pageFormat;
    if (orientation) template.orientation = orientation;

    // Update overlays array (complete replacement)
    if (overlays !== undefined) {
      template.overlays = overlays;
    }

    // Update editor metadata
    if (metadata) {
      template.metadata = {
        ...template.metadata?.toObject?.() || template.metadata || {},
        ...metadata,
      };
    }

    // Update layout coordinates (legacy support)
    if (layout) {
      if (layout.namePosition) {
        template.layout.namePosition = {
          x: layout.namePosition.x ?? template.layout.namePosition.x,
          y: layout.namePosition.y ?? template.layout.namePosition.y,
        };
      }
      if (layout.datePosition) {
        template.layout.datePosition = {
          x: layout.datePosition.x ?? template.layout.datePosition.x,
          y: layout.datePosition.y ?? template.layout.datePosition.y,
        };
      }
      if (layout.idPosition) {
        template.layout.idPosition = {
          x: layout.idPosition.x ?? template.layout.idPosition.x,
          y: layout.idPosition.y ?? template.layout.idPosition.y,
        };
      }
      if (layout.qrPosition) {
        template.layout.qrPosition = {
          x: layout.qrPosition.x ?? template.layout.qrPosition.x,
          y: layout.qrPosition.y ?? template.layout.qrPosition.y,
        };
      }
    }

    // Update typography
    if (typography) {
      if (typography.fontFamily) template.typography.fontFamily = typography.fontFamily;
      if (typography.fontSize) template.typography.fontSize = typography.fontSize;
      if (typography.color) template.typography.color = typography.color;
    }

    // Handle new background image upload (replace in-place)
    if (backgroundImage) {
      const { valid, detectedMime, buffer: imageBuffer } = validateBase64MagicBytes(backgroundImage);
      if (!valid || !imageBuffer) {
        return next(ApiError.badRequest('Invalid or corrupted image file.'));
      }
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return next(ApiError.badRequest('File size exceeds 10MB limit.'));
      }

      // Delete old background from R2
      if (template.cloudinaryPublicId) {
        await r2Service.deleteFile(template.cloudinaryPublicId, template.templateType === 'pdf' ? 'auto' : 'image').catch(() => { });
      }

      const fileHash = computeFileHash(imageBuffer);
      const existingWithHash = await CertificateTemplate.findOne({ fileHash, _id: { $ne: template._id } });
      if (existingWithHash) {
        return next(ApiError.conflict(`A template with this exact image already exists: "${existingWithHash.name}".`));
      }
      const detectedMimeType = detectedMime || 'image/png';

      const { publicId, secureUrl } = await r2Service.uploadFile(
        imageBuffer,
        'internhub/templates',
        'auto'
      );
      template.backgroundImageUrl = secureUrl;
      template.cloudinaryPublicId = publicId;
      template.fileSize = imageBuffer.length;
      template.fileHash = fileHash;
      template.templateType = detectedMimeType === 'application/pdf' ? 'pdf' : 'image';
    }

    // Handle default toggle
    if (isDefault !== undefined) {
      if (isDefault) {
        await CertificateTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
      }
      template.isDefault = isDefault;
    }

    await template.save();

    logger.info(`Certificate template updated: ${template.name} by ${req.user.email}`);
    ApiResponse.success(res, 200, 'Template updated successfully.', template);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a certificate template
 * @route   DELETE /api/certificates/templates/:id
 * @access  Admin
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }

    // Check if template is used by any certificates (issued or revoked)
    const usageCount = await Certificate.countDocuments({ template: template._id });
    if (usageCount > 0) {
      return next(
        ApiError.conflict(
          `This template is used by ${usageCount} certificate(s) (including revoked). Deactivate it instead to preserve audit history.`
        )
      );
    }

    // Clean up R2 file
    if (template.cloudinaryPublicId) {
      await r2Service.deleteFile(template.cloudinaryPublicId, template.templateType === 'pdf' ? 'auto' : 'image').catch((err) => {
        logger.warn(`Failed to delete template background from Cloudinary: ${err.message}`);
      });
    }

    await CertificateTemplate.findByIdAndDelete(req.params.id);

    logger.info(`Certificate template deleted: ${template.name} by ${req.user.email}`);
    ApiResponse.success(res, 200, 'Template deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle template active/inactive status
 * @route   PUT /api/certificates/templates/:id/toggle-status
 * @access  Admin
 */
const toggleTemplateStatus = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }

    const { status } = req.body;
    template.status = status;
    await template.save();

    logger.info(`Template "${template.name}" status changed to ${status} by ${req.user.email}`);
    ApiResponse.success(res, 200, `Template ${status === 'active' ? 'activated' : 'deactivated'} successfully.`, template);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Proxy download template background from Drive
 * @route   GET /api/certificates/templates/:id/download
 * @access  Admin
 */
const downloadTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }
    if (!template.cloudinaryPublicId || !template.backgroundImageUrl) {
      return next(ApiError.notFound('Template has no background image to download.'));
    }

    const buffer = await r2Service.downloadFile(template.backgroundImageUrl);
    const ext = template.templateType === 'pdf' ? 'pdf' : 'png';
    const contentType = template.templateType === 'pdf' ? 'application/pdf' : 'image/png';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${template.name.replace(/\s+/g, '_')}.${ext}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Certificate Generation & Lifecycle Handlers
// ─────────────────────────────────────────────────────────────

/**
 * Helper to resolve fields from application for certificate generation and preview.
 * @private
 */
const _resolveCertificateFields = async (application, overrides = {}, templateDefaults = null) => {
  const student = application.user;
  const internship = application.internship;
  
  let guideName = '';
  if (student.assignedGuide) {
    const guide = await User.findById(student.assignedGuide);
    if (guide) guideName = guide.name;
  }

  let skills = [];
  if (overrides.skillsAcquired && overrides.skillsAcquired.length > 0) {
    skills = overrides.skillsAcquired;
  } else if (templateDefaults && templateDefaults.get('skillsAcquired')) {
    skills = templateDefaults.get('skillsAcquired').split(',').map(s => s.trim());
  } else {
    skills = application.skills || student.skills || [];
  }
  const skillsText = skills.join(', ');

  const grade = overrides.grade || (templateDefaults ? templateDefaults.get('grade') : null) || 'A';
  const performance = overrides.performance || (templateDefaults ? templateDefaults.get('performance') : null) || 'Good';

  return {
    studentName: student.name,
    internshipTitle: internship.title,
    duration: internship.duration || '3 Months',
    guideName,
    startDate: internship.startDate,
    endDate: internship.endDate,
    collegeName: application.college || student.college || 'College Name',
    companyName: 'InternHub',
    skills: skillsText,
    skillsAcquiredArray: skills,
    grade,
    performance,
  };
};

/**
 * Internal helper — generates a single certificate for one application.
 * Used by both single and bulk generation endpoints.
 * @private
 */
const _generateSingleCertificate = async ({ application, grade, skillsAcquired, performance, templateId, resolvedTemplate, issuerId, overwrite = false, customFields = {} }) => {
  const student = application.user;
  const internship = application.internship;
  const guideId = student.assignedGuide || null;

  // Resolve template (custom or default fallback)
  let template = resolvedTemplate;
  let backgroundImageBuffer = null;

  if (templateId) {
    template = await CertificateTemplate.findById(templateId);
    if (!template) {
      return { success: false, studentName: student.name, error: 'Selected template not found' };
    }
  } else {
    template = await CertificateTemplate.findOne({ isDefault: true, status: 'active' });
  }

  if (!template) {
    template = await CertificateTemplate.create({
      name: 'Classical Gold Border',
      isDefault: true,
      createdBy: issuerId,
      overlays: [
        {
          id: `qr-${Date.now()}`,
          field: 'qrCode',
          x: 12,
          y: 88,
          maxWidth: 12,
          height: 12,
        }
      ]
    });
  }

  // Check duplicate certificate
  const existingCert = await Certificate.findOne({
    student: student._id,
    internship: internship._id,
    status: 'issued',
  });

  if (existingCert && (!template.documentCategory || template.documentCategory === 'certificate')) {
    if (overwrite) {
      existingCert.status = 'revoked';
      await existingCert.save();
    } else {
      // Only block if it's a 'certificate' to allow multiple letters (offer, joining) for the same internship.
      return {
        success: false,
        studentName: student.name,
        error: `Certificate already issued for ${internship.title}. Enable "Revoke & Re-issue" to overwrite.`,
      };
    }
  }

  // Resolve fields matching the real generation path (Phase 0 fix)
  const resolvedFields = await _resolveCertificateFields(application, { grade, skillsAcquired, performance }, template.defaultFieldValues);

  // Download custom background if template has one
  if (template.backgroundImageUrl) {
    try {
      backgroundImageBuffer = await r2Service.downloadFile(template.backgroundImageUrl);
    } catch (dlErr) {
      logger.warn(`Failed to download template background, falling back to classic: ${dlErr.message}`);
      backgroundImageBuffer = null;
    }
  }

  // Generate unique credentials
  const certificateId = generateSecureCertificateId();
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certificateId}`;

  // Generate secure base64 QR Code
  const qrCodeBase64 = await generateQRCode(verificationUrl);

  // Compile high-resolution Landscape A4 PDF Buffer
  const completionDate = new Date();
  const pdfBuffer = await buildCertificatePDF({
    certificateId,
    completionDate,
    qrCodeBase64,
    backgroundImageBuffer,
    layout: template.layout,
    typography: template.typography,
    overlays: template.overlays || [],
    canvasWidth: template.width || 842,
    canvasHeight: template.height || 595,
    pageFormat: template.pageFormat,
    orientation: template.orientation,
    ...resolvedFields,
    ...customFields,
  });

  // Upload PDF buffer to R2 object storage
  const { publicId, secureUrl } = await r2Service.uploadFile(
    pdfBuffer,
    'internhub/certificates',
    'image'
  );

  // Generate verification hash for tamper detection
  const verificationHash = generateVerificationHash({
    certificateId,
    studentName: student.name,
    internshipTitle: internship.title,
    completionDate,
  });

  // Write Certificate record to Database
  let certificate;
  try {
    certificate = await Certificate.create({
      certificateId,
      student: student._id,
      internship: internship._id,
      guide: guideId,
      template: template._id,
      studentName: student.name,
      internshipTitle: internship.title,
      duration: internship.duration || '3 Months',
      completionDate,
      grade: resolvedFields.grade,
      skillsAcquired: resolvedFields.skillsAcquiredArray,
      performance: resolvedFields.performance,
      verificationUrl,
      qrCodeDataUrl: qrCodeBase64,
      pdfUrl: secureUrl,
      pdfPublicId: publicId,
      verificationHash,
      issuedBy: issuerId,
      status: 'issued',
      documentType: template?.documentCategory || 'certificate',
    });
  } catch (dbError) {
    logger.error(`Database failure while issuing certificate, attempting to rollback R2 upload...`, dbError);
    try {
      await r2Service.deleteFile(publicId, 'image');
    } catch (cleanupErr) {
      logger.error(`CRITICAL: Orphaned R2 artifact ${publicId}. Cleanup failed!`, cleanupErr);
    }
    throw dbError;
  }

  // Record Audit Log
  await AuditLog.create({
    admin: issuerId,
    action: 'issue_certificate',
    targetModel: 'Certificate',
    targetId: certificate._id,
    changes: { certificateId },
    ipAddress: null, // Controller caller could pass IP, keeping it null for now
  });

  const docTypeName = template?.documentCategory?.replace('_', ' ') || 'certificate';

  // Send in-app notification
  await Notification.create({
    user: student._id,
    title: `${docTypeName.charAt(0).toUpperCase() + docTypeName.slice(1)} Issued! 🎓`,
    message: `Your ${docTypeName} for "${internship.title}" is now ready for download!`,
    type: 'certificate',
    link: '/student/certificates',
  });

  // Send certificate delivery email with PDF link (non-blocking)
  emailService
    .sendCertificateDelivery(student, internship.title, certificateId, secureUrl)
    .catch((err) => logger.error(`Certificate email failed for ${student.email}:`, err));

  logger.info(`Certificate generated & issued: ${certificateId} for student ${student.email}`);

  return { success: true, certificate };
};

/**
 * @desc    Generate a certificate for a student (Admin only)
 * @route   POST /api/certificates/generate
 * @access  Admin
 */
const generateCertificate = async (req, res, next) => {
  try {
    const { applicationId, grade, skillsAcquired, performance, templateId, overwrite, ...customFields } = req.body;

    if (!applicationId) {
      return next(ApiError.badRequest('applicationId is required.'));
    }

    // Fetch student application
    const application = await Application.findById(applicationId)
      .populate('user')
      .populate('internship');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    const result = await _generateSingleCertificate({
      application,
      grade,
      skillsAcquired,
      performance,
      templateId,
      issuerId: req.user.id,
      overwrite: overwrite === true,
      customFields,
    });

    if (!result.success) {
      return next(ApiError.conflict(result.error));
    }

    ApiResponse.success(res, 201, 'Certificate generated and issued successfully.', result.certificate);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk generate certificates for multiple students
 * @route   POST /api/certificates/bulk-generate
 * @access  Admin
 */
const bulkGenerate = async (req, res, next) => {
  try {
    const { applicationIds, grade, skillsAcquired, performance, templateId, overwrite, ...customFields } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return next(ApiError.badRequest('At least one applicationId is required.'));
    }

    if (applicationIds.length > BULK_GENERATION_LIMIT) {
      return next(ApiError.badRequest(`Maximum ${BULK_GENERATION_LIMIT} certificates per batch.`));
    }

    const results = {
      total: applicationIds.length,
      succeeded: 0,
      failed: 0,
      details: [],
    };

    // Resolve the template once for the whole batch
    let batchTemplate = null;
    if (templateId) {
      batchTemplate = await CertificateTemplate.findById(templateId);
      if (!batchTemplate) return next(ApiError.badRequest('Selected template not found.'));
    } else {
      batchTemplate = await CertificateTemplate.findOne({ isDefault: true, status: 'active' });
      if (!batchTemplate) return next(ApiError.badRequest('No active default template found.'));
    }

    // Process with bounded concurrency (e.g. 4 at a time)
    const CONCURRENCY_LIMIT = 4;
    for (let i = 0; i < applicationIds.length; i += CONCURRENCY_LIMIT) {
      const chunk = applicationIds.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        chunk.map(async (appId) => {
          try {
            const application = await Application.findById(appId)
              .populate('user')
              .populate('internship');

            if (!application) {
              results.failed++;
              results.details.push({ applicationId: appId, success: false, error: 'Application not found' });
              return;
            }

            const result = await _generateSingleCertificate({
              application,
              grade,
              skillsAcquired,
              performance,
              resolvedTemplate: batchTemplate,
              issuerId: req.user.id,
              overwrite: overwrite === true,
              customFields,
            });

            if (result.success) {
              results.succeeded++;
              results.details.push({
                applicationId: appId,
                studentName: result.certificate.studentName,
                certificateId: result.certificate.certificateId,
                success: true,
              });
            } else {
              results.failed++;
              results.details.push({
                applicationId: appId,
                studentName: result.studentName,
                success: false,
                error: result.error,
              });
            }
          } catch (genErr) {
            results.failed++;
            results.details.push({
              applicationId: appId,
              success: false,
              error: genErr.message || 'Generation failed',
            });
            logger.error(`Bulk generation failed for app ${appId}:`, genErr);
          }
        })
      );
    }

    await AuditLog.create({
      admin: req.user.id,
      action: 'bulk_issue_certificates',
      targetModel: 'Certificate',
      targetId: batchTemplate._id, // linking to the template used
      changes: { 
        totalAttempted: results.total,
        succeeded: results.succeeded,
        failed: results.failed 
      },
    });

    logger.info(`Bulk certificate generation: ${results.succeeded}/${results.total} succeeded by ${req.user.email}`);

    ApiResponse.success(
      res,
      201,
      `Bulk generation complete: ${results.succeeded} issued, ${results.failed} failed.`,
      results
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview certificate without saving (returns PDF as base64)
 * @route   POST /api/certificates/preview
 * @access  Admin
 */
const previewCertificate = async (req, res, next) => {
  try {
    const { applicationId, grade, skillsAcquired, performance, templateId, ...customFields } = req.body;

    if (!applicationId) {
      return next(ApiError.badRequest('applicationId is required.'));
    }

    const application = await Application.findById(applicationId)
      .populate('user')
      .populate('internship');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    const student = application.user;
    const internship = application.internship;

    // Resolve template
    let template = null;
    let backgroundImageBuffer = null;

    if (templateId) {
      template = await CertificateTemplate.findById(templateId);
    }
    if (!template) {
      template = await CertificateTemplate.findOne({ isDefault: true, status: 'active' });
    }

    if (template?.backgroundImageUrl) {
      try {
        backgroundImageBuffer = await r2Service.downloadFile(template.backgroundImageUrl);
      } catch {
        backgroundImageBuffer = null;
      }
    }

    // Resolve fields similarly to _generateSingleCertificate
    const resolvedFields = await _resolveCertificateFields(application, { grade, skillsAcquired, performance }, template?.defaultFieldValues);

    const previewCertId = 'CERT-PREVIEW-00000000';
    const previewVerifUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${previewCertId}`;
    const qrCodeBase64 = await generateQRCode(previewVerifUrl);

    const pdfBuffer = await buildCertificatePDF({
      certificateId: previewCertId,
      completionDate: new Date(),
      qrCodeBase64,
      backgroundImageBuffer,
      layout: template?.layout || {},
      typography: template?.typography || {},
      overlays: template?.overlays || [],
      canvasWidth: template?.width || 842,
      canvasHeight: template?.height || 595,
      pageFormat: template?.pageFormat,
      orientation: template?.orientation,
      ...resolvedFields,
      ...customFields,
    });

    const base64Pdf = pdfBuffer.toString('base64');

    ApiResponse.success(res, 200, 'Preview generated successfully.', {
      pdfBase64: base64Pdf,
      studentName: student.name,
      internshipTitle: internship.title,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all certificates issued to the current student
 * @route   GET /api/certificates/my
 * @access  Private (Student)
 */
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      student: req.user.id,
      status: 'issued',
    })
      .populate('internship', 'title category mode')
      .populate('guide', 'name email')
      .sort({ issuedAt: -1 });

    ApiResponse.success(res, 200, 'Certificates fetched successfully.', certificates);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all certificates (Admin listing with search/filter)
 * @route   GET /api/certificates/admin/all
 * @access  Admin
 */
const getAllCertificates = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && ['draft', 'issued', 'revoked'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { studentName: { $regex: escapedSearch, $options: 'i' } },
        { internshipTitle: { $regex: escapedSearch, $options: 'i' } },
        { certificateId: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const total = await Certificate.countDocuments(filter);

    const certificates = await Certificate.find(filter)
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)))
      .populate('student', 'name email')
      .populate('internship', 'title')
      .populate('issuedBy', 'name email');

    ApiResponse.success(res, 200, 'Certificates fetched successfully.', certificates, ApiResponse.paginate(
      parseInt(page), Math.min(100, parseInt(limit)), total
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public verification lookup portal
 * @route   GET /api/certificates/verify/:certificateId
 * @access  Public
 */
const verifyCertificatePublic = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    })
      .populate('internship', 'title description duration mode')
      .lean();

    if (!certificate) {
      return next(ApiError.notFound('Verification failed. Certificate record not found.'));
    }

    ApiResponse.success(res, 200, 'Certificate verification succeeded.', {
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      internshipTitle: certificate.internshipTitle,
      duration: certificate.duration,
      completionDate: certificate.completionDate,
      grade: certificate.grade,
      skillsAcquired: certificate.skillsAcquired,
      status: certificate.status,
      issuedAt: certificate.issuedAt,
      pdfUrl: certificate.pdfUrl,
      verificationHash: certificate.verificationHash,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke an issued certificate (Admin only)
 * @route   PUT /api/certificates/:id/revoke
 * @access  Admin
 */
const revokeCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return next(ApiError.notFound('Certificate not found.'));
    }

    if (certificate.status === 'revoked') {
      return next(ApiError.conflict('Certificate is already revoked.'));
    }

    certificate.status = 'revoked';
    await certificate.save();

    await AuditLog.create({
      admin: req.user.id,
      action: 'revoke_certificate',
      targetModel: 'Certificate',
      targetId: certificate._id,
      changes: { status: 'revoked', certificateId: certificate.certificateId },
    });

    logger.warn(`Admin ${req.user.email} revoked certificate: ${certificate.certificateId}`);

    ApiResponse.success(res, 200, 'Certificate revoked successfully.', certificate);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Proxy download certificate PDF from Drive
 * @route   GET /api/certificates/:id/download
 * @access  Private
 */
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return next(ApiError.notFound('Certificate not found.'));
    }

    // Students can only download their own certificates
    if (req.user.role === 'student' && certificate.student.toString() !== req.user.id) {
      return next(ApiError.forbidden('You can only download your own certificates.'));
    }

    if (!certificate.pdfPublicId || !certificate.pdfUrl) {
      return next(ApiError.notFound('Certificate PDF not available.'));
    }

    const buffer = await r2Service.downloadFile(certificate.pdfUrl);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Certificate_${certificate.certificateId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duplicate an existing template
 * @route   POST /api/certificates/templates/:id/duplicate
 * @access  Admin
 */
const duplicateTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }

    const copy = new CertificateTemplate({
      ...template.toObject(),
      _id: undefined,
      name: `${template.name} (Copy)`,
      isDefault: false,
      status: 'active',
      createdBy: req.user.id,
      fileHash: '', // Clear to prevent false duplicate detection on re-upload
      createdAt: undefined,
      updatedAt: undefined,
    });

    await copy.save();

    logger.info(`Template duplicated: ${template.name} -> ${copy.name} by ${req.user.email}`);
    ApiResponse.success(res, 201, 'Template duplicated successfully.', copy);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test render a template with mock data
 * @route   GET /api/certificates/templates/:id/test-render
 * @access  Admin
 */
const testRenderTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return next(ApiError.notFound('Template not found.'));
    }

    let backgroundImageBuffer = null;
    if (template.backgroundImageUrl) {
      try {
        backgroundImageBuffer = await r2Service.downloadFile(template.backgroundImageUrl);
      } catch (dlErr) {
        logger.warn(`Failed to download template background for test render: ${dlErr.message}`);
      }
    }

    const mockData = {
      certificateId: 'TEST-12345-RENDER',
      studentName: 'John Doe',
      internshipTitle: 'Software Engineering Internship',
      collegeName: 'Test University',
      companyName: 'InternHub',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      endDate: new Date(),
      duration: '3 Months',
      guideName: 'Jane Smith',
      grade: template.defaultFieldValues?.grade || 'A+',
      skillsAcquired: template.defaultFieldValues?.skillsAcquired || ['React', 'Node.js', 'MongoDB'],
      performance: template.defaultFieldValues?.performance || 'Outstanding',
      completionDate: new Date(),
      qrCodeBase64: await generateQRCode('https://example.com/verify/TEST-12345-RENDER'),
      backgroundImageBuffer,
      layout: template.layout,
      typography: template.typography,
      overlays: template.overlays || [],
      canvasWidth: template.width || 842,
      canvasHeight: template.height || 595,
      pageFormat: template.pageFormat,
      orientation: template.orientation,
    };

    const pdfBuffer = await buildCertificatePDF(mockData);

    ApiResponse.success(res, 200, 'Test render generated successfully.', {
      pdfBase64: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  getTemplateStats,
  createTemplate,
  duplicateTemplate,
  testRenderTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateStatus,
  downloadTemplate,
  generateCertificate,
  bulkGenerate,
  previewCertificate,
  getMyCertificates,
  getAllCertificates,
  verifyCertificatePublic,
  revokeCertificate,
  downloadCertificate,
  _generateSingleCertificate,
};

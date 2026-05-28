const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');
const driveService = require('../services/driveService');
const { generateQRCode, buildCertificatePDF } = require('../services/certificateService');
const { DRIVE_FOLDERS } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

// ─────────────────────────────────────────────────────────────
// Template CRUD Handlers
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all certificate templates
 * @route   GET /api/certificates/templates
 * @access  Admin
 */
const getTemplates = async (req, res, next) => {
  try {
    const templates = await CertificateTemplate.find()
      .sort({ isDefault: -1, createdAt: -1 })
      .populate('createdBy', 'name email');

    ApiResponse.success(res, 200, 'Templates fetched successfully.', templates);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new certificate template
 * @route   POST /api/certificates/templates
 * @access  Admin
 *
 * Accepts base64 background image and uploads it to Google Drive.
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
    } = req.body;

    if (!name || !name.trim()) {
      return next(ApiError.badRequest('Template name is required.'));
    }

    let backgroundImageUrl = '';
    let backgroundImageDriveId = '';

    // Upload background image to Drive if provided
    if (backgroundImage) {
      const imageBuffer = Buffer.from(
        backgroundImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      const fileName = `CertTemplate_${name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      const { fileId, webViewLink } = await driveService.uploadFile(
        imageBuffer,
        fileName,
        'image/png',
        DRIVE_FOLDERS.CERTIFICATES
      );
      backgroundImageUrl = webViewLink;
      backgroundImageDriveId = fileId;
    }

    // If marking as default, un-default all others
    if (isDefault) {
      await CertificateTemplate.updateMany({}, { isDefault: false });
    }

    const template = await CertificateTemplate.create({
      name: name.trim(),
      description: description?.trim() || '',
      backgroundImageUrl,
      backgroundImageDriveId,
      width: width || 842,
      height: height || 595,
      layout: layout || {},
      typography: typography || {},
      overlays: overlays || [],
      metadata: metadata || {},
      isDefault: isDefault || false,
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

    const { name, description, layout, typography, isDefault, backgroundImage, overlays, metadata, width, height } = req.body;

    if (name) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (width) template.width = width;
    if (height) template.height = height;

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

    // Handle new background image upload
    if (backgroundImage) {
      // Delete old background from Drive
      if (template.backgroundImageDriveId) {
        await driveService.deleteFile(template.backgroundImageDriveId).catch(() => {});
      }
      const imageBuffer = Buffer.from(
        backgroundImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      const fileName = `CertTemplate_${template.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      const { fileId, webViewLink } = await driveService.uploadFile(
        imageBuffer,
        fileName,
        'image/png',
        DRIVE_FOLDERS.CERTIFICATES
      );
      template.backgroundImageUrl = webViewLink;
      template.backgroundImageDriveId = fileId;
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

    // Clean up Drive file
    if (template.backgroundImageDriveId) {
      await driveService.deleteFile(template.backgroundImageDriveId).catch((err) => {
        logger.warn(`Failed to delete template background from Drive: ${err.message}`);
      });
    }

    await CertificateTemplate.findByIdAndDelete(req.params.id);

    logger.info(`Certificate template deleted: ${template.name} by ${req.user.email}`);
    ApiResponse.success(res, 200, 'Template deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Certificate Generation & Lifecycle Handlers
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Generate a certificate for a student (Admin only)
 * @route   POST /api/certificates/generate
 * @access  Admin
 */
const generateCertificate = async (req, res, next) => {
  try {
    const { applicationId, grade, skillsAcquired, templateId } = req.body;

    if (!applicationId) {
      return next(ApiError.badRequest('applicationId is required.'));
    }

    // 1. Fetch student application
    const application = await Application.findById(applicationId)
      .populate('user')
      .populate('internship');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    // Verify enrollment status
    if (!['Joined', 'Payment Completed'].includes(application.status)) {
      return next(
        ApiError.badRequest(
          `Cannot generate certificate. Student enrollment status is "${application.status}" (must be Completed or Joined).`
        )
      );
    }

    const student = application.user;
    const internship = application.internship;

    // 2. Check duplicate certificate
    const existingCert = await Certificate.findOne({
      student: student._id,
      internship: internship._id,
      status: 'issued',
    });

    if (existingCert) {
      return next(
        ApiError.conflict(
          `A certificate has already been issued to this student for ${internship.title}.`
        )
      );
    }

    // 3. Resolve assigned guide details
    let guideName = '';
    let guideId = null;
    if (student.assignedGuide) {
      const guide = await User.findById(student.assignedGuide);
      if (guide) {
        guideName = guide.name;
        guideId = guide._id;
      }
    }

    // 4. Resolve template (custom or default fallback)
    let template = null;
    let backgroundImageBuffer = null;

    if (templateId) {
      template = await CertificateTemplate.findById(templateId);
      if (!template) {
        return next(ApiError.notFound('Selected certificate template not found.'));
      }
    } else {
      template = await CertificateTemplate.findOne({ isDefault: true });
    }

    if (!template) {
      // Create a default fallback template placeholder if none exists
      template = await CertificateTemplate.create({
        name: 'Classical Gold Border',
        isDefault: true,
        createdBy: req.user.id,
      });
    }

    // Download custom background if template has one
    if (template.backgroundImageDriveId) {
      try {
        backgroundImageBuffer = await driveService.downloadFile(template.backgroundImageDriveId);
      } catch (dlErr) {
        logger.warn(`Failed to download template background, falling back to classic: ${dlErr.message}`);
        backgroundImageBuffer = null;
      }
    }

    // 5. Generate unique credentials
    const timestamp = Date.now().toString().slice(-4);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateId = `CERT-${timestamp}-${randomHex}`;

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certificateId}`;

    // 6. Generate secure base64 QR Code
    const qrCodeBase64 = await generateQRCode(verificationUrl);

    // 7. Compile high-resolution Landscape A4 PDF Buffer
    const pdfBuffer = await buildCertificatePDF({
      certificateId,
      studentName: student.name,
      internshipTitle: internship.title,
      duration: internship.duration || '3 Months',
      completionDate: new Date(),
      grade: grade || 'A',
      guideName,
      qrCodeBase64,
      backgroundImageBuffer,
      layout: template.layout,
      typography: template.typography,
      overlays: template.overlays || [],
      canvasWidth: template.width || 842,
      canvasHeight: template.height || 595,
    });

    // 8. Upload PDF buffer directly to Google Drive
    const fileName = `Certificate_${student.name.replace(/\s+/g, '_')}_${certificateId}.pdf`;
    const mimeType = 'application/pdf';

    const { fileId, webViewLink } = await driveService.uploadFile(
      pdfBuffer,
      fileName,
      mimeType,
      DRIVE_FOLDERS.CERTIFICATES
    );

    // 9. Write Certificate Audit logs into Database
    const certificate = await Certificate.create({
      certificateId,
      student: student._id,
      internship: internship._id,
      guide: guideId,
      template: template._id,
      studentName: student.name,
      internshipTitle: internship.title,
      duration: internship.duration || '3 Months',
      completionDate: new Date(),
      grade: grade || 'A',
      skillsAcquired: skillsAcquired || [],
      verificationUrl,
      qrCodeDataUrl: qrCodeBase64,
      pdfUrl: webViewLink,
      pdfDriveId: fileId,
      issuedBy: req.user.id,
      status: 'issued',
    });

    // 10. Send in-app notification
    await Notification.create({
      user: student._id,
      title: 'Certificate Issued! 🎓',
      message: `Your certificate of completion for "${internship.title}" is now ready for download!`,
      type: 'certificate',
      link: '/student/calendar',
    });

    // Send styled congratulations email (non-blocking)
    emailService
      .sendReminderEmail(
        student,
        'Certificate of Completion Issued! 🎓',
        `Congratulations on successfully completing your internship at InternHub! Your certificate of completion for "${internship.title}" (Grade: ${grade || 'A'}) has been successfully generated and is now available on your portfolio dashboard.`
      )
      .catch((err) => logger.error(`Congratulations email failed for ${student.email}:`, err));

    logger.info(`Certificate generated & issued: ${certificateId} for student ${student.email}`);

    ApiResponse.success(res, 201, 'Certificate generated and issued successfully.', certificate);
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
      .populate('guide', 'name email');

    ApiResponse.success(res, 200, 'Certificates fetched successfully.', certificates);
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

    certificate.status = 'revoked';
    await certificate.save();

    logger.warn(`Admin ${req.user.email} revoked certificate: ${certificate.certificateId}`);

    ApiResponse.success(res, 200, 'Certificate revoked successfully.', certificate);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  getMyCertificates,
  verifyCertificatePublic,
  revokeCertificate,
};

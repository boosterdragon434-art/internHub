const mongoose = require('mongoose');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');
const Counter = require('../models/Counter');
const Cooldown = require('../models/Cooldown');
const PaymentRequest = require('../models/PaymentRequest');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const r2Service = require('../services/r2Service');
const emailService = require('../services/emailService');
const csvService = require('../services/csvService');
const {
  generateQRCode,
  buildCertificatePDF,
  generateVerificationHash,
} = require('../services/certificateService');
const { APPLICATION_STATUS, PAGINATION, INTERNSHIP_CERT_PREFIX } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Generate a sequential internship certificate ID.
 * Format: FWT-INT-YYYY-XXXX (e.g., FWT-INT-2026-0001)
 * @returns {Promise<string>}
 */
const generateInternshipCertId = async () => {
  const seq = await Counter.getNextSequence('internship_certificate');
  const year = new Date().getFullYear();
  const paddedSeq = String(seq).padStart(4, '0');
  return `${INTERNSHIP_CERT_PREFIX}-${year}-${paddedSeq}`;
};

/**
 * @desc    Submit application
 * @route   POST /api/applications
 * @access  Student
 */
const createApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { internship: internshipId } = req.body;

    // Check internship exists and is active
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return next(ApiError.notFound('Internship not found.'));
    }
    if (internship.status !== 'active') {
      return next(ApiError.badRequest('This internship is no longer accepting applications.'));
    }
    if (internship.filledPositions >= internship.openings) {
      return next(ApiError.badRequest('No openings available for this internship.'));
    }

    // Check Cooldown model for specific student and internship
    const activeCooldown = await Cooldown.findOne({
      student: userId,
      internship: internshipId,
      expiresAt: { $gt: new Date() },
    });

    if (activeCooldown) {
      const remainingHours = Math.ceil((activeCooldown.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      return next(
        ApiError.conflict(
          `You are in a cooldown period for this internship. Please wait ${remainingHours} hour(s) before applying again. Reason: ${activeCooldown.reason}`
        )
      );
    }

    // Upload resume to Cloudinary
    let resumeUrl = '';
    let resumePublicId = '';
    if (req.file) {
      const result = await r2Service.uploadFile(
        req.file.buffer,
        'internhub/resumes',
        'auto'
      );
      resumeUrl = result.secureUrl;
      resumePublicId = result.publicId;
    }

    const {
      name,
      email,
      phone,
      college,
      department,
      yearOfStudy,
      skills,
      joiningDate,
      // New fields from multi-step form
      motivation,
      relevantExperience,
      portfolioUrl,
      availableFrom,
      hoursPerWeek,
      preferredMode,
      confirmAccuracy,
    } = req.body;

    const application = await Application.create({
      user: userId,
      internship: internshipId,
      name,
      email,
      phone,
      college,
      department,
      yearOfStudy,
      skills,
      joiningDate,
      resumeUrl,
      resumePublicId,
      // New fields
      motivation: motivation || '',
      relevantExperience: relevantExperience || '',
      portfolioUrl: portfolioUrl || '',
      availableFrom: availableFrom || null,
      hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek, 10) : 20,
      preferredMode: preferredMode || 'Remote',
      confirmAccuracy: confirmAccuracy === 'true' || confirmAccuracy === true,
    });

    // Create notification
    await Notification.create({
      user: userId,
      title: 'Application Submitted',
      message: `Your application for ${internship.title} has been submitted successfully.`,
      type: 'application',
      link: '/student/applications',
    });

    // Send confirmation email (non-blocking via setImmediate)
    setImmediate(() => {
      emailService.sendInternshipConfirmation(req.user, internship.title).catch((err) => {
        logger.error(`Failed to send application confirmation email to ${req.user.email}:`, err);
      });
    });

    ApiResponse.success(res, 201, 'Application submitted successfully.', application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's own applications
 * @route   GET /api/applications/my
 * @access  Student
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate('internship', 'title category mode duration fees imageUrl')
      .sort('-createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Applications fetched successfully.', applications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications (admin)
 * @route   GET /api/applications
 * @access  Admin
 */
const getAllApplications = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      status,
      internship,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};
    if (status) filter.status = status;
    if (internship) filter.internship = internship;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('internship', 'title category mode duration')
      .populate('user', 'name email')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Applications fetched successfully.',
      applications,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single application
 * @route   GET /api/applications/:id
 * @access  Admin
 */
const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('internship')
      .populate('user', 'name email phone college');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    ApiResponse.success(res, 200, 'Application fetched successfully.', application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status
 * @route   PUT /api/applications/:id/status
 * @access  Admin
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const application = await Application.findById(req.params.id).populate('internship', 'title startDate');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    application.status = status;
    if (adminNotes !== undefined) application.adminNotes = adminNotes;
    await application.save();

    const user = await User.findById(application.user);

    // Send status-specific emails and notifications (non-blocking)
    if (status === APPLICATION_STATUS.APPROVED) {
      await Notification.create({
        user: application.user,
        title: 'Application Approved! 🎉',
        message: `Your application for ${application.internship.title} has been approved.`,
        type: 'application',
        link: '/student/applications',
      });
      setImmediate(() => {
        emailService.sendInternshipApproval(user, application.internship.title, application.internship.startDate).catch(() => {});
      });
    } else if (status === APPLICATION_STATUS.REJECTED) {
      await Notification.create({
        user: application.user,
        title: 'Application Update',
        message: `Your application for ${application.internship.title} has been reviewed.`,
        type: 'application',
        link: '/student/applications',
      });
      setImmediate(() => {
        emailService.sendApplicationRejected(user, application.internship.title).catch(() => {});
      });
    } else if (status === APPLICATION_STATUS.JOINED) {
      // Increment filled positions
      await Internship.findByIdAndUpdate(application.internship._id, {
        $inc: { filledPositions: 1 },
      });
      setImmediate(() => {
        emailService.sendJoiningConfirmation(user, application.internship.title).catch(() => {});
      });
    }

    ApiResponse.success(res, 200, 'Application status updated.', application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark application as completed — generates certificate + sends delivery email
 * @route   PUT /api/applications/:id/complete
 * @access  Admin
 */
const completeApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('user')
      .populate('internship');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    if (application.status === APPLICATION_STATUS.COMPLETED) {
      return next(ApiError.conflict('This application is already marked as completed.'));
    }

    const student = application.user;
    const internship = application.internship;

    // ── Generate Internship Completion Certificate ──
    const certificateId = await generateInternshipCertId();
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certificateId}`;
    const qrCodeBase64 = await generateQRCode(verificationUrl);

    // Resolve template
    let template = null;
    let backgroundImageBuffer = null;

    template = await CertificateTemplate.findOne({ isDefault: true, status: 'active' });
    if (!template) {
      template = await CertificateTemplate.create({
        name: 'Classical Gold Border',
        isDefault: true,
        createdBy: req.user.id,
      });
    }

    if (template.backgroundImageUrl) {
      try {
        backgroundImageBuffer = await r2Service.downloadFile(template.backgroundImageUrl);
      } catch (dlErr) {
        logger.warn(`Failed to download template background, using classic: ${dlErr.message}`);
      }
    }

    // Resolve guide
    let guideName = '';
    let guideId = null;
    if (student.assignedGuide) {
      const guide = await User.findById(student.assignedGuide);
      if (guide) {
        guideName = guide.name;
        guideId = guide._id;
      }
    }

    const completionDate = new Date();
    const pdfBuffer = await buildCertificatePDF({
      certificateId,
      studentName: student.name,
      internshipTitle: internship.title,
      duration: internship.duration || '3 Months',
      completionDate,
      grade: req.body.grade || 'A',
      guideName,
      qrCodeBase64,
      backgroundImageBuffer,
      layout: template.layout,
      typography: template.typography,
      overlays: template.overlays || [],
      canvasWidth: template.width || 842,
      canvasHeight: template.height || 595,
      pageFormat: template.pageFormat,
      orientation: template.orientation,
      startDate: internship.startDate,
      endDate: internship.endDate,
      collegeName: application.college || student.college || 'Institution',
      companyName: 'FWT iZON',
      skills: (application.skills || student.skills || []).join(', '),
      performance: req.body.performance || 'Good',
    });

    // Upload PDF to Cloudinary (Outside Transaction to avoid long locks)
    const { publicId, secureUrl } = await r2Service.uploadFile(
      pdfBuffer,
      'internhub/certificates',
      'image'
    );

    // Generate verification hash
    const verificationHash = generateVerificationHash({
      certificateId,
      studentName: student.name,
      internshipTitle: internship.title,
      completionDate,
    });

    // ── START DATABASE TRANSACTION ──
    const session = await mongoose.startSession();
    session.startTransaction();

    let certificate;
    try {
      // Create certificate record
      const certs = await Certificate.create([{
        certificateId,
        student: student._id,
        internship: internship._id,
        guide: guideId,
        template: template._id,
        studentName: student.name,
        internshipTitle: internship.title,
        duration: internship.duration || '3 Months',
        completionDate,
        grade: req.body.grade || 'A',
        skillsAcquired: application.skills || [],
        performance: req.body.performance || 'Good',
        verificationUrl,
        qrCodeDataUrl: qrCodeBase64,
        pdfUrl: secureUrl,
        pdfPublicId: publicId,
        verificationHash,
        issuedBy: req.user.id,
        status: 'issued',
        documentType: 'certificate',
      }], { session });
      certificate = certs[0];

      // Update application status and certificate URL
      application.status = APPLICATION_STATUS.COMPLETED;
      application.certificateUrl = secureUrl;
      await application.save({ session });

      // Create notification
      await Notification.create([{
        user: student._id,
        title: 'Internship Completed! 🎓',
        message: `Congratulations! Your certificate for "${internship.title}" is ready for download.`,
        type: 'certificate',
        link: '/student/certificates',
      }], { session });

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }
    // ── END DATABASE TRANSACTION ──

    // Send certificate delivery email with PDF attachment (non-blocking)
    setImmediate(() => {
      emailService.sendCertificateDelivery(student, internship.title, certificateId, secureUrl).catch((err) => {
        logger.error(`Failed to send certificate email to ${student.email}:`, err);
      });
    });

    logger.info(`Application ${application._id} completed. Certificate ${certificateId} issued for ${student.email}`);

    ApiResponse.success(res, 200, 'Application completed and certificate issued.', {
      application,
      certificate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign payment amount to application and create PaymentRequest
 * @route   PUT /api/applications/:id/assign-payment
 * @access  Admin
 */
const assignPayment = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', deadline, notes = '' } = req.body;
    
    if (!amount || !deadline) {
      return next(ApiError.badRequest('Amount and deadline are required for payment request.'));
    }

    const application = await Application.findById(req.params.id).populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    // Check if PaymentRequest already exists and is pending
    const existingRequest = await PaymentRequest.findOne({
      application: application._id,
      status: 'pending',
    });

    if (existingRequest) {
      return next(ApiError.conflict('A pending payment request already exists for this application.'));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let paymentRequest;
    try {
      const reqs = await PaymentRequest.create([{
        application: application._id,
        student: application.user,
        internship: application.internship._id,
        amount,
        currency,
        deadline: new Date(deadline),
        notes,
      }], { session });

      paymentRequest = reqs[0];

      application.status = APPLICATION_STATUS.PAYMENT_PENDING;
      await application.save({ session });

      await AuditLog.create([{
        admin: req.user.id,
        action: 'CREATED_PAYMENT_REQUEST',
        targetModel: 'PaymentRequest',
        targetId: paymentRequest._id,
        changes: { amount, currency, deadline },
        ipAddress: req.ip,
      }], { session });

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }

    const user = await User.findById(application.user);

    // Send payment request email and notification
    await Notification.create({
      user: application.user,
      title: 'Payment Required',
      message: `Please pay ₹${amount} for ${application.internship.title} internship by ${new Date(deadline).toLocaleDateString()}.`,
      type: 'payment',
      link: '/student/payments',
    });
    setImmediate(() => {
      emailService.sendPaymentRequest(user, application.internship.title, amount).catch(() => {});
    });

    ApiResponse.success(res, 200, 'Payment amount assigned and request sent.', {
      application,
      paymentRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk action on applications
 * @route   POST /api/applications/bulk
 * @access  Admin
 */
const bulkAction = async (req, res, next) => {
  try {
    const { applicationIds, action } = req.body;

    let updateData = {};
    let message = '';

    switch (action) {
      case 'approve':
        updateData = { status: APPLICATION_STATUS.APPROVED };
        message = `${applicationIds.length} applications approved.`;
        break;
      case 'reject':
        updateData = { status: APPLICATION_STATUS.REJECTED };
        message = `${applicationIds.length} applications rejected.`;
        break;
      case 'under_review':
        updateData = { status: APPLICATION_STATUS.UNDER_REVIEW };
        message = `${applicationIds.length} applications moved to under review.`;
        break;
      case 'delete': {
        const appsToDelete = await Application.find({ _id: { $in: applicationIds } }).select('resumePublicId');
        const publicIds = appsToDelete
          .map((app) => app.resumePublicId)
          .filter((id) => !!id);

        if (publicIds.length > 0) {
          await Promise.all(
            publicIds.map(async (fileId) => {
              try {
                await r2Service.deleteFile(fileId, 'auto');
              } catch (err) {
                logger.error(`Failed to delete Cloudinary file ${fileId} during bulk delete:`, err);
              }
            })
          );
        }

        await Application.deleteMany({ _id: { $in: applicationIds } });
        return ApiResponse.success(res, 200, `${applicationIds.length} applications deleted.`);
      }
      default:
        return next(ApiError.badRequest('Invalid action.'));
    }

    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: updateData }
    );

    ApiResponse.success(res, 200, message);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export applications as CSV
 * @route   GET /api/applications/export/csv
 * @access  Admin
 */
const exportCsv = async (req, res, next) => {
  try {
    const { status, internship } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (internship) filter.internship = internship;

    const applications = await Application.find(filter)
      .populate('internship', 'title')
      .sort('-createdAt')
      .lean();

    const csv = csvService.generateApplicationsCsv(applications);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get application statistics
 * @route   GET /api/applications/stats
 * @access  Admin
 */
const getApplicationStats = async (req, res, next) => {
  try {
    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total = await Application.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Application.countDocuments({
      createdAt: { $gte: today },
    });

    // Monthly applications trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    ApiResponse.success(res, 200, 'Application statistics fetched.', {
      total,
      todayCount,
      statusCounts,
      monthlyTrend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  completeApplication,
  assignPayment,
  bulkAction,
  exportCsv,
  getApplicationStats,
};

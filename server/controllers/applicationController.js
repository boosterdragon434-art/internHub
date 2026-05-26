const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const driveService = require('../services/driveService');
const emailService = require('../services/emailService');
const csvService = require('../services/csvService');
const { APPLICATION_STATUS, PAGINATION, DRIVE_FOLDERS } = require('../config/constants');
const logger = require('../utils/logger');

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

    // Fetch cooldown settings
    const Settings = require('../models/Settings');
    let cooldownHours = 0; // Default 0 means infinite/permanent block
    try {
      const cooldownSetting = await Settings.findOne({ key: 'applicationCooldown' });
      if (cooldownSetting) {
        cooldownHours = parseInt(cooldownSetting.value, 10) || 0;
      }
    } catch (err) {
      logger.error('Failed to fetch cooldown settings:', err);
    }

    // Prevent duplicate applications within cooldown duration
    const existingApp = await Application.findOne({
      user: userId,
      internship: internshipId,
    }).sort('-createdAt');

    if (existingApp) {
      if (cooldownHours === 0) {
        return next(ApiError.conflict('You have already applied for this internship.'));
      }
      
      const timeElapsed = (Date.now() - new Date(existingApp.createdAt).getTime()) / (1000 * 60 * 60); // in hours
      if (timeElapsed < cooldownHours) {
        const remainingHours = Math.ceil(cooldownHours - timeElapsed);
        return next(
          ApiError.conflict(
            `You have already applied for this internship. Please wait ${remainingHours} hour(s) before applying again.`
          )
        );
      }
    }

    // Upload resume to Google Drive
    let resumeUrl = '';
    let resumeDriveId = '';
    if (req.file) {
      const result = await driveService.uploadFile(
        req.file.buffer,
        `resume_${req.body.name}_${Date.now()}.pdf`,
        req.file.mimetype,
        DRIVE_FOLDERS.RESUMES
      );
      resumeUrl = result.webViewLink;
      resumeDriveId = result.fileId;
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
      resumeDriveId,
    });

    // Create notification
    await Notification.create({
      user: userId,
      title: 'Application Submitted',
      message: `Your application for ${internship.title} has been submitted successfully.`,
      type: 'application',
      link: '/student/applications',
    });

    // Send confirmation email (non-blocking)
    emailService.sendApplicationSubmitted(req.user, internship.title).catch(() => {});

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
    const application = await Application.findById(req.params.id).populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    application.status = status;
    if (adminNotes !== undefined) application.adminNotes = adminNotes;
    await application.save();

    const user = await User.findById(application.user);

    // Send status-specific emails and notifications
    if (status === APPLICATION_STATUS.APPROVED) {
      await Notification.create({
        user: application.user,
        title: 'Application Approved! 🎉',
        message: `Your application for ${application.internship.title} has been approved.`,
        type: 'application',
        link: '/student/applications',
      });
      emailService.sendApplicationApproved(user, application.internship.title).catch(() => {});
    } else if (status === APPLICATION_STATUS.REJECTED) {
      await Notification.create({
        user: application.user,
        title: 'Application Update',
        message: `Your application for ${application.internship.title} has been reviewed.`,
        type: 'application',
        link: '/student/applications',
      });
      emailService.sendApplicationRejected(user, application.internship.title).catch(() => {});
    } else if (status === APPLICATION_STATUS.JOINED) {
      // Increment filled positions
      await Internship.findByIdAndUpdate(application.internship._id, {
        $inc: { filledPositions: 1 },
      });
      emailService.sendJoiningConfirmation(user, application.internship.title).catch(() => {});
    }

    ApiResponse.success(res, 200, 'Application status updated.', application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign payment amount to application
 * @route   PUT /api/applications/:id/assign-payment
 * @access  Admin
 */
const assignPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const application = await Application.findById(req.params.id).populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    application.assignedPaymentAmount = amount;
    application.status = APPLICATION_STATUS.PAYMENT_PENDING;
    application.paymentRequestSentAt = new Date();
    await application.save();

    const user = await User.findById(application.user);

    // Send payment request email and notification
    await Notification.create({
      user: application.user,
      title: 'Payment Required',
      message: `Please pay ₹${amount} for ${application.internship.title} internship.`,
      type: 'payment',
      link: '/student/payments',
    });
    emailService.sendPaymentRequest(user, application.internship.title, amount).catch(() => {});

    ApiResponse.success(res, 200, 'Payment amount assigned and request sent.', application);
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
        const appsToDelete = await Application.find({ _id: { $in: applicationIds } }).select('resumeDriveId');
        const driveIds = appsToDelete
          .map((app) => app.resumeDriveId)
          .filter((id) => !!id);

        if (driveIds.length > 0) {
          await Promise.all(
            driveIds.map(async (fileId) => {
              try {
                await driveService.deleteFile(fileId);
              } catch (err) {
                logger.error(`Failed to delete Drive file ${fileId} during bulk delete:`, err);
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
  assignPayment,
  bulkAction,
  exportCsv,
  getApplicationStats,
};

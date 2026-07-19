const mongoose = require('mongoose');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Cooldown = require('../models/Cooldown');
const PaymentRequest = require('../models/PaymentRequest');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const EnrollmentInstance = require('../models/EnrollmentInstance');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const r2Service = require('../services/r2Service');
const emailService = require('../services/emailService');
const csvService = require('../services/csvService');
const { _generateSingleCertificate } = require('./certificateController');
const { APPLICATION_STATUS, PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');

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

    // Upload resume to R2 object storage
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
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { college: { $regex: escapedSearch, $options: 'i' } },
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
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: status } },
      { $set: { status, ...(adminNotes !== undefined && { adminNotes }) } },
      { new: false, runValidators: true }
    ).populate('internship', 'title startDate');

    if (!application) {
      const exists = await Application.findById(req.params.id);
      if (exists && exists.status === status) {
        return ApiResponse.success(res, 200, 'Application status is already updated.', exists);
      }
      return next(ApiError.notFound('Application not found.'));
    }

    const oldStatus = application.status;
    application.status = status; // for email formatting and response
    if (adminNotes !== undefined) application.adminNotes = adminNotes;

    const user = await User.findById(application.user);

    // Send status-specific emails and notifications (non-blocking)
    if (status === APPLICATION_STATUS.APPROVED && oldStatus !== APPLICATION_STATUS.APPROVED) {
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
    } else if (status === APPLICATION_STATUS.REJECTED && oldStatus !== APPLICATION_STATUS.REJECTED) {
      await Notification.create({
        user: application.user,
        title: 'Application Update',
        message: `Your application for ${application.internship.title} has been reviewed.`,
        type: 'application',
        link: '/student/applications',
      });
      
      // Apply cooldown on rejection
      const setting = await Settings.findOne({ key: 'applicationCooldown' });
      const cooldownDays = setting && setting.value !== undefined ? setting.value : 0;
      if (cooldownDays > 0) {
        const expiresAt = new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000);
        await Cooldown.create({
          student: application.user,
          internship: application.internship._id,
          expiresAt,
          reason: 'Application rejected',
        });
      }

      setImmediate(() => {
        emailService.sendApplicationRejected(user, application.internship.title).catch(() => {});
      });
    } else if (status === APPLICATION_STATUS.JOINED && oldStatus !== APPLICATION_STATUS.JOINED) {
      // NOTE: filledPositions increment is handled exclusively by the payment verification flow
      // (paymentController.verifyPayment) to prevent double-increment race conditions.
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
 * @desc    Mark application as completed — delegates to the canonical certificate
 *          generation pipeline in certificateController._generateSingleCertificate
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

    // Delegate to the single canonical certificate issuance pipeline
    const result = await _generateSingleCertificate({
      application,
      grade: req.body.grade,
      skillsAcquired: req.body.skillsAcquired,
      performance: req.body.performance,
      templateId: req.body.templateId,
      issuerId: req.user.id,
      overwrite: false,
    });

    if (!result.success) {
      return next(ApiError.conflict(result.error || 'Certificate generation failed.'));
    }

    // Mark application as completed
    application.status = APPLICATION_STATUS.COMPLETED;
    application.certificateUrl = result.certificate.pdfUrl;
    await application.save();

    logger.info(`Application ${application._id} completed. Certificate ${result.certificate.certificateId} issued for ${application.user.email}`);

    ApiResponse.success(res, 200, 'Application completed and certificate issued.', {
      application,
      certificate: result.certificate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send Offer Letter
 * @route   POST /api/applications/:id/send-offer-letter
 * @access  Admin
 */
const sendOfferLetter = async (req, res, next) => {
  try {
    const { templateId } = req.body;
    if (!templateId) {
      return next(ApiError.badRequest('Template ID is required to send an offer letter.'));
    }

    const application = await Application.findById(req.params.id)
      .populate('user')
      .populate('internship');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    if (![APPLICATION_STATUS.PAYMENT_COMPLETED, APPLICATION_STATUS.JOINED].includes(application.status)) {
      return next(ApiError.badRequest('Offer letters can only be sent after payment verification (status must be Joined).'));
    }

    // Generate the offer letter using the certificate pipeline
    const result = await _generateSingleCertificate({
      application,
      templateId,
      issuerId: req.user.id,
      overwrite: false,
      skipEmail: true, // Offer letter has its own email — skip the generic certificate delivery email
    });

    if (!result.success) {
      return next(ApiError.conflict(result.error || 'Offer Letter generation failed.'));
    }

    // Ensure we set the document type in the generated Certificate record
    const Certificate = mongoose.model('Certificate');
    await Certificate.findByIdAndUpdate(result.certificate._id, {
      documentType: 'offer_letter'
    });

    // Send the email with the generated PDF
    await emailService.sendOfferLetter(application.user, application.internship.title, result.certificate.pdfUrl);

    logger.info(`Offer letter ${result.certificate.certificateId} sent to ${application.user.email}`);

    ApiResponse.success(res, 200, 'Offer letter generated and sent successfully.', {
      certificate: result.certificate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign payment amount to application and create PaymentRequest.
 *          Atomically approves the application if it is still in a pre-approved
 *          state (Applied / Under Review), so the admin can approve + assign
 *          payment in a single action without a 409 race condition.
 *          When amount === 0, auto-enrolls the student (free joining) without
 *          going through the payment flow.
 * @route   PUT /api/applications/:id/assign-payment
 * @access  Admin
 */
const assignPayment = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', deadline, notes = '' } = req.body;

    // amount is validated by Joi (>= 0); deadline is required only when amount > 0
    if (amount === undefined || amount === null) {
      return next(ApiError.badRequest('Amount is required.'));
    }
    if (amount > 0 && !deadline) {
      return next(ApiError.badRequest('Amount and deadline are required for payment request.'));
    }

    const application = await Application.findById(req.params.id)
      .populate('internship', 'title startDate endDate duration');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    // ── Guard: Determine if the application is in an assignable state ──
    const PRE_APPROVED_STATUSES = [
      APPLICATION_STATUS.APPLIED,
      APPLICATION_STATUS.UNDER_REVIEW,
    ];
    const ASSIGNABLE_STATUSES = [
      ...PRE_APPROVED_STATUSES,
      APPLICATION_STATUS.APPROVED,
    ];

    if (!ASSIGNABLE_STATUSES.includes(application.status)) {
      return next(
        ApiError.conflict(
          `Payment cannot be assigned to applications with status "${application.status}". ` +
          'Only Applied, Under Review, or Approved applications are eligible.'
        )
      );
    }

    const needsApproval = PRE_APPROVED_STATUSES.includes(application.status);
    const originalStatus = application.status;

    // ── FREE ENROLLMENT BRANCH (amount === 0) ──
    if (amount === 0) {
      const session = await mongoose.startSession();
      session.startTransaction();

      let enrollment;
      try {
        // Approve if needed
        if (needsApproval) {
          application.status = APPLICATION_STATUS.APPROVED;
          await application.save({ session });

          await AuditLog.create([{
            admin: req.user.id,
            action: 'APPROVED_APPLICATION_FREE_ENROLLMENT',
            targetModel: 'Application',
            targetId: application._id,
            changes: { previousStatus: originalStatus, newStatus: APPLICATION_STATUS.APPROVED },
            ipAddress: req.ip,
          }], { session });
        }

        // Skip payment flow — directly set to Joined
        application.status = APPLICATION_STATUS.JOINED;
        await application.save({ session });

        // Increment filled positions on the internship
        await Internship.findByIdAndUpdate(
          application.internship._id,
          { $inc: { filledPositions: 1 } },
          { session }
        );

        // Compute enrollment dates (same logic as payment verification flow)
        const internshipObj = application.internship;
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Default 3 months

        if (internshipObj && internshipObj.startDate && internshipObj.endDate) {
          startDate = new Date(internshipObj.startDate);
          endDate = new Date(internshipObj.endDate);
        } else if (internshipObj && internshipObj.duration) {
          const match = internshipObj.duration.match(/(\d+)\s*(month|week)s?/i);
          if (match) {
            const durationAmount = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            if (unit === 'month') endDate.setMonth(endDate.getMonth() + durationAmount);
            if (unit === 'week') endDate.setDate(endDate.getDate() + (durationAmount * 7));
          }
        }

        // Create EnrollmentInstance — unlocks attendance, tasks, team, certificates
        const enrollments = await EnrollmentInstance.create([{
          student: application.user,
          internship: application.internship._id,
          application: application._id,
          payment: null, // No payment for free enrollment
          startDate,
          endDate,
          status: 'active',
        }], { session });

        enrollment = enrollments[0];

        await AuditLog.create([{
          admin: req.user.id,
          action: 'FREE_ENROLLMENT_CREATED',
          targetModel: 'EnrollmentInstance',
          targetId: enrollment._id,
          changes: { amount: 0, note: 'Free joining — no payment required' },
          ipAddress: req.ip,
        }], { session });

        // In-app notification
        await Notification.create([{
          user: application.user,
          title: 'You\'re Enrolled! 🚀',
          message: `You have been enrolled in ${application.internship.title} (free joining). Welcome aboard!`,
          type: 'application',
          link: '/student/dashboard',
        }], { session });

        await session.commitTransaction();
      } catch (txError) {
        await session.abortTransaction();
        throw txError;
      } finally {
        session.endSession();
      }

      // Send joining confirmation email (non-blocking, outside transaction)
      const user = await User.findById(application.user);
      if (user) {
        setImmediate(() => {
          emailService.sendJoiningConfirmation(user, application.internship.title).catch((err) => {
            logger.error(`Failed to send free joining confirmation email to ${user.email}:`, err);
          });
        });
      }

      logger.info(`Free enrollment created for application ${application._id} (${application.internship.title})`);

      return ApiResponse.success(res, 200, 'Application approved and student enrolled (free joining).', {
        application,
        enrollment,
      });
    }

    // ── PAID ENROLLMENT BRANCH (amount > 0) ──
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
      // If application was not yet approved, approve it first within the transaction
      if (needsApproval) {
        application.status = APPLICATION_STATUS.APPROVED;
        await application.save({ session });

        await AuditLog.create([{
          admin: req.user.id,
          action: 'APPROVED_APPLICATION_FOR_PAYMENT',
          targetModel: 'Application',
          targetId: application._id,
          changes: { previousStatus: originalStatus, newStatus: APPLICATION_STATUS.APPROVED },
          ipAddress: req.ip,
        }], { session });
      }

      // Create the payment request
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

      // Transition to Payment Pending
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

    // Send approval notification + email if application was just approved
    if (needsApproval && user) {
      await Notification.create({
        user: application.user,
        title: 'Application Approved! 🎉',
        message: `Your application for ${application.internship.title} has been approved.`,
        type: 'application',
        link: '/student/applications',
      });
      setImmediate(() => {
        emailService.sendInternshipApproval(user, application.internship.title, application.internship.startDate).catch((err) => {
          logger.error(`Failed to send approval email to ${user.email}:`, err);
        });
      });
    }

    // Send payment request email and notification
    await Notification.create({
      user: application.user,
      title: 'Payment Required',
      message: `Please pay ₹${amount} for ${application.internship.title} internship by ${new Date(deadline).toLocaleDateString()}.`,
      type: 'payment',
      link: '/student/payments',
    });
    if (user) {
      setImmediate(() => {
        emailService.sendPaymentRequest(user, application.internship.title, amount).catch((err) => {
          logger.error(`Failed to send payment request email to ${user.email}:`, err);
        });
      });
    }

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
                logger.error(`Failed to delete R2 file ${fileId} during bulk delete:`, err);
              }
            })
          );
        }

        // Cascade delete dependent payment records
        await PaymentRequest.deleteMany({ application: { $in: applicationIds } });
        await Payment.deleteMany({ application: { $in: applicationIds } });

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

    // Fan-out notifications for the bulk action
    setImmediate(async () => {
      try {
        const apps = await Application.find({ _id: { $in: applicationIds } })
          .populate('user')
          .populate('internship', 'title startDate');

        for (const app of apps) {
          const user = app.user;
          if (!user) continue;

          if (action === 'approve') {
            await Notification.create({
              user: user._id,
              title: 'Application Approved! 🎉',
              message: `Your application for ${app.internship.title} has been approved.`,
              type: 'application',
              link: '/student/applications',
            });
            await emailService.sendInternshipApproval(user, app.internship.title, app.internship.startDate).catch(() => {});
          } else if (action === 'reject') {
            await Notification.create({
              user: user._id,
              title: 'Application Update',
              message: `Your application for ${app.internship.title} has been reviewed.`,
              type: 'application',
              link: '/student/applications',
            });
            
            // Apply cooldown on bulk rejection
            const setting = await Settings.findOne({ key: 'applicationCooldown' });
            const cooldownDays = setting && setting.value !== undefined ? setting.value : 0;
            if (cooldownDays > 0) {
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + cooldownDays);
              await Cooldown.create({
                student: user._id,
                internship: app.internship._id,
                expiresAt,
                reason: 'Application rejected',
              });
            }

            await emailService.sendApplicationRejected(user, app.internship.title).catch(() => {});
          }
        }
      } catch (err) {
        logger.error('Failed to send bulk action notifications:', err);
      }
    });

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

/**
 * @desc    Get student's enrollment instances (active internship enrollments)
 * @route   GET /api/applications/my-enrollments
 * @access  Student
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const EnrollmentInstance = mongoose.model('EnrollmentInstance');

    const enrollments = await EnrollmentInstance.find({ student: req.user.id })
      .populate('internship', 'title category mode duration imageUrl startDate endDate')
      .populate('application', 'status name')
      .populate('assignedGuide', 'name email')
      .sort('-createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Enrollments fetched successfully.', enrollments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getMyEnrollments,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  completeApplication,
  assignPayment,
  bulkAction,
  exportCsv,
  getApplicationStats,
  sendOfferLetter,
};

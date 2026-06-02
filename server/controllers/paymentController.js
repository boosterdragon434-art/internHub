const Payment = require('../models/Payment');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const csvService = require('../services/csvService');
const { APPLICATION_STATUS, PAYMENT_STATUS, PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const mongoose = require('mongoose');

/**
 * @desc    Submit UTR for manual UPI payment verification
 * @route   POST /api/payments/submit-utr
 * @access  Student
 */
const submitUtr = async (req, res, next) => {
  try {
    const { applicationId, utrNumber } = req.body;

    if (!applicationId || !utrNumber) {
      return next(ApiError.badRequest('Application ID and UTR Number are required.'));
    }

    const application = await Application.findOne({
      _id: applicationId,
      user: req.user.id,
    }).populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    if (application.status !== APPLICATION_STATUS.PAYMENT_PENDING) {
      return next(ApiError.badRequest('Payment is not pending for this application.'));
    }

    // Check if this UTR was already submitted by ANY user (prevent reuse)
    const existingUtr = await Payment.findOne({ utrNumber });
    if (existingUtr) {
      return next(ApiError.conflict('This UTR number has already been submitted.'));
    }

    // Check for an existing pending payment record for this user/app (allow overwrite or reject)
    const existingPayment = await Payment.findOne({
      application: applicationId,
      status: PAYMENT_STATUS.PENDING_VERIFICATION,
    });

    if (existingPayment) {
      return next(ApiError.conflict('You have already submitted a UTR which is pending verification.'));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let payment;
    try {
      const payments = await Payment.create([{
        application: application._id,
        user: req.user.id,
        internship: application.internship._id,
        amount: application.assignedPaymentAmount || 0, // Fallback if 0
        utrNumber: utrNumber,
        status: PAYMENT_STATUS.PENDING_VERIFICATION,
      }], { session });
      
      payment = payments[0];

      // Update application to show verification is pending
      application.status = APPLICATION_STATUS.PAYMENT_VERIFICATION_PENDING;
      await application.save({ session });

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }

    // Notify admins (could be done later, simple log for now)
    logger.info(`User ${req.user.id} submitted UTR ${utrNumber} for app ${applicationId}`);

    ApiResponse.success(res, 201, 'Payment UTR submitted successfully. Pending admin verification.', {
      paymentId: payment._id,
      utrNumber: payment.utrNumber,
      status: payment.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin verifies (approves/rejects) manual UTR payment
 * @route   PUT /api/payments/:id/verify
 * @access  Admin
 */
const adminVerifyPayment = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const paymentId = req.params.id;

    if (!['approve', 'reject'].includes(action)) {
      return next(ApiError.badRequest('Invalid verification action. Use approve or reject.'));
    }

    const payment = await Payment.findById(paymentId)
      .populate('internship', 'title')
      .populate('application');

    if (!payment) {
      return next(ApiError.notFound('Payment record not found.'));
    }

    if (payment.status !== PAYMENT_STATUS.PENDING_VERIFICATION) {
      return next(ApiError.badRequest(`Payment is already ${payment.status}.`));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (action === 'approve') {
        payment.status = PAYMENT_STATUS.PAID;
        payment.paidAt = new Date();
        await payment.save({ session });

        // Update application
        const application = await Application.findById(payment.application._id);
        application.status = APPLICATION_STATUS.PAYMENT_COMPLETED;
        await application.save({ session });

        // Notify Student
        await Notification.create([{
          user: payment.user,
          title: 'Payment Verified ✅',
          message: `Your payment of ₹${payment.amount} for ${payment.internship.title} was verified.`,
          type: 'payment',
          link: '/student/payments',
        }], { session });

      } else if (action === 'reject') {
        payment.status = PAYMENT_STATUS.FAILED;
        await payment.save({ session });

        // Revert application status back to pending
        const application = await Application.findById(payment.application._id);
        application.status = APPLICATION_STATUS.PAYMENT_PENDING;
        await application.save({ session });

        // Notify Student
        await Notification.create([{
          user: payment.user,
          title: 'Payment Verification Failed ❌',
          message: `Your UTR ${payment.utrNumber} was rejected. Please try again or contact support.`,
          type: 'payment',
          link: '/student/payments',
        }], { session });
      }

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }

    // Send email outside transaction (non-blocking)
    if (action === 'approve') {
      const user = await User.findById(payment.user);
      if (user) {
        setImmediate(() => {
          emailService.sendPaymentSuccess(user, payment.internship.title, payment.amount).catch(() => {});
        });
      }
    }

    ApiResponse.success(res, 200, `Payment ${action}d successfully.`, {
      paymentId: payment._id,
      status: payment.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's payment history
 * @route   GET /api/payments/my
 * @access  Student
 */
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('internship', 'title category')
      .populate('application', 'name status')
      .sort('-createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Payments fetched successfully.', payments);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments (admin)
 * @route   GET /api/payments
 * @access  Admin
 */
const getAllPayments = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};
    if (status) filter.status = status;

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('internship', 'title')
      .populate('application', 'name status')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Payments fetched successfully.',
      payments,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send payment request email
 * @route   POST /api/payments/send-request/:applicationId
 * @access  Admin
 */
const sendPaymentRequest = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    if (!application.assignedPaymentAmount) {
      return next(ApiError.badRequest('No payment amount assigned to this application.'));
    }

    const user = await User.findById(application.user);
    if (!user) {
      return next(ApiError.notFound('Associated student account no longer exists.'));
    }

    await emailService.sendPaymentRequest(
      user,
      application.internship.title,
      application.assignedPaymentAmount
    );

    application.paymentRequestSentAt = new Date();
    application.status = APPLICATION_STATUS.PAYMENT_PENDING;
    await application.save();

    ApiResponse.success(res, 200, 'Payment request email sent successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export payments as CSV
 * @route   GET /api/payments/export/csv
 * @access  Admin
 */
const exportPaymentsCsv = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('internship', 'title')
      .sort('-createdAt')
      .lean();

    const csv = csvService.generatePaymentsCsv(payments);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment statistics
 * @route   GET /api/payments/stats
 * @access  Admin
 */
const getPaymentStats = async (req, res, next) => {
  try {
    const [totalRevenue, paidCount, pendingCount, failedCount, monthlyRevenue] =
      await Promise.all([
        Payment.aggregate([
          { $match: { status: PAYMENT_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.countDocuments({ status: PAYMENT_STATUS.PAID }),
        Payment.countDocuments({ status: PAYMENT_STATUS.PENDING_VERIFICATION }),
        Payment.countDocuments({ status: PAYMENT_STATUS.FAILED }),
        Payment.aggregate([
          { $match: { status: PAYMENT_STATUS.PAID } },
          {
            $group: {
              _id: {
                year: { $year: '$paidAt' },
                month: { $month: '$paidAt' },
              },
              revenue: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

    ApiResponse.success(res, 200, 'Payment statistics fetched.', {
      totalRevenue: totalRevenue[0]?.total || 0,
      paidCount,
      pendingCount,
      failedCount,
      monthlyRevenue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitUtr,
  adminVerifyPayment,
  getMyPayments,
  getAllPayments,
  sendPaymentRequest,
  exportPaymentsCsv,
  getPaymentStats,
};

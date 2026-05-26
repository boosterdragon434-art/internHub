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

/**
 * @desc    Create a Razorpay order
 * @route   POST /api/payments/create-order
 * @access  Student
 */
const createOrder = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      user: req.user.id,
    }).populate('internship', 'title');

    if (!application) {
      return next(ApiError.notFound('Application not found.'));
    }

    if (application.status !== APPLICATION_STATUS.PAYMENT_PENDING) {
      return next(ApiError.badRequest('Payment is not required for this application.'));
    }

    if (!application.assignedPaymentAmount || application.assignedPaymentAmount <= 0) {
      return next(ApiError.badRequest('No payment amount has been assigned yet.'));
    }

    // Check for existing unpaid order
    const existingPayment = await Payment.findOne({
      application: applicationId,
      status: { $in: [PAYMENT_STATUS.CREATED, PAYMENT_STATUS.ATTEMPTED] },
    });

    if (existingPayment) {
      // Return existing order for retry
      return ApiResponse.success(res, 200, 'Existing order found.', {
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    const receipt = `rcpt_${uuidv4().slice(0, 8)}`;

    let order;
    try {
      order = await paymentService.createOrder(
        application.assignedPaymentAmount,
        'INR',
        receipt,
        {
          applicationId: application._id.toString(),
          userId: req.user.id,
          internship: application.internship.title,
        }
      );
    } catch (razorpayError) {
      logger.error('Razorpay order creation failed:', razorpayError);
      return next(
        ApiError.internal('Unable to initiate payment at this time. Please try again later.')
      );
    }

    // Save payment record
    await Payment.create({
      application: application._id,
      user: req.user.id,
      internship: application.internship._id,
      amount: application.assignedPaymentAmount,
      razorpayOrderId: order.id,
      status: PAYMENT_STATUS.CREATED,
    });

    ApiResponse.success(res, 201, 'Payment order created.', {
      orderId: order.id,
      amount: application.assignedPaymentAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      applicationId: application._id,
      internshipTitle: application.internship.title,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify payment after Razorpay checkout
 * @route   POST /api/payments/verify
 * @access  Student
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return next(ApiError.badRequest('Missing payment verification data.'));
    }

    // Locate the payment record first for ownership + replay checks
    const payment = await Payment.findOne({ razorpayOrderId }).populate('internship', 'title');

    if (!payment) {
      return next(ApiError.notFound('Payment record not found.'));
    }

    // IDOR protection: ensure this payment belongs to the requesting user
    if (payment.user.toString() !== req.user.id) {
      return next(ApiError.forbidden('You are not authorized to verify this payment.'));
    }

    // Replay protection: reject if already processed
    if (payment.status === PAYMENT_STATUS.PAID) {
      return ApiResponse.success(res, 200, 'Payment has already been verified.', {
        paymentId: payment._id,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
      });
    }

    if (payment.status === PAYMENT_STATUS.FAILED || payment.status === PAYMENT_STATUS.REFUNDED) {
      return next(ApiError.badRequest('This payment cannot be verified. Please create a new order.'));
    }

    // Verify cryptographic signature
    const isValid = paymentService.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();
      return next(ApiError.badRequest('Payment verification failed. Invalid signature.'));
    }

    // Mark payment as successful
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = PAYMENT_STATUS.PAID;
    payment.paidAt = new Date();
    await payment.save();

    // Update application status
    await Application.findByIdAndUpdate(payment.application, {
      status: APPLICATION_STATUS.PAYMENT_COMPLETED,
    });

    // Create notification
    await Notification.create({
      user: req.user.id,
      title: 'Payment Successful ✅',
      message: `Payment of ₹${payment.amount} for ${payment.internship.title} received.`,
      type: 'payment',
      link: '/student/payments',
    });

    // Send success email (non-blocking)
    const user = await User.findById(req.user.id);
    if (user) {
      emailService
        .sendPaymentSuccess(user, payment.internship.title, payment.amount)
        .catch(() => {});
    }

    ApiResponse.success(res, 200, 'Payment verified successfully.', {
      paymentId: payment._id,
      amount: payment.amount,
      status: payment.status,
      paidAt: payment.paidAt,
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
        Payment.countDocuments({ status: PAYMENT_STATUS.CREATED }),
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
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  sendPaymentRequest,
  exportPaymentsCsv,
  getPaymentStats,
};

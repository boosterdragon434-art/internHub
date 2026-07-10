const Payment = require('../models/Payment');
const Application = require('../models/Application');
const PaymentRequest = require('../models/PaymentRequest');
const EnrollmentInstance = require('../models/EnrollmentInstance');
const Internship = require('../models/Internship');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const emailService = require('../services/emailService');
const csvService = require('../services/csvService');
const r2Service = require('../services/r2Service');
const { APPLICATION_STATUS, PAYMENT_STATUS, PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { validateMagicBytes } = require('../middleware/upload');

const mongoose = require('mongoose');

/**
 * Extract client IP and device info from request headers.
 * @param {import('express').Request} req
 * @returns {{ ipAddress: string, deviceInfo: string }}
 */
const extractClientMeta = (req) => ({
  ipAddress: (
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    ''
  )
    .toString()
    .split(',')[0]
    .trim()
    .substring(0, 100),
  deviceInfo: (req.headers['user-agent'] || '').substring(0, 300),
});

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

    // Require receipt screenshot
    if (!req.file) {
      return next(ApiError.badRequest('Payment receipt screenshot is required. Please upload a screenshot of your payment confirmation.'));
    }

    // Validate file magic bytes
    if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
      return next(ApiError.badRequest('Invalid file type. The uploaded file does not match its declared type.'));
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

    // Look up pending payment request
    const paymentRequest = await PaymentRequest.findOne({
      application: applicationId,
      student: req.user.id,
      status: 'pending',
    });

    if (!paymentRequest) {
      return next(ApiError.badRequest('No pending payment request found for this application.'));
    }

    if (new Date() > new Date(paymentRequest.deadline)) {
      paymentRequest.status = 'expired';
      await paymentRequest.save();
      return next(ApiError.badRequest('Payment request has expired. Please contact support.'));
    }

    // Check if this UTR was already submitted by ANY user (prevent reuse)
    const existingUtr = await Payment.findOne({ utrNumber });
    if (existingUtr) {
      return next(ApiError.conflict('This UTR number has already been submitted.'));
    }

    // Check for an existing pending payment record for this request
    const existingPayment = await Payment.findOne({
      paymentRequest: paymentRequest._id,
      status: PAYMENT_STATUS.PENDING_VERIFICATION,
    });

    if (existingPayment) {
      return next(ApiError.conflict('You have already submitted a UTR which is pending verification.'));
    }

    // Upload receipt to R2
    let receiptUrl = '';
    let receiptPublicId = '';
    try {
      const uploadResult = await r2Service.uploadFile(
        req.file.buffer,
        'internhub/payment-receipts',
        'image'
      );
      receiptUrl = uploadResult.secureUrl;
      receiptPublicId = uploadResult.publicId;
    } catch (uploadErr) {
      logger.error('Receipt upload failed:', uploadErr);
      return next(ApiError.internal('Failed to upload payment receipt. Please try again.'));
    }

    // Extract client metadata
    const clientMeta = extractClientMeta(req);

    const session = await mongoose.startSession();
    session.startTransaction();

    let payment;
    try {
      const payments = await Payment.create([{
        paymentRequest: paymentRequest._id,
        application: application._id,
        user: req.user.id,
        internship: application.internship._id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        utrNumber: utrNumber,
        status: PAYMENT_STATUS.PENDING_VERIFICATION,
        receiptUrl,
        receiptPublicId,
        ipAddress: clientMeta.ipAddress,
        deviceInfo: clientMeta.deviceInfo,
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

    logger.info(`User ${req.user.id} submitted UTR ${utrNumber} for app ${applicationId} with receipt`);

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
    const { action, reason } = req.body;
    const paymentId = req.params.id;

    if (!['approve', 'reject'].includes(action)) {
      return next(ApiError.badRequest('Invalid verification action. Use approve or reject.'));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomic status check — prevents concurrent-approval race condition
      const newStatus = action === 'approve' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;
      const updateFields = { status: newStatus };
      if (action === 'approve') {
        updateFields.paidAt = new Date();
      }
      if (action === 'reject' && reason) {
        updateFields.rejectionReason = reason;
      }

      const payment = await Payment.findOneAndUpdate(
        { _id: paymentId, status: PAYMENT_STATUS.PENDING_VERIFICATION },
        { $set: updateFields },
        { session, new: true }
      ).populate('internship', 'title').populate('application');

      if (!payment) {
        await session.abortTransaction();
        session.endSession();
        return next(ApiError.conflict('Payment has already been processed by another admin, or was not found.'));
      }

      if (action === 'approve') {
        // Update PaymentRequest
        if (payment.paymentRequest) {
          await PaymentRequest.findByIdAndUpdate(
            payment.paymentRequest,
            { status: 'paid' },
            { session }
          );
        }

        // Update application
        await Application.findByIdAndUpdate(
          payment.application._id,
          { status: APPLICATION_STATUS.JOINED },
          { session }
        );

        // Increment filled positions on the internship
        await Internship.findByIdAndUpdate(
          payment.internship._id,
          { $inc: { filledPositions: 1 } },
          { session }
        );

        // Create EnrollmentInstance
        const internshipObj = await mongoose.model('Internship').findById(payment.internship._id);
        
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months if not specified

        if (internshipObj && internshipObj.startDate && internshipObj.endDate) {
          startDate = new Date(internshipObj.startDate);
          endDate = new Date(internshipObj.endDate);
        } else if (internshipObj && internshipObj.duration) {
          // Attempt to parse duration string if dates are not provided
          const match = internshipObj.duration.match(/(\d+)\s*(month|week)s?/i);
          if (match) {
            const amount = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            if (unit === 'month') endDate.setMonth(endDate.getMonth() + amount);
            if (unit === 'week') endDate.setDate(endDate.getDate() + (amount * 7));
          }
        }

        const enrollments = await EnrollmentInstance.create([{
          student: payment.user,
          internship: payment.internship._id,
          application: payment.application._id,
          payment: payment._id,
          startDate,
          endDate,
          status: 'active',
        }], { session });

        await AuditLog.create([{
          admin: req.user.id,
          action: 'APPROVED_PAYMENT_CREATED_ENROLLMENT',
          targetModel: 'EnrollmentInstance',
          targetId: enrollments[0]._id,
          changes: { paymentId: payment._id },
          ipAddress: req.ip,
        }], { session });

        // Notify Student
        await Notification.create([{
          user: payment.user,
          title: 'Payment Verified & Enrolled ✅',
          message: `Your payment of ₹${payment.amount} for ${payment.internship.title} was verified and your enrollment is active.`,
          type: 'payment',
          link: '/student/dashboard',
        }], { session });

      } else if (action === 'reject') {
        // Revert application status back to pending
        await Application.findByIdAndUpdate(
          payment.application._id,
          { status: APPLICATION_STATUS.PAYMENT_PENDING },
          { session }
        );

        const auditChanges = { utrNumber: payment.utrNumber };
        if (reason) auditChanges.rejectionReason = reason;

        await AuditLog.create([{
          admin: req.user.id,
          action: 'REJECTED_PAYMENT',
          targetModel: 'Payment',
          targetId: payment._id,
          changes: auditChanges,
          ipAddress: req.ip,
        }], { session });

        // Notify Student with reason
        const rejectionMessage = reason
          ? `Your UTR ${payment.utrNumber} was rejected. Reason: ${reason}`
          : `Your UTR ${payment.utrNumber} was rejected. Please try again or contact support.`;

        await Notification.create([{
          user: payment.user,
          title: 'Payment Verification Failed ❌',
          message: rejectionMessage,
          type: 'payment',
          link: '/student/payments',
        }], { session });
      }

      await session.commitTransaction();

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
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's payment requests (all statuses)
 * @route   GET /api/payments/requests
 * @access  Student
 */
const getMyPaymentRequests = async (req, res, next) => {
  try {
    const requests = await PaymentRequest.find({ student: req.user.id })
      .populate('internship', 'title')
      .sort('-createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Payment requests fetched successfully.', requests);
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

    const paymentRequest = await PaymentRequest.findOne({
      application: application._id,
      status: 'pending',
    });

    if (!paymentRequest) {
      return next(ApiError.badRequest('No pending payment request found for this application.'));
    }

    const user = await User.findById(application.user);
    if (!user) {
      return next(ApiError.notFound('Associated student account no longer exists.'));
    }

    await emailService.sendPaymentRequest(
      user,
      application.internship.title,
      paymentRequest.amount
    );

    ApiResponse.success(res, 200, 'Payment request reminder email sent successfully.');
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
  getMyPaymentRequests,
  getMyPayments,
  getAllPayments,
  sendPaymentRequest,
  exportPaymentsCsv,
  getPaymentStats,
};

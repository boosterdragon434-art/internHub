const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Payment Schema — tracks Razorpay payment transactions.
 */
const paymentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: [true, 'Internship reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    receiptPublicId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

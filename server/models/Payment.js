const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Payment Schema — tracks manual UPI/G-Pay UTR verifications.
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentRequest',
      required: [true, 'PaymentRequest reference is required'],
    },
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
    utrNumber: {
      type: String,
      required: [true, 'UTR/Transaction ID is required'],
      unique: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING_VERIFICATION,
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
    // Phase 3 additions
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    deviceInfo: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
paymentSchema.index({ user: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

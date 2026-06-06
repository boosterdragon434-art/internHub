const mongoose = require('mongoose');

/**
 * PaymentRequest Schema — dynamically created payment requirement.
 */
const paymentRequestSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application is required'],
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: [true, 'Internship is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
paymentRequestSchema.index({ student: 1, status: 1 });
paymentRequestSchema.index({ deadline: 1 });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);

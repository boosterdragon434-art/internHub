const mongoose = require('mongoose');

/**
 * EmailLog Schema — tracks all sent emails for auditing.
 */
const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    type: {
      type: String,
      required: [true, 'Email type is required'],
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    error: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
emailLogSchema.index({ to: 1 });
emailLogSchema.index({ type: 1 });
emailLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);

const mongoose = require('mongoose');

/**
 * EnrollmentInstance Schema — represents an active, joined internship period.
 */
const enrollmentInstanceSchema = new mongoose.Schema(
  {
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
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application is required'],
      unique: true, // 1 application -> 1 enrollment
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    assignedGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
enrollmentInstanceSchema.index({ student: 1, internship: 1 });
enrollmentInstanceSchema.index({ status: 1 });
enrollmentInstanceSchema.index({ assignedGuide: 1 });

module.exports = mongoose.model('EnrollmentInstance', enrollmentInstanceSchema);

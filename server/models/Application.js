const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../config/constants');

/**
 * Application Schema — represents a student's application to an internship.
 */
const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: [true, 'Internship is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    yearOfStudy: {
      type: String,
      required: [true, 'Year of study is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other'],
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    resumeUrl: {
      type: String,
      default: '',
    },
    resumeDriveId: {
      type: String,
      default: '',
    },
    joiningDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
    },
    adminNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    assignedPaymentAmount: {
      type: Number,
      default: null,
    },
    paymentRequestSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
applicationSchema.index({ user: 1, internship: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ internship: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);

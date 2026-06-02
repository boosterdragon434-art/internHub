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
    resumePublicId: {
      type: String,
      default: '',
    },
    joiningDate: {
      type: Date,
    },
    // ── Step 2: Motivation fields ──
    motivation: {
      type: String,
      default: '',
      maxlength: [2000, 'Motivation cannot exceed 2000 characters'],
    },
    relevantExperience: {
      type: String,
      default: '',
      maxlength: [2000, 'Experience description cannot exceed 2000 characters'],
    },
    portfolioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    // ── Step 3: Availability fields ──
    availableFrom: {
      type: Date,
      default: null,
    },
    hoursPerWeek: {
      type: Number,
      default: 20,
      min: [10, 'Minimum 10 hours per week'],
      max: [40, 'Maximum 40 hours per week'],
    },
    preferredMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    // ── Step 4: Confirmation ──
    confirmAccuracy: {
      type: Boolean,
      default: false,
    },
    // ── Certificate (populated on completion) ──
    certificateUrl: {
      type: String,
      default: '',
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
applicationSchema.index({ user: 1, internship: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ internship: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);

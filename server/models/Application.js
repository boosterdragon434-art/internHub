const mongoose = require('mongoose');
const { APPLICATION_STATUS, INTERNSHIP_DOMAINS } = require('../config/constants');

/**
 * Application Schema — represents a student's application to an internship.
 * Updated to capture comprehensive student details including personal info,
 * addresses, internship dates, domain, and uploaded documents.
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

    // ── Personal Information ──
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      uppercase: true, // Store in CAPS as per ID card
    },
    rollNo: {
      type: String,
      trim: true,
      default: '',
    },
    degree: {
      type: String,
      trim: true,
      default: '',
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
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other', ''],
      default: '',
    },

    // ── Address Information ──
    currentAddress: {
      type: String,
      trim: true,
      default: '',
    },
    permanentAddress: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    stateCountry: {
      type: String,
      trim: true,
      default: '',
    },
    pinCode: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Internship Dates (Student-selected) ──
    dateOfJoining: {
      type: Date,
      default: null,
    },
    dateOfCompletion: {
      type: Date,
      default: null,
    },

    // ── Domain of Internship ──
    domain: {
      type: String,
      enum: [...INTERNSHIP_DOMAINS, ''],
      default: '',
      trim: true,
    },

    // ── Legacy date field (kept for backward compat) ──
    joiningDate: {
      type: Date,
    },

    // ── Skills ──
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // ── Document Uploads ──
    resumeUrl: {
      type: String,
      default: '',
    },
    resumePublicId: {
      type: String,
      default: '',
    },
    aadharUrl: {
      type: String,
      default: '',
    },
    aadharPublicId: {
      type: String,
      default: '',
    },
    passportPhotoUrl: {
      type: String,
      default: '',
    },
    passportPhotoPublicId: {
      type: String,
      default: '',
    },
    idCardUrl: {
      type: String,
      default: '',
    },
    idCardPublicId: {
      type: String,
      default: '',
    },

    // ── Step 2: Motivation fields (legacy multi-step) ──
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

    // ── Step 3: Availability fields (legacy multi-step) ──
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
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
applicationSchema.index({ user: 1, internship: 1 }); // Not unique anymore to allow re-applications
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ internship: 1, status: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ internship: 1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);

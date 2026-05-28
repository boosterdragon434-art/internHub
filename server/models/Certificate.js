const mongoose = require('mongoose');

/**
 * Certificate Schema — Holds details of credentials issued to students, Google Drive download IDs,
 * verification status (issued vs revoked), and secure validation hashes.
 */
const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
      unique: true,
      trim: true,
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
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
      default: null,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    internshipTitle: {
      type: String,
      required: [true, 'Internship title is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    completionDate: {
      type: Date,
      required: [true, 'Completion date is required'],
    },
    grade: {
      type: String,
      default: 'A',
    },
    skillsAcquired: [
      {
        type: String,
        trim: true,
      },
    ],
    verificationUrl: {
      type: String,
      required: [true, 'Verification URL is required'],
    },
    qrCodeDataUrl: {
      type: String,
      required: [true, 'QR Code data URL is required'],
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF download URL is required'],
    },
    pdfDriveId: {
      type: String,
      required: [true, 'PDF Drive file ID is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'revoked'],
      default: 'issued',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuer admin is required'],
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ student: 1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);

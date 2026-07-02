const mongoose = require('mongoose');

/**
 * Overlay sub-schema — defines a single text/wipe element positioned on the certificate canvas.
 * Coordinates are stored as percentage (0–100) of the canvas dimensions.
 */
const overlaySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    field: {
      type: String,
      enum: ['studentName', 'courseName', 'date', 'certificateId', 'serialNumber', 'instructorName', 'startDate', 'endDate', 'collegeName', 'companyName', 'grade', 'skills', 'performance', 'customText', 'wipe', 'qrCode', 'logo', 'signature'],
      required: true,
    },
    x: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    y: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    fontSize: {
      type: Number,
      default: 24,
      min: 4,
      max: 120,
    },
    fontWeight: {
      type: String,
      enum: ['normal', 'bold'],
      default: 'normal',
    },
    fontFamily: {
      type: String,
      default: 'Helvetica-Bold',
      trim: true,
    },
    color: {
      type: String,
      default: '#000000',
      trim: true,
    },
    align: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
    },
    maxWidth: {
      type: Number,
      default: 60,
      min: 1,
      max: 100,
    },
    height: {
      type: Number,
      default: 5,
      min: 0.1,
      max: 100,
    },
    uppercase: {
      type: Boolean,
      default: false,
    },
    rotation: {
      type: Number,
      default: 0,
      min: 0,
      max: 360,
    },
    opacity: {
      type: Number,
      default: 1,
      min: 0,
      max: 1,
    },
    lineHeight: {
      type: Number,
      default: 1.2,
      min: 0.5,
      max: 3,
    },
    letterSpacing: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    customText: {
      type: String,
      default: '',
      trim: true,
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
      trim: true,
    },
  },
  { _id: false }
);

/**
 * CertificateTemplate Schema — Layout configurations for PDF certificate backgrounds,
 * overlay-based text field positioning, and editor metadata.
 */
const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    documentCategory: {
      type: String,
      enum: ['certificate', 'offer_letter', 'joining_letter', 'completion_letter', 'appreciation_letter', 'custom'],
      default: 'certificate',
    },
    customTextTemplate: {
      type: String,
      default: '',
    },
    pageFormat: {
      type: String,
      enum: ['A4', 'Letter', 'Custom'],
      default: 'A4',
    },
    customPageWidth: {
      type: Number,
      default: 842,
      min: 100,
      max: 5000,
    },
    customPageHeight: {
      type: Number,
      default: 595,
      min: 100,
      max: 5000,
    },
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'landscape',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    backgroundImageUrl: {
      type: String,
      default: '',
    },
    /** R2 object key for secure deletion and downloading */
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    /** Template status for admin dashboard management */
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    /** Original file type of the uploaded template */
    templateType: {
      type: String,
      enum: ['image', 'pdf'],
      default: 'image',
    },
    /** File size in bytes of the uploaded background */
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** SHA-256 hash of the uploaded file for duplicate detection */
    fileHash: {
      type: String,
      default: '',
      trim: true,
    },
    // Canvas pixel dimensions of the original template image
    width: {
      type: Number,
      default: 842,
    },
    height: {
      type: Number,
      default: 595,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    signatureUrl: {
      type: String,
      default: '',
    },
    // Dynamic overlay-based positioning system (replaces fixed layout)
    overlays: [overlaySchema],
    // Legacy fixed layout (kept for backward compatibility)
    layout: {
      namePosition: {
        x: { type: Number, default: 300 },
        y: { type: Number, default: 220 },
      },
      datePosition: {
        x: { type: Number, default: 150 },
        y: { type: Number, default: 420 },
      },
      idPosition: {
        x: { type: Number, default: 150 },
        y: { type: Number, default: 450 },
      },
      qrPosition: {
        x: { type: Number, default: 480 },
        y: { type: Number, default: 400 },
      },
    },
    typography: {
      fontFamily: { type: String, default: 'Helvetica' },
      fontSize: { type: Number, default: 28 },
      color: { type: String, default: '#1E293B' },
    },
    // Editor state metadata (zoom, grid settings)
    metadata: {
      editorZoom: { type: Number, default: 100 },
      showGrid: { type: Boolean, default: false },
      gridSize: { type: Number, default: 10 },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    defaultFieldValues: {
      type: Map,
      of: String,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
certificateTemplateSchema.index({ isDefault: 1 });
certificateTemplateSchema.index({ status: 1, createdAt: -1 });
certificateTemplateSchema.index({ fileHash: 1 });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);

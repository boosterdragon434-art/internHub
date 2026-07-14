const mongoose = require('mongoose');

/**
 * BrandAsset — Reusable brand assets (logos, stamps, signatures, icons)
 * that can be inserted into any template across the document studio.
 */
const brandAssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [100, 'Asset name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['logo', 'stamp', 'signature', 'icon'],
      required: [true, 'Asset type is required'],
    },
    /** CDN / R2 URL for the uploaded asset */
    url: {
      type: String,
      required: [true, 'Asset URL is required'],
    },
    /** R2 / Cloudinary object key for secure deletion */
    r2Key: {
      type: String,
      default: '',
    },
    /** File size in bytes */
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** MIME type of the uploaded file */
    mimeType: {
      type: String,
      default: 'image/png',
    },
    /** Who uploaded this asset */
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

brandAssetSchema.index({ type: 1, createdAt: -1 });
brandAssetSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('BrandAsset', brandAssetSchema);

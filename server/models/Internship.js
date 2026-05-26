const mongoose = require('mongoose');

/**
 * Internship Schema — represents an internship listing.
 */
const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Internship title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'UI/UX Design',
        'Cloud Computing',
        'Cybersecurity',
        'DevOps',
        'Digital Marketing',
        'Content Writing',
        'Graphic Design',
        'Video Editing',
        'Other',
      ],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: ['Remote', 'Hybrid', 'Offline'],
    },
    fees: {
      type: String,
      default: '0',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    openings: {
      type: Number,
      required: [true, 'Number of openings is required'],
      min: [1, 'At least 1 opening is required'],
    },
    filledPositions: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageDriveId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --------- Indexes ---------
internshipSchema.index({ status: 1 });
internshipSchema.index({ category: 1 });
internshipSchema.index({ mode: 1 });
internshipSchema.index({ title: 'text', description: 'text' });

// --------- Virtuals ---------
internshipSchema.virtual('availablePositions').get(function () {
  return Math.max(0, this.openings - this.filledPositions);
});

internshipSchema.virtual('isFull').get(function () {
  return this.filledPositions >= this.openings;
});

module.exports = mongoose.model('Internship', internshipSchema);

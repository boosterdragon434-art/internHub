const mongoose = require('mongoose');

/**
 * InternGroup — represents a named team of intern students assigned to one guide.
 */
const internGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ---- New Project Tracking Fields ----
    projectTitle: {
      type: String,
      trim: true,
      maxlength: [150, 'Project title cannot exceed 150 characters'],
      default: '',
    },
    projectLink: {
      type: String,
      trim: true,
      default: '',
    },
    memberContributions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          trim: true,
          maxlength: [100, 'Role cannot exceed 100 characters'],
          default: '',
        },
        responsibilities: {
          type: String,
          trim: true,
          maxlength: [1000, 'Responsibilities cannot exceed 1000 characters'],
          default: '',
        },
        tasksCompleted: {
          type: String,
          trim: true,
          maxlength: [2000, 'Tasks completed cannot exceed 2000 characters'],
          default: '',
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: {
          type: Date,
          default: null,
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

internGroupSchema.index({ name: 'text', description: 'text' });
internGroupSchema.index({ guide: 1, isActive: 1 });

module.exports = mongoose.model('InternGroup', internGroupSchema);

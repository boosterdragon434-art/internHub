const mongoose = require('mongoose');

/**
 * Task Schema — Represents ClickUp-like tasks in the workspace.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'completed', 'archived'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      default: null,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: [0, 'Estimated hours cannot be negative'],
    },
    loggedHours: {
      type: Number,
      default: 0,
      min: [0, 'Logged hours cannot be negative'],
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        driveId: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringConfig: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    checklist: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
taskSchema.index({ assignees: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ internship: 1 });
taskSchema.index({ order: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);

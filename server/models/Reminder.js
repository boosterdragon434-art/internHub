const mongoose = require('mongoose');

/**
 * Reminder Schema — Represents deadlines, custom alerts, or scheduled meetings.
 */
const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['deadline', 'task', 'meeting', 'custom'],
      default: 'custom',
    },
    triggerAt: {
      type: Date,
      required: [true, 'Trigger date and time is required'],
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
        min: [1, 'Interval must be at least 1'],
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    channels: {
      type: [
        {
          type: String,
          enum: ['in_app', 'email'],
        },
      ],
      default: ['in_app'],
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'dismissed'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user is required'],
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
reminderSchema.index({ user: 1 });
reminderSchema.index({ status: 1 });
reminderSchema.index({ triggerAt: 1 });
reminderSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);

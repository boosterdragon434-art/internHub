const mongoose = require('mongoose');

/**
 * TaskActivity Schema — Logs every state transition and action inside a task for auditing/activity feeds.
 */
const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'created',
        'updated',
        'status_changed',
        'priority_changed',
        'assigned',
        'unassigned',
        'commented',
        'attachment_added',
        'attachment_removed',
        'checklist_added',
        'checklist_updated',
        'checklist_deleted',
        'dependency_added',
        'dependency_removed',
        'completed',
        'reopened',
        'archived',
        'unarchived',
      ],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
taskActivitySchema.index({ task: 1 });
taskActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('TaskActivity', taskActivitySchema);

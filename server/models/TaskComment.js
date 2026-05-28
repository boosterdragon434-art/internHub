const mongoose = require('mongoose');

/**
 * TaskComment Schema — Represents discussion/comments inside a task.
 */
const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
taskCommentSchema.index({ task: 1 });
taskCommentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('TaskComment', taskCommentSchema);

const mongoose = require('mongoose');

/**
 * Conversation Schema — Holds reference of direct/group messaging threads.
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Conversation participants are required'],
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

const mongoose = require('mongoose');

/**
 * Cooldown Schema — tracks internship-specific re-application blocks.
 */
const cooldownSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index to automatically remove expired cooldowns
cooldownSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cooldownSchema.index({ student: 1, internship: 1 });

module.exports = mongoose.model('Cooldown', cooldownSchema);

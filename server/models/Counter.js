const mongoose = require('mongoose');

/**
 * Counter Schema — atomic auto-increment counter for sequential ID generation.
 * Each document represents a unique counter key (e.g., 'internship_certificate').
 */
const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Counter key is required'],
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// --------- Indexes ---------
counterSchema.index({ key: 1 }, { unique: true });

/**
 * Atomically increment and return the next sequence value for a given key.
 * Uses findOneAndUpdate with upsert to avoid race conditions.
 * @param {string} key - The counter key (e.g., 'internship_certificate')
 * @returns {Promise<number>} The next sequence number
 */
counterSchema.statics.getNextSequence = async function (key) {
  const counter = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);

const mongoose = require('mongoose');

/**
 * Holiday — admin-declared non-working days (one-off or recurring annually).
 * Dates use the same YYYY-MM-DD IST calendar convention as AttendanceSession.date.
 */
const holidaySchema = new mongoose.Schema(
  {
    // YYYY-MM-DD, IST calendar date — same string convention as AttendanceSession.date
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // If true, this holiday reapplies every year on the same MM-DD without re-adding it
    recurringAnnually: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });
holidaySchema.index({ recurringAnnually: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);

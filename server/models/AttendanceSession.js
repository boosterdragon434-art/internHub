const mongoose = require('mongoose');

/**
 * Embedded sub-document for each individual break within a session.
 */
const breakSessionSchema = new mongoose.Schema(
  {
    breakStart: { type: Date, required: true },
    breakEnd: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // minutes
  },
  { _id: true }
);

/**
 * Main attendance session — one document per intern per calendar day.
 */
const attendanceSessionSchema = new mongoose.Schema(
  {
    enrollmentInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnrollmentInstance',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternGroup',
      default: null,
      index: true,
    },
    // 'YYYY-MM-DD' UTC — used for all daily uniqueness and filtering
    date: {
      type: String,
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date, default: null },
    breaks: [breakSessionSchema],
    // Running totals updated on every break-end and on checkout
    totalBreakDuration: { type: Number, default: 0 },  // minutes
    totalWorkDuration: { type: Number, default: 0 },   // net minutes = gross - breaks
    grossDuration: { type: Number, default: 0 },        // minutes from check-in to check-out
    attendanceStatus: {
      type: String,
      enum: ['checked-in', 'on-break', 'checked-out', 'missed-checkout'],
      default: 'checked-in',
      index: true,
    },
    isLate: { type: Boolean, default: false },
    lateByMinutes: { type: Number, default: 0 },
    // Optional metadata
    ipAddress: { type: String, default: '', trim: true, maxlength: 100 },
    deviceInfo: { type: String, default: '', trim: true, maxlength: 300 },
    remarks: { type: String, default: '', trim: true, maxlength: 500 },
    missedCheckout: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enforce one session per enrollment per day
attendanceSessionSchema.index({ enrollmentInstance: 1, date: 1 }, { unique: true });
attendanceSessionSchema.index({ user: 1, date: 1 });
attendanceSessionSchema.index({ date: 1, attendanceStatus: 1 });
attendanceSessionSchema.index({ team: 1, date: 1 });
attendanceSessionSchema.index({ guide: 1, date: 1 });
attendanceSessionSchema.index({ date: 1, isLate: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);

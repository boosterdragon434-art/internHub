const mongoose = require('mongoose');

/**
 * AttendanceSettings — singleton configuration document for attendance policies.
 * Only one document should exist; use AttendanceSettings.getSettings() to fetch or create.
 */
const attendanceSettingsSchema = new mongoose.Schema(
  {
    expectedCheckInTime: {
      type: String,
      default: '09:00',
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
      trim: true,
    },
    lateGraceMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Grace period cannot be negative'],
      max: [120, 'Grace period cannot exceed 120 minutes'],
    },
    maxBreakMinutes: {
      type: Number,
      default: 60,
      min: [0, 'Max break cannot be negative'],
      max: [180, 'Max break cannot exceed 180 minutes'],
    },
    autoCheckoutHour: {
      type: Number,
      default: 22,
      min: [12, 'Auto-checkout hour must be at least 12'],
      max: [23, 'Auto-checkout hour cannot exceed 23'],
    },
    workingDaysPerWeek: {
      type: Number,
      default: 5,
      min: [1, 'Working days must be at least 1'],
      max: [7, 'Working days cannot exceed 7'],
    },
    minimumWorkHours: {
      type: Number,
      default: 6,
      min: [1, 'Minimum work hours must be at least 1'],
      max: [16, 'Minimum work hours cannot exceed 16'],
    },
    overtimeThresholdHours: {
      type: Number,
      default: 8,
      min: [1, 'Overtime threshold must be at least 1'],
      max: [16, 'Overtime threshold cannot exceed 16'],
    },
    weeklyOffDays: {
      type: [Number], // 0=Sunday ... 6=Saturday, matches JS Date.getUTCDay()
      default: [0],
      validate: {
        validator: function (arr) {
          return (
            Array.isArray(arr) &&
            arr.length <= 6 && // must leave at least 1 working day
            arr.every((n) => Number.isInteger(n) && n >= 0 && n <= 6) &&
            new Set(arr).size === arr.length // no duplicates
          );
        },
        message: 'weeklyOffDays must be unique integers 0-6 and must leave at least one working day.',
      },
    },
  },
  { timestamps: true }
);

/**
 * Fetch the singleton settings document atomically, creating it with defaults if missing.
 * Uses findOneAndUpdate with $setOnInsert to prevent the race condition where two
 * concurrent first-requests both create separate documents.
 * @returns {Promise<Object>} Plain settings object
 */
attendanceSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        expectedCheckInTime: '09:00',
        lateGraceMinutes: 15,
        maxBreakMinutes: 60,
        autoCheckoutHour: 22,
        workingDaysPerWeek: 5,
        minimumWorkHours: 6,
        overtimeThresholdHours: 8,
        weeklyOffDays: [0],
      },
    },
    { upsert: true, new: true, lean: true }
  );
  return settings;
};

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);

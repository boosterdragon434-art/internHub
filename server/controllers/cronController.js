const { processDueReminders } = require('../services/reminderService');
const { autoCheckoutActiveSessions } = require('./attendanceController');
const { expireOverduePaymentRequests } = require('../cron/paymentCron');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Trigger reminder processing (Serverless Cron)
 * @route   POST /api/cron/reminders
 * @access  Private (Cron Secret)
 */
const triggerReminders = async (req, res, next) => {
  try {
    await processDueReminders();
    ApiResponse.success(res, 200, 'Reminders processed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger attendance auto-checkout and payment expiry (Serverless Cron)
 * @route   POST /api/cron/attendance
 * @access  Private (Cron Secret)
 */
const triggerAttendanceCron = async (req, res, next) => {
  try {
    // Run both crons
    await Promise.allSettled([
      autoCheckoutActiveSessions(),
      expireOverduePaymentRequests()
    ]);
    ApiResponse.success(res, 200, 'Attendance and payment crons processed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerReminders,
  triggerAttendanceCron,
};

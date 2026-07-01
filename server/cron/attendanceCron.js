const cron = require('node-cron');
const { autoCheckoutActiveSessions } = require('../controllers/attendanceController');
const { expireOverduePaymentRequests } = require('./paymentCron');
const logger = require('../utils/logger');

/** Track how many times crons have executed */
let autoCheckoutRunCount = 0;
let paymentExpiryRunCount = 0;

/**
 * Initialize all cron jobs for the system.
 */
const initCronJobs = () => {
  // ─── Attendance: Auto-checkout ─────────────────────────────────────
  if (typeof autoCheckoutActiveSessions !== 'function') {
    logger.error('CRITICAL: autoCheckoutActiveSessions is not a function — cron will not work!');
  } else {
    logger.info('Cron: autoCheckoutActiveSessions function loaded successfully.');

    // Run auto-checkout every hour at minute 0 (e.g. 18:00, 19:00, etc.)
    cron.schedule('0 * * * *', async () => {
      autoCheckoutRunCount++;
      logger.info(`Running scheduled job: autoCheckoutActiveSessions (execution #${autoCheckoutRunCount})`);
      try {
        await autoCheckoutActiveSessions();
        logger.info(`Scheduled job autoCheckoutActiveSessions completed (execution #${autoCheckoutRunCount})`);
      } catch (err) {
        logger.error(`Scheduled job autoCheckoutActiveSessions failed (execution #${autoCheckoutRunCount}):`, err);
      }
    });
  }

  // ─── Payment: Expire overdue requests ─────────────────────────────
  // Runs daily at 00:30 IST (19:00 UTC previous day)
  cron.schedule('0 19 * * *', async () => {
    paymentExpiryRunCount++;
    logger.info(`Running scheduled job: expireOverduePaymentRequests (execution #${paymentExpiryRunCount})`);
    try {
      await expireOverduePaymentRequests();
      logger.info(`Scheduled job expireOverduePaymentRequests completed (execution #${paymentExpiryRunCount})`);
    } catch (err) {
      logger.error(`Scheduled job expireOverduePaymentRequests failed (execution #${paymentExpiryRunCount}):`, err);
    }
  });

  logger.info('Cron jobs initialized successfully (attendance auto-checkout + payment expiry).');
};

module.exports = { initCronJobs };

const { autoCheckoutActiveSessions } = require('../controllers/attendanceController');
const { expireOverduePaymentRequests } = require('../cron/paymentCron');
const logger = require('../utils/logger');

// Store the last run timestamp to prevent hammering the DB on every request.
// In a serverless environment (like Vercel), this variable persists for the life
// of the lambda execution environment (usually a few minutes to hours).
let lastRunTimestamp = 0;
const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Passive middleware to simulate cron jobs in a serverless environment.
 * Executes background tasks asynchronously if they haven't run recently.
 */
const passiveBackgroundChecks = (req, res, next) => {
  const now = Date.now();

  if (now - lastRunTimestamp > CHECK_INTERVAL_MS) {
    lastRunTimestamp = now;

    // Run async, do not block the request
    setImmediate(async () => {
      try {
        logger.info('Running passive background checks (Serverless Cron Simulation)...');
        await Promise.all([
          autoCheckoutActiveSessions(),
          expireOverduePaymentRequests()
        ]);
        logger.info('Passive background checks completed successfully.');
      } catch (err) {
        logger.error('Error during passive background checks:', err);
      }
    });
  }

  next();
};

module.exports = { passiveBackgroundChecks };

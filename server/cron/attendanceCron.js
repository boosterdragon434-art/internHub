const cron = require('node-cron');
const { autoCheckoutActiveSessions } = require('../controllers/attendanceController');
const logger = require('../utils/logger');

/**
 * Initialize all cron jobs for the system.
 */
const initCronJobs = () => {
  // Run auto-checkout every hour at minute 0 (e.g. 18:00, 19:00, etc.)
  cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled job: autoCheckoutActiveSessions');
    try {
      await autoCheckoutActiveSessions();
    } catch (err) {
      logger.error('Scheduled job autoCheckoutActiveSessions failed:', err);
    }
  });

  logger.info('Cron jobs initialized successfully.');
};

module.exports = { initCronJobs };

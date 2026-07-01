const PaymentRequest = require('../models/PaymentRequest');
const logger = require('../utils/logger');

/**
 * Mark any PaymentRequest past its deadline and still 'pending' as 'expired'.
 * Called daily by the cron scheduler.
 */
const expireOverduePaymentRequests = async () => {
  try {
    const now = new Date();
    const result = await PaymentRequest.updateMany(
      {
        status: 'pending',
        deadline: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`PaymentRequest expiry cron: marked ${result.modifiedCount} overdue request(s) as expired.`);
    }
  } catch (err) {
    logger.error('PaymentRequest expiry cron failed:', err);
  }
};

module.exports = { expireOverduePaymentRequests };

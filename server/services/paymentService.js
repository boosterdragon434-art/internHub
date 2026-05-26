const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Payment Service — handles Razorpay integration.
 */
class PaymentService {
  constructor() {
    this.razorpay = null;
  }

  /**
   * Initialize Razorpay instance (lazy init).
   */
  _getInstance() {
    if (this.razorpay) return this.razorpay;

    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    return this.razorpay;
  }

  /**
   * Create a Razorpay order.
   * @param {number} amount - Amount in INR (will be converted to paise)
   * @param {string} currency - Currency code (default: INR)
   * @param {string} receipt - Unique receipt identifier
   * @param {object} notes - Additional notes
   * @returns {Promise<object>} Razorpay order object
   */
  async createOrder(amount, currency = 'INR', receipt, notes = {}) {
    try {
      const razorpay = this._getInstance();

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes,
      });

      logger.info(`Razorpay order created: ${order.id} for ₹${amount}`);
      return order;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment signature using HMAC SHA256.
   * @param {string} orderId - Razorpay order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {boolean} Whether the signature is valid
   */
  verifyPayment(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) return false;

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');

    let isValid = false;
    if (expectedBuf.length === actualBuf.length) {
      isValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
    }

    logger.info(`Payment verification for ${paymentId}: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  }

  /**
   * Fetch payment details from Razorpay.
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<object>} Payment details
   */
  async fetchPayment(paymentId) {
    try {
      const razorpay = this._getInstance();
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      logger.error(`Failed to fetch payment ${paymentId}:`, error);
      throw new Error('Failed to fetch payment details');
    }
  }
}

module.exports = new PaymentService();

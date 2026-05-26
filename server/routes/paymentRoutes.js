const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  sendPaymentRequest,
  exportPaymentsCsv,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const paymentValidator = require('../validators/paymentValidator');

// Student payment routes (rate-limited)
router.post('/create-order', protect, authorize('student'), paymentLimiter, validate(paymentValidator.createOrder), createOrder);
router.post('/verify', protect, authorize('student'), paymentLimiter, validate(paymentValidator.verifyPayment), verifyPayment);
router.get('/my', protect, authorize('student'), getMyPayments);

// Admin payment routes
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/export/csv', protect, authorize('admin'), exportPaymentsCsv);
router.post('/send-request/:applicationId', protect, authorize('admin'), sendPaymentRequest);
router.get('/', protect, authorize('admin'), getAllPayments);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  submitUtr,
  adminVerifyPayment,
  getMyPayments,
  getAllPayments,
  sendPaymentRequest,
  exportPaymentsCsv,
  getPaymentStats,
  getMyPaymentRequests,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const paymentValidator = require('../validators/paymentValidator');

// Student payment routes (rate-limited)
router.get('/my', protect, getMyPayments);
router.get('/requests', protect, getMyPaymentRequests);
router.post('/submit-utr', protect, paymentLimiter, validate(paymentValidator.submitUtr), submitUtr);

// Admin payment routes
router.put('/:id/verify', protect, authorize('admin'), adminVerifyPayment);
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/export/csv', protect, authorize('admin'), exportPaymentsCsv);
router.post('/send-request/:applicationId', protect, authorize('admin'), sendPaymentRequest);
router.get('/', protect, authorize('admin'), getAllPayments);

module.exports = router;

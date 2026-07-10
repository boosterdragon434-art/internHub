const express = require('express');
const router = express.Router();
const {
  getCooldownSetting,
  updateCooldownSetting,
  getPaymentUpiConfig,
  updatePaymentUpiConfig,
  getSystemHealth,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// System Health
router.get('/health', protect, authorize('admin'), getSystemHealth);

// Cooldown settings
router.get('/cooldown', getCooldownSetting);
router.put('/cooldown', protect, authorize('admin'), updateCooldownSetting);

// Payment UPI config
router.get('/payment-upi', getPaymentUpiConfig);
router.put('/payment-upi', protect, authorize('admin'), uploadImage, updatePaymentUpiConfig);

module.exports = router;

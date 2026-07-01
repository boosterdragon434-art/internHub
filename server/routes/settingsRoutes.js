const express = require('express');
const router = express.Router();
const {
  getCooldownSetting,
  updateCooldownSetting,
  getPaymentUpiConfig,
  updatePaymentUpiConfig,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Cooldown settings
router.get('/cooldown', getCooldownSetting);
router.put('/cooldown', protect, authorize('admin'), updateCooldownSetting);

// Payment UPI config
router.get('/payment-upi', getPaymentUpiConfig);
router.put('/payment-upi', protect, authorize('admin'), updatePaymentUpiConfig);

module.exports = router;

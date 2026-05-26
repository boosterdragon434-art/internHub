const express = require('express');
const router = express.Router();
const { getCooldownSetting, updateCooldownSetting } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// GET request is accessible to students to check cooldown details or display correctly
router.get('/cooldown', getCooldownSetting);

// PUT request is strictly limited to administrative role
router.put('/cooldown', protect, authorize('admin'), updateCooldownSetting);

module.exports = router;

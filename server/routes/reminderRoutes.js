const express = require('express');
const router = express.Router();
const {
  createReminder,
  getReminders,
  updateReminder,
  dismissReminder,
  deleteReminder,
  manualTriggerReminders,
} = require('../controllers/reminderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const reminderValidator = require('../validators/reminderValidator');

// Get all reminders & create reminder
router.get('/', protect, getReminders);
router.post('/', protect, validate(reminderValidator.createReminder), createReminder);

// Actions on individual reminders
router.put('/:id', protect, validate(reminderValidator.updateReminder), updateReminder);
router.put('/:id/dismiss', protect, dismissReminder);
router.delete('/:id', protect, deleteReminder);

// Manual diagnostics (Admin only)
router.post('/trigger', protect, authorize('admin'), manualTriggerReminders);

module.exports = router;

const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');
const ApiError = require('../utils/ApiError');

// Simple middleware to protect cron routes using a secret key
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return next(ApiError.internal('CRON_SECRET is not configured'));
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return next(ApiError.unauthorized('Invalid cron secret'));
  }
  
  next();
};

router.post('/reminders', verifyCronSecret, cronController.triggerReminders);
router.post('/attendance', verifyCronSecret, cronController.triggerAttendanceCron);

module.exports = router;

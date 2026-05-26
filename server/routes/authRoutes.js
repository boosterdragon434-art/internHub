const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with auth rate limiter
router.post('/register', authLimiter, validate(authValidator.register), register);
router.post('/login', authLimiter, validate(authValidator.login), login);
router.post('/admin/login', authLimiter, validate(authValidator.login), adminLogin);
router.get('/verify-email/:token', authLimiter, verifyEmail);
router.post('/forgot-password', authLimiter, validate(authValidator.forgotPassword), forgotPassword);
router.put('/reset-password/:token', authLimiter, validate(authValidator.resetPassword), resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;

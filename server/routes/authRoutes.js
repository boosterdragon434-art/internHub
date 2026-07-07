const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  guideLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const { authLimiter, adminAuthLimiter } = require('../middleware/rateLimiter');

// Public routes with auth rate limiter
router.post('/register', authLimiter, validate(authValidator.register), register);
router.post('/login', authLimiter, validate(authValidator.login), login);
router.post('/admin/login', adminAuthLimiter, validate(authValidator.login), adminLogin);
router.post('/guide/login', adminAuthLimiter, validate(authValidator.login), guideLogin);
router.get('/verify-email/:token', authLimiter, verifyEmail);
router.post('/forgot-password', authLimiter, validate(authValidator.forgotPassword), forgotPassword);
router.put('/reset-password/:token', authLimiter, validate(authValidator.resetPassword), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;

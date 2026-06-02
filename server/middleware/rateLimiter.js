const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware configurations.
 * Protects against brute force and DoS attacks.
 * Configured with production-ready limits to scale under high load and university NAT environments.
 */

/** General API rate limiter — 10000 requests per 15 minutes */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    success: false,
    message: 'Too many requests. Please try again after some time.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

/** Auth endpoints rate limiter — 300 requests per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

/** Payment endpoints rate limiter — 150 requests per 15 minutes */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

/** Attendance endpoints rate limiter — 600 requests per 15 minutes */
const attendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: {
    success: false,
    message: 'Too many attendance requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

/** Certificate generation rate limiter — 20 requests per 15 minutes (expensive operation) */
const certificateGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many certificate generation requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

/** Certificate template upload rate limiter — 30 requests per 15 minutes */
const certificateUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many template upload requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  attendanceLimiter,
  certificateGenerationLimiter,
  certificateUploadLimiter,
};

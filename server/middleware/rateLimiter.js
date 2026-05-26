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
});

module.exports = { generalLimiter, authLimiter, paymentLimiter };

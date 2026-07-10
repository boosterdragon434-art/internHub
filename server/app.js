const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
// NOTE: xss-clean has been removed — it is deprecated, unmaintained since 2021,
// and has known bypass vectors. XSS is mitigated by Helmet CSP headers,
// Joi input validation in route validators, and React's default output encoding.
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const requestId = require('./middleware/requestId');
const { passiveReminderCheck } = require('./services/reminderService');
const { passiveBackgroundChecks } = require('./services/passiveBackgroundChecks');

// Route imports
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const guideRoutes = require('./routes/guideRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const attendanceRoutes = require('./routes/attendanceRoutes');
const teamRoutes = require('./routes/teamRoutes');

const app = express();

// Trust exactly one reverse proxy layer (prevent IP spoofing with multiple proxies)
app.set('trust proxy', 1);

// --------------- Request Correlation ID ---------------
app.use(requestId);

// --------------- Serverless Database Connection Middleware ---------------
let isConnected = false;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
  }
  if (!isConnected) {
    try {
      logger.info(`[${req.requestId}] Stateless serverless invocation: Establishing MongoDB connection...`);
      await connectDB();
      isConnected = true;
    } catch (err) {
      logger.error(`[${req.requestId}] Database connection failed in serverless middleware:`, err);
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Database connection failed.',
      });
    }
  }
  next();
});

// --------------- Security Middleware ---------------
// Custom Helmet configuration for premium security headers
const r2Origin = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).origin : '';
const imgSrc = ["'self'", "data:"];
const connectSrc = ["'self'"];
if (r2Origin) {
  imgSrc.push(r2Origin);
  connectSrc.push(r2Origin);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc,
        connectSrc,
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
// Build explicit CORS allowlist from environment
const corsAllowedOrigins = (() => {
  const origins = new Set([
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://intern-hub-front.vercel.app'
  ]);
  const clientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '');
  if (clientUrl) origins.add(clientUrl);
  // Add additional allowed origins from comma-separated env var
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  extra.forEach(o => origins.add(o.replace(/\/+$/, '')));
  return origins;
})();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const sanitizedOrigin = origin.replace(/\/+$/, '');

      if (corsAllowedOrigins.has(sanitizedOrigin)) {
        return callback(null, true);
      }

      // In development, also allow any localhost port
      if (process.env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(sanitizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(mongoSanitize());
// xss-clean removed — see note at top of file

// --------------- General Middleware ---------------
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(passiveReminderCheck);
app.use(passiveBackgroundChecks);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --------------- Rate Limiting ---------------
// Apply to both prefixed and non-prefixed routes to prevent bypass
app.use('/api', generalLimiter);
app.use('/auth', generalLimiter);
app.use('/internships', generalLimiter);
app.use('/applications', generalLimiter);
app.use('/payments', generalLimiter);
app.use('/users', generalLimiter);
app.use('/notifications', generalLimiter);
app.use('/settings', generalLimiter);
app.use('/guides', generalLimiter);
app.use('/tasks', generalLimiter);
app.use('/reminders', generalLimiter);
app.use('/certificates', generalLimiter);
app.use('/attendance', generalLimiter);
app.use('/teams', generalLimiter);

// --------------- API Routes ---------------
// 1. Mounted with /api prefix (for local proxying & explicit setups)
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/certificates', certificateRoutes);

app.use('/api/attendance', attendanceRoutes);
app.use('/api/teams', teamRoutes);

// 2. Mounted without prefix (fallback to handle direct Vercel API calls perfectly)
app.use('/auth', authRoutes);
app.use('/internships', internshipRoutes);
app.use('/applications', applicationRoutes);
app.use('/payments', paymentRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);
app.use('/settings', settingsRoutes);
app.use('/guides', guideRoutes);
app.use('/tasks', taskRoutes);
app.use('/reminders', reminderRoutes);
app.use('/certificates', certificateRoutes);

app.use('/attendance', attendanceRoutes);
app.use('/teams', teamRoutes);

// --------------- Health Check ---------------
const healthHandler = (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'InternHub API is running' : 'InternHub API is degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbStatus[dbState] || 'unknown',
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// --------------- 404 Handler ---------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// --------------- Global Error Handler ---------------
app.use(errorHandler);

module.exports = app;

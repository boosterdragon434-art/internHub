const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { passiveReminderCheck } = require('./services/reminderService');

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

// --------------- Serverless Database Connection Middleware ---------------
let isConnected = false;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
  }
  if (!isConnected) {
    try {
      logger.info('Stateless serverless invocation: Establishing MongoDB connection...');
      await connectDB();
      isConnected = true;
    } catch (err) {
      logger.error('Database connection failed in serverless middleware:', err);
    }
  }
  next();
});

// --------------- Security Middleware ---------------
// Custom Helmet configuration for premium security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://drive.google.com"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curls, or server-to-server)
      if (!origin) return callback(null, true);

      const sanitizedOrigin = origin.replace(/\/$/, '');
      let configuredClient = process.env.CLIENT_URL || 'http://localhost:5173';
      configuredClient = configuredClient.replace(/\/$/, '');

      if (
        sanitizedOrigin === configuredClient ||
        sanitizedOrigin === 'http://localhost:5173' ||
        sanitizedOrigin.endsWith('.vercel.app') ||
        /https?:\/\/intern-hub-front(-[a-z0-9]+)?\.vercel\.app$/.test(sanitizedOrigin)
      ) {
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
app.use(xssClean());

// --------------- General Middleware ---------------
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(passiveReminderCheck);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --------------- Rate Limiting ---------------
app.use('/api', generalLimiter);

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
  res.status(200).json({
    success: true,
    message: 'InternHub API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
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

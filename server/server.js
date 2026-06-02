require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// InternHub Entry Point
const PORT = process.env.PORT || 5000;

/**
 * Start the InternHub server.
 * Connects to MongoDB first, then starts listening.
 */
const startServer = async () => {
  try {
    await connectDB();

    const { startReminderScheduler } = require('./services/reminderService');
    startReminderScheduler();

    const { initCronJobs } = require('./cron/attendanceCron');
    initCronJobs();

    const server = app.listen(PORT, () => {
      logger.info(`InternHub server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    const { initSocket } = require('./services/socketService');
    initSocket(server);

    // Graceful shutdown handlers
    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed. Exiting process.');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      shutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

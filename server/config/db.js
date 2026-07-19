const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Establishes connection to MongoDB with retry logic.
 * Logs connection events and handles graceful shutdown.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false, // Prevent hanging on cold starts
        keepAlive: true,
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      // Programmatically drop legacy unique index on user+internship to support application cooldowns
      try {
        const Application = require('../models/Application');
        await Application.collection.dropIndex('user_1_internship_1');
        logger.info('Dropped legacy unique application index successfully');
      } catch (err) {
        // Code 27 is IndexNotFound, which is expected on subsequent runs
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
          logger.warn('Legacy application index drop warning:', err.message);
        }
      }

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      return conn;
    } catch (error) {
      retries += 1;
      logger.error(
        `MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`
      );

      if (retries >= MAX_RETRIES) {
        const errorMsg = `MongoDB connection failed after ${MAX_RETRIES} attempts.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, retries) * 1000;
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;

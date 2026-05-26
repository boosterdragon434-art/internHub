require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

/**
 * Seed an admin user into the database.
 */
const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@internhub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      logger.info(`Admin user with email ${adminEmail} already exists. Skipping seeding.`);
      process.exit(0);
    }

    // Create the admin user
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
    });

    logger.info('Admin user seeded successfully!');
    logger.info(`Email: ${adminEmail}`);
    logger.info(`Password: ${adminPassword}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

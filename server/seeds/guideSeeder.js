require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

/**
 * Seed a cohort guide user into the database.
 */
const seedGuide = async () => {
  try {
    // Connect to database
    await connectDB();

    const guideEmail = 'guide@internhub.com';
    const guidePassword = 'GuidePassword123';
    const guideName = 'Cohort Guide';

    // Check if guide already exists
    const guideExists = await User.findOne({ email: guideEmail });

    if (guideExists) {
      logger.info(`Guide user with email ${guideEmail} already exists. Skipping seeding.`);
      logger.info(`Credentials for existing Guide:`);
      logger.info(`Email: ${guideEmail}`);
      logger.info(`Password: ${guidePassword}`);
      process.exit(0);
    }

    // Create the guide user
    await User.create({
      name: guideName,
      email: guideEmail,
      password: guidePassword,
      role: 'guide',
      isEmailVerified: true,
      expertise: ['React', 'Node.js', 'System Architecture'],
      bio: 'Enterprise architect and student cohort mentor.',
    });

    logger.info('Guide user seeded successfully!');
    logger.info(`Email: ${guideEmail}`);
    logger.info(`Password: ${guidePassword}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding guide user:', error);
    process.exit(1);
  }
};

seedGuide();

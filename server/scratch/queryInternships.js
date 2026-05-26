require('dotenv').config();
const mongoose = require('mongoose');
const Internship = require('../models/Internship');
const connectDB = require('../config/db');

const run = async () => {
  try {
    await connectDB();
    const list = await Internship.find({});
    console.log('Total internships in DB:', list.length);
    list.forEach((item, index) => {
      console.log(`[${index}] Title: "${item.title}" | Status: "${item.status}" | Fees: ${item.fees}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();

const Settings = require('../models/Settings');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const r2Service = require('../services/r2Service');

/**
 * @desc    Get application cooldown setting
 * @route   GET /api/settings/cooldown
 * @access  Public / Authenticated
 */
const getCooldownSetting = async (req, res, next) => {
  try {
    let setting = await Settings.findOne({ key: 'applicationCooldown' });
    if (!setting) {
      // Default to 0 (disabled — no cooldown, students can reapply immediately)
      setting = await Settings.create({ key: 'applicationCooldown', value: 0 });
    }
    ApiResponse.success(res, 200, 'Application cooldown setting fetched successfully.', {
      cooldown: setting.value,
    });
  } catch (error) {
    logger.error('Failed to get cooldown setting:', error);
    next(error);
  }
};

/**
 * @desc    Update application cooldown setting
 * @route   PUT /api/settings/cooldown
 * @access  Admin
 */
const updateCooldownSetting = async (req, res, next) => {
  try {
    const { cooldown } = req.body;
    if (cooldown === undefined || isNaN(cooldown) || parseInt(cooldown, 10) < 0) {
      return next(ApiError.badRequest('Please provide a valid non-negative cooldown duration.'));
    }

    const valueNum = parseInt(cooldown, 10);

    let setting = await Settings.findOne({ key: 'applicationCooldown' });
    if (!setting) {
      setting = new Settings({ key: 'applicationCooldown' });
    }
    
    setting.value = valueNum;
    await setting.save();

    logger.info(`Admin ${req.user.email} updated application cooldown setting to ${valueNum} hours.`);

    ApiResponse.success(res, 200, 'Application cooldown updated successfully.', {
      cooldown: setting.value,
    });
  } catch (error) {
    logger.error('Failed to update cooldown setting:', error);
    next(error);
  }
};

/**
 * @desc    Get payment UPI configuration (UPI ID + payee name)
 * @route   GET /api/settings/payment-upi
 * @access  Public / Authenticated
 */
const getPaymentUpiConfig = async (req, res, next) => {
  try {
    let setting = await Settings.findOne({ key: 'paymentUpiConfig' });
    if (!setting) {
      // Return sensible defaults — admin must configure before students can pay
      setting = await Settings.create({
        key: 'paymentUpiConfig',
        value: { upiId: '', payeeName: 'FWT-iZON', qrCodeUrl: '' },
      });
    }

    ApiResponse.success(res, 200, 'Payment UPI config fetched.', {
      upiId: setting.value.upiId || '',
      payeeName: setting.value.payeeName || '',
      qrCodeUrl: setting.value.qrCodeUrl || '',
    });
  } catch (error) {
    logger.error('Failed to get payment UPI config:', error);
    next(error);
  }
};

/**
 * @desc    Update payment UPI configuration
 * @route   PUT /api/settings/payment-upi
 * @access  Admin
 */
const updatePaymentUpiConfig = async (req, res, next) => {
  try {
    const { upiId, payeeName, qrCodeUrl } = req.body;

    if (!upiId || typeof upiId !== 'string') {
      return next(ApiError.badRequest('A valid UPI ID is required.'));
    }

    // Validate UPI ID format: handle@bank (e.g. business@okicici, name@upi)
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;
    if (!upiPattern.test(upiId.trim())) {
      return next(ApiError.badRequest('Invalid UPI ID format. Expected format: handle@bank (e.g. business@okicici).'));
    }

    if (!payeeName || typeof payeeName !== 'string' || payeeName.trim().length === 0) {
      return next(ApiError.badRequest('Payee name is required.'));
    }

    let finalQrCodeUrl = qrCodeUrl ? qrCodeUrl.trim() : '';

    if (req.file) {
      try {
        const uploadResult = await r2Service.uploadFile(
          req.file.buffer,
          'internhub/qr-codes',
          'image'
        );
        finalQrCodeUrl = uploadResult.secureUrl;
      } catch (uploadErr) {
        logger.error('QR Code upload failed:', uploadErr);
        return next(ApiError.internal('Failed to upload QR Code image.'));
      }
    }

    let setting = await Settings.findOne({ key: 'paymentUpiConfig' });
    if (!setting) {
      setting = new Settings({ key: 'paymentUpiConfig' });
    }

    setting.value = {
      upiId: upiId.trim(),
      payeeName: payeeName.trim(),
      qrCodeUrl: finalQrCodeUrl,
    };
    await setting.save();

    logger.info(`Admin ${req.user.email} updated payment UPI config: ${upiId.trim()}`);

    ApiResponse.success(res, 200, 'Payment UPI config updated successfully.', {
      upiId: setting.value.upiId,
      payeeName: setting.value.payeeName,
      qrCodeUrl: setting.value.qrCodeUrl,
    });
  } catch (error) {
    logger.error('Failed to update payment UPI config:', error);
    next(error);
  }
};

/**
 * @desc    Get system health status for admin dashboard
 * @route   GET /api/settings/health
 * @access  Admin
 */
const getSystemHealth = async (req, res, next) => {
  try {
    // 1. Database Check
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'Connected' : 'Disconnected';
    
    // 2. Storage Check (Cloudflare R2)
    const hasR2Config = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME;
    const r2Status = hasR2Config ? 'Active' : 'Missing Config';
    
    // 3. SMTP Check
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;
    const smtpStatus = hasSmtpConfig ? 'Active' : 'Missing Config';

    // 4. Payment Config Check (UPI)
    const upiSetting = await Settings.findOne({ key: 'paymentUpiConfig' });
    const upiStatus = (upiSetting && upiSetting.value && upiSetting.value.upiId) ? 'Configured' : 'Not Configured';

    const healthData = {
      database: {
        name: 'Database Service',
        desc: 'MongoDB Atlas Connection Pool',
        status: dbStatus,
      },
      storage: {
        name: 'Storage Service',
        desc: 'Cloudflare R2 Object Storage',
        status: r2Status,
      },
      smtp: {
        name: 'SMTP Email Transport',
        desc: 'Nodemailer SMTP Relayer Service',
        status: smtpStatus,
      },
      payment: {
        name: 'Payment Gateway',
        desc: 'Manual UPI & UTR Verification',
        status: upiStatus,
      }
    };

    ApiResponse.success(res, 200, 'System health fetched.', healthData);
  } catch (error) {
    logger.error('Failed to get system health:', error);
    next(error);
  }
};

module.exports = {
  getCooldownSetting,
  updateCooldownSetting,
  getPaymentUpiConfig,
  updatePaymentUpiConfig,
  getSystemHealth,
};

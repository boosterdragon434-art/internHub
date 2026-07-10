const Settings = require('../models/Settings');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

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

    let setting = await Settings.findOne({ key: 'paymentUpiConfig' });
    if (!setting) {
      setting = new Settings({ key: 'paymentUpiConfig' });
    }

    setting.value = {
      upiId: upiId.trim(),
      payeeName: payeeName.trim(),
      qrCodeUrl: qrCodeUrl ? qrCodeUrl.trim() : '',
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

module.exports = {
  getCooldownSetting,
  updateCooldownSetting,
  getPaymentUpiConfig,
  updatePaymentUpiConfig,
};

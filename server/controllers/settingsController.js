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
      // Default to 0 (which means permanent block/no cooldown)
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

module.exports = {
  getCooldownSetting,
  updateCooldownSetting,
};

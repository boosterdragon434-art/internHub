const ApiError = require('../utils/ApiError');
const r2Service = require('../services/r2Service');

/**
 * @desc    Get signed URL for a file and redirect
 * @route   GET /api/files/*
 * @access  Private
 */
const getFile = async (req, res, next) => {
  try {
    const key = req.params[0];
    if (!key) {
      return next(ApiError.badRequest('File key is required.'));
    }

    const signedUrl = await r2Service.getAttachmentUrl(key);
    if (!signedUrl) {
      return next(ApiError.notFound('File not found or could not generate signed URL.'));
    }

    res.redirect(signedUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFile,
};

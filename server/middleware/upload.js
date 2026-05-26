const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { FILE_LIMITS } = require('../config/constants');

/**
 * Multer configuration with memory storage for Google Drive uploads.
 * Files are buffered in memory and then streamed to Google Drive.
 */
const storage = multer.memoryStorage();

/**
 * File filter for resume uploads (PDF only).
 */
const resumeFilter = (_req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only PDF files are allowed for resume upload.'), false);
  }
};

/**
 * File filter for image uploads (JPEG, PNG, WebP).
 */
const imageFilter = (_req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

/** Upload middleware for single resume */
const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: FILE_LIMITS.RESUME_MAX_SIZE },
}).single('resume');

/** Upload middleware for single image */
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: FILE_LIMITS.IMAGE_MAX_SIZE },
}).single('image');

/**
 * Wrapper to handle multer errors gracefully.
 * @param {Function} uploadFn - Multer upload middleware
 */
const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest('File size exceeds 5MB limit.'));
        }
        return next(ApiError.badRequest(err.message));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadResume: handleUpload(uploadResume),
  uploadImage: handleUpload(uploadImage),
};

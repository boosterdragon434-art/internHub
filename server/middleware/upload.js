const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { FILE_LIMITS } = require('../config/constants');

/**
 * Multer configuration with memory storage for R2 cloud storage uploads.
 * Files are buffered in memory and then streamed to R2.
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

/**
 * File filter for certificate template uploads (JPEG, PNG, WebP, PDF).
 */
const certificateTemplateFilter = (_req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_TEMPLATE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest('Only JPEG, PNG, WebP, and PDF files are allowed for certificate templates.'),
      false
    );
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

/** Upload middleware for certificate template (10MB limit) */
const uploadCertificateTemplate = multer({
  storage,
  fileFilter: certificateTemplateFilter,
  limits: { fileSize: FILE_LIMITS.CERTIFICATE_TEMPLATE_MAX_SIZE },
}).single('template');

/**
 * MIME magic-byte validation.
 * Checks the first bytes of a buffer match the declared MIME type.
 * Prevents disguised file uploads (e.g. exe renamed to .png).
 * @param {Buffer} buffer - File buffer
 * @param {string} declaredMime - Declared MIME type
 * @returns {boolean} True if magic bytes match
 */
const validateMagicBytes = (buffer, declaredMime) => {
  if (!buffer || buffer.length < 4) return false;

  const signatures = {
    'image/png': [0x89, 0x50, 0x4E, 0x47],          // ‰PNG
    'image/jpeg': [0xFF, 0xD8, 0xFF],                 // ÿØÿ
    'image/webp': null,                                 // RIFF....WEBP (check below)
    'application/pdf': [0x25, 0x50, 0x44, 0x46],       // %PDF
  };

  // WebP uses RIFF container
  if (declaredMime === 'image/webp') {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }

  const sig = signatures[declaredMime];
  if (!sig) return true; // Unknown type, skip validation

  for (let i = 0; i < sig.length; i++) {
    if (buffer[i] !== sig[i]) return false;
  }
  return true;
};

/**
 * Validate magic bytes of a base64-encoded image/file.
 * @param {string} base64String - Full data URI or raw base64
 * @returns {{ valid: boolean, detectedMime: string }} Validation result
 */
const validateBase64MagicBytes = (base64String) => {
  try {
    const raw = base64String.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(raw, 'base64');

    // Extract declared MIME from data URI if present
    const mimeMatch = base64String.match(/^data:([^;]+);base64,/);
    const declaredMime = mimeMatch ? mimeMatch[1] : 'image/png';

    return {
      valid: validateMagicBytes(buffer, declaredMime),
      detectedMime: declaredMime,
      buffer,
    };
  } catch {
    return { valid: false, detectedMime: 'unknown', buffer: null };
  }
};

/**
 * Wrapper to handle multer errors gracefully.
 * @param {Function} uploadFn - Multer upload middleware
 */
const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest('File size exceeds the allowed limit.'));
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
  uploadCertificateTemplate: handleUpload(uploadCertificateTemplate),
  validateMagicBytes,
  validateBase64MagicBytes,
};

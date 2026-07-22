const ApiError = require('../utils/ApiError');

/**
 * Generic validation middleware using Joi schemas.
 * Normalizes bracket-suffixed array field names from multipart form data
 * (e.g., `skills[]` → `skills`) before validation.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => {
  return (req, _res, next) => {
    // Normalize bracket-suffixed array fields: `field[]` → `field`
    // Multer/busboy stores FormData.append('skills[]', val) as req.body['skills[]']
    // but Joi schemas and controllers expect req.body.skills
    if (req.body && typeof req.body === 'object') {
      const normalized = {};
      for (const [key, value] of Object.entries(req.body)) {
        const cleanKey = key.endsWith('[]') ? key.slice(0, -2) : key;
        if (cleanKey in normalized) {
          // Merge into existing array
          normalized[cleanKey] = [].concat(normalized[cleanKey], value);
        } else {
          normalized[cleanKey] = value;
        }
      }
      req.body = normalized;
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('. ');
      return next(ApiError.badRequest(messages));
    }

    // Replace body with validated & sanitized values
    req.body = value;
    next();
  };
};

module.exports = validate;


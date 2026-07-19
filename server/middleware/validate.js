const ApiError = require('../utils/ApiError');

/**
 * Generic validation middleware using Joi schemas.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
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

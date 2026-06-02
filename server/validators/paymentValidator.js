const Joi = require('joi');

/**
 * Validation schemas for payment endpoints.
 */
const paymentValidator = {
  submitUtr: Joi.object({
    applicationId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Application ID format',
        'any.required': 'Application ID is required',
      }),
    utrNumber: Joi.string()
      .trim()
      .min(8)
      .max(20)
      .required()
      .messages({
        'string.min': 'UTR number must be at least 8 characters long',
        'string.max': 'UTR number cannot exceed 20 characters',
        'any.required': 'UTR number is required',
      }),
  }),
};

module.exports = paymentValidator;

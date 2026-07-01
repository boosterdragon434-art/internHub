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
      .pattern(/^\d{12}$/)
      .required()
      .messages({
        'string.pattern.base': 'UTR number must be exactly 12 digits (numeric only). Check your Google Pay/UPI transaction details.',
        'any.required': 'UTR number is required',
      }),
  }),

  verifyPayment: Joi.object({
    action: Joi.string()
      .valid('approve', 'reject')
      .required()
      .messages({
        'any.only': 'Action must be either "approve" or "reject"',
        'any.required': 'Verification action is required',
      }),
    reason: Joi.string()
      .trim()
      .max(500)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Rejection reason cannot exceed 500 characters',
      }),
  }),
};

module.exports = paymentValidator;

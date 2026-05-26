const Joi = require('joi');

/**
 * Validation schemas for payment endpoints.
 */
const paymentValidator = {
  createOrder: Joi.object({
    applicationId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Application ID format',
        'any.required': 'Application ID is required',
      }),
  }),

  verifyPayment: Joi.object({
    razorpayOrderId: Joi.string().trim().required().messages({
      'any.required': 'Razorpay Order ID is required',
    }),
    razorpayPaymentId: Joi.string().trim().required().messages({
      'any.required': 'Razorpay Payment ID is required',
    }),
    razorpaySignature: Joi.string().trim().required().messages({
      'any.required': 'Razorpay Signature is required',
    }),
  }),
};

module.exports = paymentValidator;

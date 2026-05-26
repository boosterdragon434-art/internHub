const Joi = require('joi');

/**
 * Validation schemas for authentication endpoints.
 */
const authValidator = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
    phone: Joi.string().trim().max(15).optional(),
    college: Joi.string().trim().max(200).optional(),
    department: Joi.string().trim().max(100).optional(),
    yearOfStudy: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other')
      .optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
  }),

  resetPassword: Joi.object({
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
  }),
};

module.exports = authValidator;

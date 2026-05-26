const Joi = require('joi');

/**
 * Validation schemas for user/profile endpoints.
 */
const userValidator = {
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
    }),
    phone: Joi.string().trim().min(10).max(15).optional().messages({
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 15 digits',
    }),
    college: Joi.string().trim().min(2).max(200).optional().messages({
      'string.min': 'College name must be at least 2 characters',
      'string.max': 'College name cannot exceed 200 characters',
    }),
    department: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Department name must be at least 2 characters',
      'string.max': 'Department name cannot exceed 100 characters',
    }),
    yearOfStudy: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other')
      .optional()
      .messages({
        'any.only': 'Invalid year of study option selected',
      }),
    skills: Joi.array().items(Joi.string().trim().max(50)).optional().messages({
      'array.base': 'Skills must be supplied as an array of strings',
    }),
  }).min(1).messages({
    'object.min': 'Please provide at least one field to update',
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string().min(6).max(128).required().messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required',
    }),
  }),
};

module.exports = userValidator;

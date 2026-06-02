const Joi = require('joi');

/**
 * Validation schemas for application endpoints.
 */
const applicationValidator = {
  create: Joi.object({
    internship: Joi.string().required().messages({
      'any.required': 'Internship ID is required',
    }),
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().min(10).max(15).required(),
    college: Joi.string().trim().min(2).max(200).required(),
    department: Joi.string().trim().min(2).max(100).required(),
    yearOfStudy: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other')
      .required(),
    skills: Joi.array().items(Joi.string().trim()).optional(),
    joiningDate: Joi.date().optional(),
    // Step 2 — Motivation
    motivation: Joi.string().trim().min(100).max(2000).optional().allow('').messages({
      'string.min': 'Motivation must be at least 100 characters',
    }),
    relevantExperience: Joi.string().trim().max(2000).optional().allow(''),
    portfolioUrl: Joi.string().trim().uri({ allowRelative: false }).optional().allow('').messages({
      'string.uri': 'Please provide a valid URL',
    }),
    // Step 3 — Availability
    availableFrom: Joi.date().optional().allow(null, ''),
    hoursPerWeek: Joi.number().integer().min(10).max(40).optional().messages({
      'number.min': 'Minimum 10 hours per week',
      'number.max': 'Maximum 40 hours per week',
    }),
    preferredMode: Joi.string().valid('Remote', 'Hybrid', 'On-site').optional(),
    // Step 4 — Confirmation
    confirmAccuracy: Joi.boolean().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(
        'Applied', 'Under Review', 'Approved', 'Rejected',
        'Payment Pending', 'Payment Completed', 'Joined', 'Completed'
      )
      .required(),
    adminNotes: Joi.string().trim().max(1000).optional().allow(''),
  }),

  assignPayment: Joi.object({
    amount: Joi.number().min(1).required().messages({
      'number.min': 'Payment amount must be at least ₹1',
      'any.required': 'Payment amount is required',
    }),
  }),

  bulkAction: Joi.object({
    applicationIds: Joi.array()
      .items(Joi.string())
      .min(1)
      .required()
      .messages({ 'array.min': 'Select at least one application' }),
    action: Joi.string()
      .valid('approve', 'reject', 'delete', 'under_review')
      .required(),
  }),
};

module.exports = applicationValidator;

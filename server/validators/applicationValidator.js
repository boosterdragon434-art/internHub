const Joi = require('joi');
const { INTERNSHIP_DOMAINS } = require('../config/constants');

/**
 * Validation schemas for application endpoints.
 */
const applicationValidator = {
  create: Joi.object({
    internship: Joi.string().required().messages({
      'any.required': 'Internship ID is required',
    }),
    // Personal Information
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required',
    }),
    rollNo: Joi.string().trim().max(50).optional().allow('').messages({
      'string.max': 'Roll number cannot exceed 50 characters',
    }),
    degree: Joi.string().trim().max(100).optional().allow('').messages({
      'string.max': 'Degree cannot exceed 100 characters',
    }),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().trim().min(10).max(15).required().messages({
      'string.min': 'Phone number must be at least 10 digits',
    }),
    college: Joi.string().trim().min(2).max(200).required(),
    department: Joi.string().trim().min(2).max(100).required(),
    yearOfStudy: Joi.string()
      .valid('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other', '')
      .optional()
      .allow(''),

    // Address Information
    currentAddress: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Current address cannot exceed 500 characters',
    }),
    permanentAddress: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Permanent address cannot exceed 500 characters',
    }),
    district: Joi.string().trim().max(100).optional().allow(''),
    stateCountry: Joi.string().trim().max(100).optional().allow(''),
    pinCode: Joi.string().trim().pattern(/^\d{4,10}$/).optional().allow('').messages({
      'string.pattern.base': 'PIN Code must be 4 to 10 digits',
    }),

    // Internship Dates (Student-selected)
    dateOfJoining: Joi.date().optional().allow(null, ''),
    dateOfCompletion: Joi.date().optional().allow(null, '').when('dateOfJoining', {
      is: Joi.date().required(),
      then: Joi.date().greater(Joi.ref('dateOfJoining')).messages({
        'date.greater': 'Date of Completion must be after Date of Joining',
      }),
    }),

    // Domain of Internship
    domain: Joi.string().valid(...INTERNSHIP_DOMAINS, '').optional().allow('').messages({
      'any.only': 'Please select a valid domain of internship',
    }),

    // Legacy fields
    joiningDate: Joi.date().optional(),
    skills: Joi.array().items(Joi.string().trim()).optional(),

    // Motivation (optional)
    motivation: Joi.string().trim().max(2000).optional().allow(''),
    relevantExperience: Joi.string().trim().max(2000).optional().allow(''),
    portfolioUrl: Joi.string().trim().uri({ allowRelative: false }).optional().allow('').messages({
      'string.uri': 'Please provide a valid URL',
    }),

    // Availability (optional)
    availableFrom: Joi.date().optional().allow(null, ''),
    hoursPerWeek: Joi.number().integer().min(10).max(40).optional().messages({
      'number.min': 'Minimum 10 hours per week',
      'number.max': 'Maximum 40 hours per week',
    }),
    preferredMode: Joi.string().valid('Remote', 'Hybrid', 'On-site').optional(),

    // Confirmation
    confirmAccuracy: Joi.boolean().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(
        'Applied', 'Under Review', 'Approved', 'Rejected',
        'Payment Pending', 'Payment Verification Pending', 'Payment Completed', 'Joined', 'Completed'
      )
      .required(),
    adminNotes: Joi.string().trim().max(1000).optional().allow(''),
  }),

  assignPayment: Joi.object({
    amount: Joi.number().min(0).max(1000000).required().messages({
      'number.min': 'Payment amount cannot be negative',
      'number.max': 'Payment amount cannot exceed ₹10,00,000',
      'any.required': 'Payment amount is required',
    }),
    currency: Joi.string().valid('INR', 'USD').optional(),
    deadline: Joi.date().greater('now').when('amount', {
      is: Joi.number().greater(0),
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, ''),
    }).messages({
      'date.greater': 'Payment deadline must be a future date',
    }),
    notes: Joi.string().trim().max(1000).optional().allow(''),
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

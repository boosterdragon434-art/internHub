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
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(
        'Applied', 'Under Review', 'Approved', 'Rejected',
        'Payment Pending', 'Payment Completed', 'Joined'
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

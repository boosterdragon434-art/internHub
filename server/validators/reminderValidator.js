const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schemas for Reminder system endpoints.
 */
const reminderValidator = {
  createReminder: Joi.object({
    title: Joi.string().trim().max(200).required().messages({
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Reminder title is required',
    }),
    description: Joi.string().trim().allow('').optional(),
    type: Joi.string().valid('deadline', 'task', 'meeting', 'custom').default('custom').optional(),
    triggerAt: Joi.date().iso().required().messages({
      'any.required': 'Trigger date and time is required',
      'date.base': 'Please provide a valid trigger date and time',
    }),
    isRecurring: Joi.boolean().default(false).optional(),
    recurringConfig: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
      interval: Joi.number().min(1).default(1).optional(),
      endDate: Joi.date().iso().allow(null).optional(),
    })
      .optional()
      .when('isRecurring', {
        is: true,
        then: Joi.required(),
      }),
    channels: Joi.array().items(Joi.string().valid('in_app', 'email')).default(['in_app']).optional(),
    user: Joi.string().regex(objectIdPattern).message('Invalid user ID format').optional(),
    relatedTask: Joi.string().regex(objectIdPattern).message('Invalid related task ID format').optional(),
  }),

  updateReminder: Joi.object({
    title: Joi.string().trim().max(200).optional(),
    description: Joi.string().trim().allow('').optional(),
    type: Joi.string().valid('deadline', 'task', 'meeting', 'custom').optional(),
    triggerAt: Joi.date().iso().optional(),
    isRecurring: Joi.boolean().optional(),
    recurringConfig: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
      interval: Joi.number().min(1).default(1).optional(),
      endDate: Joi.date().iso().allow(null).optional(),
    }).optional(),
    channels: Joi.array().items(Joi.string().valid('in_app', 'email')).optional(),
    status: Joi.string().valid('pending', 'sent', 'dismissed').optional(),
  }),
};

module.exports = reminderValidator;

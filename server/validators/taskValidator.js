const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schemas for Task Management endpoints.
 */
const taskValidator = {
  createTask: Joi.object({
    title: Joi.string().trim().max(200).required().messages({
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Task title is required',
    }),
    description: Joi.string().allow('').optional(),
    status: Joi.string()
      .valid('backlog', 'todo', 'in_progress', 'in_review', 'completed', 'archived')
      .default('todo')
      .optional(),
    priority: Joi.string()
      .valid('urgent', 'high', 'medium', 'low')
      .default('medium')
      .optional(),
    labels: Joi.array().items(Joi.string().trim()).optional(),
    assignees: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid assignee ID format'))
      .optional(),
    internship: Joi.string().regex(objectIdPattern).message('Invalid internship ID format').allow(null).optional(),
    parentTask: Joi.string().regex(objectIdPattern).message('Invalid parent task ID format').allow(null).optional(),
    dependencies: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid dependency ID format'))
      .optional(),
    startDate: Joi.date().iso().allow(null, '').optional(),
    dueDate: Joi.date().iso().allow(null, '').optional().when('startDate', {
      is: Joi.exist().not(null).not(''),
      then: Joi.date().greater(Joi.ref('startDate'))
    }).messages({
      'date.greater': 'Due date must be after start date',
    }),
    estimatedHours: Joi.number().min(0).optional(),
    loggedHours: Joi.number().min(0).optional(),
    checklist: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().trim().required().messages({
            'any.required': 'Checklist item text is required',
          }),
          isCompleted: Joi.boolean().default(false),
        })
      )
      .optional(),
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
  }),

  updateTask: Joi.object({
    title: Joi.string().trim().max(200).optional(),
    description: Joi.string().allow('').optional(),
    status: Joi.string()
      .valid('backlog', 'todo', 'in_progress', 'in_review', 'completed', 'archived')
      .optional(),
    priority: Joi.string().valid('urgent', 'high', 'medium', 'low').optional(),
    labels: Joi.array().items(Joi.string().trim()).optional(),
    assignees: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid assignee ID format'))
      .optional(),
    internship: Joi.string().regex(objectIdPattern).message('Invalid internship ID format').allow(null).optional(),
    parentTask: Joi.string().regex(objectIdPattern).message('Invalid parent task ID format').allow(null).optional(),
    dependencies: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid dependency ID format'))
      .optional(),
    startDate: Joi.date().iso().allow(null, '').optional(),
    dueDate: Joi.date().iso().allow(null, '').optional().when('startDate', {
      is: Joi.exist().not(null).not(''),
      then: Joi.date().greater(Joi.ref('startDate'))
    }).messages({
      'date.greater': 'Due date must be after start date',
    }),
    estimatedHours: Joi.number().min(0).optional(),
    loggedHours: Joi.number().min(0).optional(),
    checklist: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().regex(objectIdPattern).optional(),
          text: Joi.string().trim().required(),
          isCompleted: Joi.boolean().required(),
        })
      )
      .optional(),
    isRecurring: Joi.boolean().optional(),
    recurringConfig: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
      interval: Joi.number().min(1).default(1).optional(),
      endDate: Joi.date().iso().allow(null).optional(),
    }).optional(),
  }),

  addComment: Joi.object({
    content: Joi.string().trim().required().messages({
      'any.required': 'Comment content is required',
    }),
    attachments: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          url: Joi.string().uri().required(),
        })
      )
      .optional(),
  }),

  reorderTasks: Joi.object({
    orderedIds: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid task ID format'))
      .required()
      .messages({
        'any.required': 'orderedIds array is required',
      }),
  }),
};

module.exports = taskValidator;

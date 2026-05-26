const Joi = require('joi');

/**
 * Validation schemas for internship endpoints.
 */
const internshipValidator = {
  create: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).max(5000).required(),
    shortDescription: Joi.string().trim().max(300).optional(),
    category: Joi.string()
      .valid(
        'Web Development', 'Mobile Development', 'Data Science',
        'Machine Learning', 'UI/UX Design', 'Cloud Computing',
        'Cybersecurity', 'DevOps', 'Digital Marketing',
        'Content Writing', 'Graphic Design', 'Video Editing', 'Other'
      )
      .required(),
    duration: Joi.string().trim().required(),
    mode: Joi.string().valid('Remote', 'Hybrid', 'Offline').required(),
    fees: Joi.string().trim().default('0'),
    skills: Joi.array().items(Joi.string().trim()).optional(),
    requirements: Joi.array().items(Joi.string().trim()).optional(),
    responsibilities: Joi.array().items(Joi.string().trim()).optional(),
    openings: Joi.number().integer().min(1).required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('active', 'closed', 'draft').default('active'),
  }),

  update: Joi.object({
    title: Joi.string().trim().min(3).max(200).optional(),
    description: Joi.string().trim().min(10).max(5000).optional(),
    shortDescription: Joi.string().trim().max(300).optional(),
    category: Joi.string()
      .valid(
        'Web Development', 'Mobile Development', 'Data Science',
        'Machine Learning', 'UI/UX Design', 'Cloud Computing',
        'Cybersecurity', 'DevOps', 'Digital Marketing',
        'Content Writing', 'Graphic Design', 'Video Editing', 'Other'
      )
      .optional(),
    duration: Joi.string().trim().optional(),
    mode: Joi.string().valid('Remote', 'Hybrid', 'Offline').optional(),
    fees: Joi.string().trim().optional(),
    skills: Joi.array().items(Joi.string().trim()).optional(),
    requirements: Joi.array().items(Joi.string().trim()).optional(),
    responsibilities: Joi.array().items(Joi.string().trim()).optional(),
    openings: Joi.number().integer().min(1).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('active', 'closed', 'draft').optional(),
  }).min(1),
};

module.exports = internshipValidator;

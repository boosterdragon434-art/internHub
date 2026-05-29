const Joi = require('joi');

/**
 * Joi validation schemas for team/group management endpoints.
 */

const createTeam = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  guide: Joi.string().hex().length(24).allow(null).optional(),
  members: Joi.array()
    .items(Joi.string().hex().length(24))
    .unique()
    .max(100)
    .optional(),
});

const updateTeam = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  guide: Joi.string().hex().length(24).allow(null).optional(),
  members: Joi.array()
    .items(Joi.string().hex().length(24))
    .unique()
    .max(100)
    .optional(),
  isActive: Joi.boolean().optional(),
});

const updateMembers = Joi.object({
  add: Joi.array()
    .items(Joi.string().hex().length(24))
    .unique()
    .max(100)
    .optional(),
  remove: Joi.array()
    .items(Joi.string().hex().length(24))
    .unique()
    .max(100)
    .optional(),
});

const assignGuide = Joi.object({
  guideId: Joi.string().hex().length(24).allow(null).required(),
});

module.exports = {
  createTeam,
  updateTeam,
  updateMembers,
  assignGuide,
};

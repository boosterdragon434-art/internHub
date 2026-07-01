const Joi = require('joi');

/**
 * Joi validation schemas for all attendance-related endpoints.
 */

const checkIn = Joi.object({
  remarks: Joi.string().trim().max(500).allow('').optional(),
});

const breakAction = Joi.object({
  remarks: Joi.string().trim().max(500).allow('').optional(),
});

const checkOut = Joi.object({
  remarks: Joi.string().trim().max(500).allow('').optional(),
});

const fetchAttendance = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  userId: Joi.string().hex().length(24).optional(),
  guideId: Joi.string().hex().length(24).optional(),
  teamId: Joi.string().hex().length(24).optional(),
  status: Joi.string()
    .valid('checked-in', 'on-break', 'checked-out', 'missed-checkout')
    .optional(),
  startDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  search: Joi.string().trim().max(100).optional(),
  sort: Joi.string().trim().max(50).default('-date'),
});

const exportAttendance = Joi.object({
  userId: Joi.string().hex().length(24).optional(),
  guideId: Joi.string().hex().length(24).optional(),
  teamId: Joi.string().hex().length(24).optional(),
  status: Joi.string()
    .valid('checked-in', 'on-break', 'checked-out', 'missed-checkout')
    .optional(),
  startDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const updateSettings = Joi.object({
  expectedCheckInTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional(),
  lateGraceMinutes: Joi.number().integer().min(0).max(120).optional(),
  maxBreakMinutes: Joi.number().integer().min(0).max(180).optional(),
  autoCheckoutHour: Joi.number().integer().min(12).max(23).optional(),
  workingDaysPerWeek: Joi.number().integer().min(1).max(7).optional(),
  minimumWorkHours: Joi.number().integer().min(1).max(16).optional(),
  overtimeThresholdHours: Joi.number().integer().min(1).max(16).optional(),
});

const monthlyHours = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format',
    }),
  userId: Joi.string().hex().length(24).optional(),
  teamId: Joi.string().hex().length(24).optional(),
  guideId: Joi.string().hex().length(24).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  checkIn,
  breakAction,
  checkOut,
  fetchAttendance,
  exportAttendance,
  updateSettings,
  monthlyHours,
};

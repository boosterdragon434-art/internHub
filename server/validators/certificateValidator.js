const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Position coordinate sub-schema for template layout overlays (legacy).
 */
const positionSchema = Joi.object({
  x: Joi.number().min(0).max(900).optional(),
  y: Joi.number().min(0).max(650).optional(),
});

/**
 * Layout sub-schema for template overlay configuration (legacy).
 */
const layoutSchema = Joi.object({
  namePosition: positionSchema.optional(),
  datePosition: positionSchema.optional(),
  idPosition: positionSchema.optional(),
  qrPosition: positionSchema.optional(),
});

/**
 * Typography sub-schema for template font configuration.
 */
const typographySchema = Joi.object({
  fontFamily: Joi.string().trim().max(50).optional(),
  fontSize: Joi.number().min(8).max(72).optional(),
  color: Joi.string().trim().max(20).optional(),
});

/**
 * Overlay sub-schema — validates individual overlay field objects.
 */
const overlayItemSchema = Joi.object({
  id: Joi.string().required(),
  field: Joi.string()
    .valid('studentName', 'courseName', 'date', 'certificateId', 'serialNumber', 'instructorName', 'startDate', 'endDate', 'collegeName', 'companyName', 'grade', 'skills', 'performance', 'customText', 'wipe', 'qrCode', 'logo', 'signature')
    .required(),
  x: Joi.number().min(0).max(100).optional(),
  y: Joi.number().min(0).max(100).optional(),
  fontSize: Joi.number().min(4).max(120).optional(),
  fontWeight: Joi.string().valid('normal', 'bold').optional(),
  fontFamily: Joi.string().trim().max(50).optional(),
  color: Joi.string().trim().max(20).optional(),
  align: Joi.string().valid('left', 'center', 'right').optional(),
  maxWidth: Joi.number().min(1).max(100).optional(),
  height: Joi.number().min(0.1).max(100).optional(),
  uppercase: Joi.boolean().optional(),
  rotation: Joi.number().min(0).max(360).optional(),
  opacity: Joi.number().min(0).max(1).optional(),
  lineHeight: Joi.number().min(0.5).max(3).optional(),
  letterSpacing: Joi.number().optional(),
  visible: Joi.boolean().optional(),
  customText: Joi.string().allow('').max(500).optional(),
  dateFormat: Joi.string().trim().max(30).optional(),
});

/**
 * Editor metadata sub-schema.
 */
const metadataSchema = Joi.object({
  editorZoom: Joi.number().min(10).max(500).optional(),
  showGrid: Joi.boolean().optional(),
  gridSize: Joi.number().min(1).max(100).optional(),
});

/**
 * Validation schemas for Certificate System endpoints.
 */
const certificateValidator = {
  generateCertificate: Joi.object({
    applicationId: Joi.string().regex(objectIdPattern).message('Invalid Application ID format').required().messages({
      'any.required': 'Application ID is required',
    }),
    grade: Joi.string().trim().max(10).default('A').optional(),
    skillsAcquired: Joi.array().items(Joi.string().trim().max(100)).max(20).optional(),
    performance: Joi.string().trim().max(50).optional(),
    overwrite: Joi.boolean().optional(),
    templateId: Joi.string().regex(objectIdPattern).message('Invalid Template ID format').optional(),
  }).unknown(true),

  bulkGenerate: Joi.object({
    applicationIds: Joi.array()
      .items(Joi.string().regex(objectIdPattern).message('Invalid Application ID format'))
      .min(1)
      .max(50)
      .required()
      .messages({
        'any.required': 'At least one Application ID is required',
        'array.max': 'Maximum 50 applications per bulk generation',
      }),
    grade: Joi.string().trim().max(10).default('A').optional(),
    skillsAcquired: Joi.array().items(Joi.string().trim().max(100)).max(20).optional(),
    performance: Joi.string().trim().max(50).optional(),
    overwrite: Joi.boolean().optional(),
    templateId: Joi.string().regex(objectIdPattern).message('Invalid Template ID format').optional(),
  }).unknown(true),

  createTemplate: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z0-9\s\-_.,()&]+$/)
      .required()
      .messages({
        'any.required': 'Template name is required',
        'string.max': 'Template name cannot exceed 100 characters',
        'string.pattern.base': 'Template name can only contain letters, numbers, spaces, and basic punctuation',
      }),
    description: Joi.string().trim().max(500).allow('').optional(),
    backgroundImage: Joi.string().max(14 * 1024 * 1024).optional().messages({
      'string.max': 'Background image exceeds maximum size of 10MB',
    }),
    templateType: Joi.string().valid('image', 'pdf').optional(),
    layout: layoutSchema.optional(),
    typography: typographySchema.optional(),
    overlays: Joi.array().items(overlayItemSchema).max(50).optional(),
    metadata: metadataSchema.optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
    isDefault: Joi.boolean().optional(),
    customPageWidth: Joi.number().min(100).max(5000).optional(),
    customPageHeight: Joi.number().min(100).max(5000).optional(),
    defaultFieldValues: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional(),
  }),

  updateTemplate: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z0-9\s\-_.,()&]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Template name can only contain letters, numbers, spaces, and basic punctuation',
      }),
    description: Joi.string().trim().max(500).allow('').optional(),
    backgroundImage: Joi.string().max(14 * 1024 * 1024).optional().messages({
      'string.max': 'Background image exceeds maximum size of 10MB',
    }),
    templateType: Joi.string().valid('image', 'pdf').optional(),
    layout: layoutSchema.optional(),
    typography: typographySchema.optional(),
    overlays: Joi.array().items(overlayItemSchema).max(50).optional(),
    metadata: metadataSchema.optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
    isDefault: Joi.boolean().optional(),
    customPageWidth: Joi.number().min(100).max(5000).optional(),
    customPageHeight: Joi.number().min(100).max(5000).optional(),
    defaultFieldValues: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional(),
  }),

  toggleStatus: Joi.object({
    status: Joi.string().valid('active', 'inactive').required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either active or inactive',
    }),
  }),

  revokeCertificate: Joi.object({
    reason: Joi.string().trim().max(500).allow('').optional(),
  }),
};

module.exports = certificateValidator;

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
    .valid('studentName', 'courseName', 'date', 'certificateId', 'serialNumber', 'instructorName', 'startDate', 'endDate', 'collegeName', 'companyName', 'grade', 'skills', 'performance', 'customText', 'wipe', 'qrCode', 'logo', 'signature', 'shape', 'table', 'image', 'barcode')
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
  customText: Joi.string().allow('').max(2000).optional(),
  dateFormat: Joi.string().trim().max(30).optional(),
  // Phase 5: Layer management
  locked: Joi.boolean().optional(),
  groupId: Joi.string().allow(null, '').optional(),
  // Phase 6: Shape
  shapeType: Joi.string().valid('rectangle', 'roundedRectangle', 'circle', 'ellipse', 'triangle', 'line', 'star').optional(),
  fill: Joi.string().trim().max(20).optional(),
  stroke: Joi.string().trim().max(20).optional(),
  strokeWidth: Joi.number().min(0).max(20).optional(),
  cornerRadius: Joi.number().min(0).max(100).optional(),
  // Phase 6: Table
  rows: Joi.number().integer().min(1).max(50).optional(),
  columns: Joi.number().integer().min(1).max(20).optional(),
  cellData: Joi.array().items(Joi.array().items(Joi.string().allow('').max(500))).optional(),
  columnWidths: Joi.array().items(Joi.number().min(0)).optional(),
  rowHeights: Joi.array().items(Joi.number().min(0)).optional(),
  tableBorderColor: Joi.string().trim().max(20).optional(),
  tableHeaderBg: Joi.string().trim().max(20).optional(),
  // Phase 6: Image
  imageUrl: Joi.string().allow('').max(2048).optional(),
  cropX: Joi.number().min(0).max(100).optional(),
  cropY: Joi.number().min(0).max(100).optional(),
  cropWidth: Joi.number().min(0).max(100).optional(),
  cropHeight: Joi.number().min(0).max(100).optional(),
  borderRadius: Joi.number().min(0).max(200).optional(),
  brightness: Joi.number().min(-1).max(1).optional(),
  contrast: Joi.number().min(-1).max(1).optional(),
  // Phase 6: Barcode
  barcodeFormat: Joi.string().valid('CODE128', 'CODE39', 'EAN13', 'UPC').optional(),
  barcodeValue: Joi.string().allow('').max(500).optional(),
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
      .max(200)
      .required()
      .messages({
        'any.required': 'At least one Application ID is required',
        'array.max': 'Maximum 200 applications per bulk generation',
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
    overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
    metadata: metadataSchema.optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
    isDefault: Joi.boolean().optional(),
    customPageWidth: Joi.number().min(100).max(5000).optional(),
    customPageHeight: Joi.number().min(100).max(5000).optional(),
    defaultFieldValues: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional(),
    documentCategory: Joi.string().valid('certificate', 'offer_letter', 'joining_letter', 'completion_letter', 'appreciation_letter', 'custom', 'recommendation_letter', 'experience_letter', 'appointment_letter', 'id_card').optional(),
    pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
    orientation: Joi.string().valid('portrait', 'landscape').optional(),
    customTextTemplate: Joi.string().allow('').max(10000).optional(),
    // Phase 7: Multi-page
    pages: Joi.array().items(Joi.object({
      backgroundImageUrl: Joi.string().allow('').optional(),
      cloudinaryPublicId: Joi.string().allow('').optional(),
      overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
      pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
      orientation: Joi.string().valid('portrait', 'landscape').optional(),
    })).max(20).optional(),
    headerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    footerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    firstPageDifferent: Joi.boolean().optional(),
    lastPageDifferent: Joi.boolean().optional(),
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
    overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
    metadata: metadataSchema.optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
    isDefault: Joi.boolean().optional(),
    customPageWidth: Joi.number().min(100).max(5000).optional(),
    customPageHeight: Joi.number().min(100).max(5000).optional(),
    defaultFieldValues: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional(),
    documentCategory: Joi.string().valid('certificate', 'offer_letter', 'joining_letter', 'completion_letter', 'appreciation_letter', 'custom', 'recommendation_letter', 'experience_letter', 'appointment_letter', 'id_card').optional(),
    pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
    orientation: Joi.string().valid('portrait', 'landscape').optional(),
    customTextTemplate: Joi.string().allow('').max(10000).optional(),
    // Phase 7: Multi-page
    pages: Joi.array().items(Joi.object({
      backgroundImageUrl: Joi.string().allow('').optional(),
      cloudinaryPublicId: Joi.string().allow('').optional(),
      overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
      pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
      orientation: Joi.string().valid('portrait', 'landscape').optional(),
    })).max(20).optional(),
    headerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    footerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    firstPageDifferent: Joi.boolean().optional(),
    lastPageDifferent: Joi.boolean().optional(),
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

  // Phase 8: JSON template import
  importTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).allow('').optional(),
    documentCategory: Joi.string().valid('certificate', 'offer_letter', 'joining_letter', 'completion_letter', 'appreciation_letter', 'custom', 'recommendation_letter', 'experience_letter', 'appointment_letter', 'id_card').optional(),
    pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
    orientation: Joi.string().valid('portrait', 'landscape').optional(),
    overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
    pages: Joi.array().items(Joi.object({
      overlays: Joi.array().items(overlayItemSchema).max(200).optional(),
      pageFormat: Joi.string().valid('A4', 'Letter', 'Custom').optional(),
      orientation: Joi.string().valid('portrait', 'landscape').optional(),
    })).max(20).optional(),
    headerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    footerOverlays: Joi.array().items(overlayItemSchema).max(20).optional(),
    typography: typographySchema.optional(),
    metadata: metadataSchema.optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
  }),

  // Phase 8: Brand assets
  createBrandAsset: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    type: Joi.string().valid('logo', 'stamp', 'signature', 'icon').required(),
    assetData: Joi.string().max(14 * 1024 * 1024).required().messages({
      'string.max': 'Asset image exceeds maximum size of 10MB',
    }),
  }),
};

module.exports = certificateValidator;

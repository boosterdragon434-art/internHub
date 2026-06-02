const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateStats,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateStatus,
  downloadTemplate,
  generateCertificate,
  bulkGenerate,
  previewCertificate,
  getMyCertificates,
  getAllCertificates,
  verifyCertificatePublic,
  revokeCertificate,
  downloadCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const certificateValidator = require('../validators/certificateValidator');
const { certificateGenerationLimiter, certificateUploadLimiter } = require('../middleware/rateLimiter');

// ─── Public Routes ───────────────────────────────────────────
router.get('/verify/:certificateId', verifyCertificatePublic);

// ─── Student Routes ──────────────────────────────────────────
router.get('/my', protect, getMyCertificates);

// ─── Private Download (Student + Admin) ─────────────────────
router.get('/:id/download', protect, downloadCertificate);

// ─── Admin Template CRUD Routes ──────────────────────────────
router.get('/templates/stats', protect, authorize('admin'), getTemplateStats);
router.get('/templates', protect, authorize('admin'), getTemplates);
router.post(
  '/templates',
  protect,
  authorize('admin'),
  certificateUploadLimiter,
  validate(certificateValidator.createTemplate),
  createTemplate
);
router.put(
  '/templates/:id',
  protect,
  authorize('admin'),
  validate(certificateValidator.updateTemplate),
  updateTemplate
);
router.put(
  '/templates/:id/toggle-status',
  protect,
  authorize('admin'),
  validate(certificateValidator.toggleStatus),
  toggleTemplateStatus
);
router.get('/templates/:id/download', protect, authorize('admin'), downloadTemplate);
router.delete('/templates/:id', protect, authorize('admin'), deleteTemplate);

// ─── Admin Certificate Generation & Management ──────────────
router.post(
  '/generate',
  protect,
  authorize('admin'),
  certificateGenerationLimiter,
  validate(certificateValidator.generateCertificate),
  generateCertificate
);
router.post(
  '/bulk-generate',
  protect,
  authorize('admin'),
  certificateGenerationLimiter,
  validate(certificateValidator.bulkGenerate),
  bulkGenerate
);
router.post(
  '/preview',
  protect,
  authorize('admin'),
  validate(certificateValidator.generateCertificate),
  previewCertificate
);
router.get('/admin/all', protect, authorize('admin'), getAllCertificates);
router.put('/:id/revoke', protect, authorize('admin'), revokeCertificate);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  getMyCertificates,
  verifyCertificatePublic,
  revokeCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const certificateValidator = require('../validators/certificateValidator');

// ─── Public Routes ───────────────────────────────────────────
router.get('/verify/:certificateId', verifyCertificatePublic);

// ─── Student Routes ──────────────────────────────────────────
router.get('/my', protect, getMyCertificates);

// ─── Admin Template CRUD Routes ──────────────────────────────
router.get('/templates', protect, authorize('admin'), getTemplates);
router.post('/templates', protect, authorize('admin'), validate(certificateValidator.createTemplate), createTemplate);
router.put('/templates/:id', protect, authorize('admin'), validate(certificateValidator.updateTemplate), updateTemplate);
router.delete('/templates/:id', protect, authorize('admin'), deleteTemplate);

// ─── Admin Certificate Generation & Revocation ──────────────
router.post('/generate', protect, authorize('admin'), validate(certificateValidator.generateCertificate), generateCertificate);
router.put('/:id/revoke', protect, authorize('admin'), revokeCertificate);

module.exports = router;

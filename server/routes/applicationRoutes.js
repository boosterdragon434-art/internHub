const express = require('express');
const router = express.Router();
const {
  createApplication,
  getMyApplications,
  getMyEnrollments,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  completeApplication,
  assignPayment,
  bulkAction,
  exportCsv,
  getApplicationStats,
  sendOfferLetter,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const applicationValidator = require('../validators/applicationValidator');
const { uploadApplicationDocuments } = require('../middleware/upload');

// Student routes
router.post('/', protect, authorize('student'), uploadApplicationDocuments, validate(applicationValidator.create), createApplication);
router.get('/my', protect, authorize('student'), getMyApplications);
router.get('/my-enrollments', protect, authorize('student'), getMyEnrollments);

// Admin routes
router.get('/stats', protect, authorize('admin'), getApplicationStats);
router.get('/export/csv', protect, authorize('admin'), exportCsv);
router.post('/bulk', protect, authorize('admin'), validate(applicationValidator.bulkAction), bulkAction);
router.get('/', protect, authorize('admin'), getAllApplications);
router.get('/:id', protect, authorize('admin'), getApplication);
router.put('/:id/status', protect, authorize('admin'), validate(applicationValidator.updateStatus), updateApplicationStatus);
router.put('/:id/complete', protect, authorize('admin'), completeApplication);
router.post('/:id/send-offer-letter', protect, authorize('admin'), sendOfferLetter);
router.put('/:id/assign-payment', protect, authorize('admin'), validate(applicationValidator.assignPayment), assignPayment);

module.exports = router;


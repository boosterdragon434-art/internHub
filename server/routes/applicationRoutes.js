const express = require('express');
const router = express.Router();
const {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  completeApplication,
  assignPayment,
  bulkAction,
  exportCsv,
  getApplicationStats,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const applicationValidator = require('../validators/applicationValidator');
const { uploadResume } = require('../middleware/upload');

// Student routes
router.post('/', protect, authorize('student'), uploadResume, validate(applicationValidator.create), createApplication);
router.get('/my', protect, authorize('student'), getMyApplications);

// Admin routes
router.get('/stats', protect, authorize('admin'), getApplicationStats);
router.get('/export/csv', protect, authorize('admin'), exportCsv);
router.post('/bulk', protect, authorize('admin'), validate(applicationValidator.bulkAction), bulkAction);
router.get('/', protect, authorize('admin'), getAllApplications);
router.get('/:id', protect, authorize('admin'), getApplication);
router.put('/:id/status', protect, authorize('admin'), validate(applicationValidator.updateStatus), updateApplicationStatus);
router.put('/:id/complete', protect, authorize('admin'), completeApplication);
router.put('/:id/assign-payment', protect, authorize('admin'), validate(applicationValidator.assignPayment), assignPayment);

module.exports = router;


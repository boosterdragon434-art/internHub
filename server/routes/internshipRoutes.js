const express = require('express');
const router = express.Router();
const {
  getInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipStats,
} = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const internshipValidator = require('../validators/internshipValidator');
const { uploadImage } = require('../middleware/upload');

// Admin stats route (must be before :id route)
router.get('/stats', protect, authorize('admin'), getInternshipStats);

// Public routes
router.get('/', getInternships);
router.get('/:id', getInternship);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), uploadImage, validate(internshipValidator.create), createInternship);
router.put('/:id', protect, authorize('admin'), uploadImage, validate(internshipValidator.update), updateInternship);
router.delete('/:id', protect, authorize('admin'), deleteInternship);

module.exports = router;

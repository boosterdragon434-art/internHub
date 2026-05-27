const express = require('express');
const router = express.Router();
const {
  updateProfile,
  uploadResume,
  changePassword,
  getAllUsers,
  getUserStats,
  createGuide,
  assignGuideToStudent,
  unassignGuide,
  getAllGuides,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadResume: multerUploadResume } = require('../middleware/upload');
const validate = require('../middleware/validate');
const userValidator = require('../validators/userValidator');

// Private routes for logged-in users
router.put('/profile', protect, validate(userValidator.updateProfile), updateProfile);
router.put('/resume', protect, multerUploadResume, uploadResume);
router.put('/password', protect, validate(userValidator.changePassword), changePassword);

// Admin-only routes
router.get('/stats', protect, authorize('admin'), getUserStats);
router.get('/guides', protect, authorize('admin'), getAllGuides);
router.post('/guides', protect, authorize('admin'), createGuide);
router.put('/assign-guide', protect, authorize('admin'), assignGuideToStudent);
router.put('/unassign-guide', protect, authorize('admin'), unassignGuide);
router.get('/', protect, authorize('admin'), getAllUsers);

module.exports = router;

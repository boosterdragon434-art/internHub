const express = require('express');
const router = express.Router();
const {
  getGuideDashboard,
  getAssignedStudents,
  getStudentProgress,
  updateGuideProfile,
} = require('../controllers/guideController');
const { protect, authorize } = require('../middleware/auth');

// All guide routes are protected and restricted to the 'guide' role
router.get('/dashboard', protect, authorize('guide'), getGuideDashboard);
router.get('/students', protect, authorize('guide'), getAssignedStudents);
router.get('/students/:id/progress', protect, authorize('guide'), getStudentProgress);
router.put('/profile', protect, authorize('guide'), updateGuideProfile);

module.exports = router;

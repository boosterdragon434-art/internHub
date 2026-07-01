const express = require('express');
const router = express.Router();
const {
  checkIn,
  breakStart,
  breakEnd,
  checkOut,
  getMyStatus,
  getMyHistory,
  getMyStats,
  getGuideStudentAttendance,
  getGuideAnalytics,
  exportGuideAttendance,
  getAdminAllAttendance,
  getAdminAnalytics,
  exportAdminAttendance,
  getAttendanceSettings,
  updateAttendanceSettings,
  getLiveStatus,
  getAdminMonthlyHours,
  getGuideMonthlyHours,
  getMyMonthlyHours,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const attendanceValidator = require('../validators/attendanceValidator');

// ─── Student routes (any authenticated student) ─────────────────────
router.post(
  '/check-in',
  protect,
  authorize('student'),
  validate(attendanceValidator.checkIn),
  checkIn
);
router.post(
  '/break-start',
  protect,
  authorize('student'),
  validate(attendanceValidator.breakAction),
  breakStart
);
router.post(
  '/break-end',
  protect,
  authorize('student'),
  validate(attendanceValidator.breakAction),
  breakEnd
);
router.post(
  '/check-out',
  protect,
  authorize('student'),
  validate(attendanceValidator.checkOut),
  checkOut
);
router.get('/my-status', protect, authorize('student'), getMyStatus);
router.get('/my-history', protect, authorize('student'), getMyHistory);
router.get('/my-stats', protect, authorize('student'), getMyStats);
router.get('/my-monthly-hours', protect, authorize('student'), getMyMonthlyHours);

// ─── Guide routes ───────────────────────────────────────────────────
router.get(
  '/guide/students',
  protect,
  authorize('guide'),
  getGuideStudentAttendance
);
router.get(
  '/guide/analytics',
  protect,
  authorize('guide'),
  getGuideAnalytics
);
router.get(
  '/guide/export',
  protect,
  authorize('guide'),
  exportGuideAttendance
);
router.get(
  '/guide/monthly-hours',
  protect,
  authorize('guide'),
  getGuideMonthlyHours
);

// ─── Admin routes ───────────────────────────────────────────────────
router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  getAdminAllAttendance
);
router.get(
  '/admin/analytics',
  protect,
  authorize('admin'),
  getAdminAnalytics
);
router.get(
  '/admin/export',
  protect,
  authorize('admin'),
  exportAdminAttendance
);
router.get(
  '/admin/settings',
  protect,
  authorize('admin'),
  getAttendanceSettings
);
router.put(
  '/admin/settings',
  protect,
  authorize('admin'),
  validate(attendanceValidator.updateSettings),
  updateAttendanceSettings
);
router.get(
  '/admin/live-status',
  protect,
  authorize('admin'),
  getLiveStatus
);
router.get(
  '/admin/monthly-hours',
  protect,
  authorize('admin'),
  getAdminMonthlyHours
);

module.exports = router;

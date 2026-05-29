const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  updateTeamMembers,
  assignTeamGuide,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const teamValidator = require('../validators/teamValidator');

// All team routes are admin-only
router.post(
  '/',
  protect,
  authorize('admin'),
  validate(teamValidator.createTeam),
  createTeam
);
router.get('/', protect, authorize('admin'), getTeams);
router.get('/:id', protect, authorize('admin'), getTeam);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  validate(teamValidator.updateTeam),
  updateTeam
);
router.delete('/:id', protect, authorize('admin'), deleteTeam);
router.put(
  '/:id/members',
  protect,
  authorize('admin'),
  validate(teamValidator.updateMembers),
  updateTeamMembers
);
router.put(
  '/:id/guide',
  protect,
  authorize('admin'),
  validate(teamValidator.assignGuide),
  assignTeamGuide
);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getComments,
  reorderTasks,
  getTaskActivity,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const taskValidator = require('../validators/taskValidator');

// Get all tasks (scoped by role inside controller)
router.get('/', protect, getTasks);

// Drag-n-drop reorder
router.put('/reorder', protect, authorize('admin', 'guide'), validate(taskValidator.reorderTasks), reorderTasks);

// Create task
router.post('/', protect, authorize('admin', 'guide'), validate(taskValidator.createTask), createTask);

// Task-specific routes
router.get('/:id', protect, getTask);
router.put('/:id', protect, validate(taskValidator.updateTask), updateTask);
router.delete('/:id', protect, authorize('admin', 'guide'), deleteTask);

// Comments
router.post('/:id/comments', protect, validate(taskValidator.addComment), addComment);
router.get('/:id/comments', protect, getComments);

// Activity feed
router.get('/:id/activity', protect, getTaskActivity);

module.exports = router;

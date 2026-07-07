const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskActivity = require('../models/TaskActivity');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');

/** In-app route each role's task workspace lives at. */
const ROLE_TASK_PATHS = {
  admin: '/admin/tasks',
  guide: '/guide/tasks',
  student: '/student/tasks',
};

/**
 * Helper to log task activity.
 */
const logActivity = async (taskId, userId, action, details = {}) => {
  try {
    await TaskActivity.create({
      task: taskId,
      user: userId,
      action,
      details,
    });
  } catch (err) {
    logger.error('Failed to log task activity:', err);
  }
};

/**
 * Builds role-aware notification documents for a batch of recipients in a single
 * query, so a guide/admin never receives a notification that deep-links into
 * the student workspace (and vice-versa).
 * @param {Array<string>} userIds
 * @param {(userId: string, role: string) => { title: string, message: string, type: string }} buildPayload
 */
const buildRoleLinkedNotifications = async (userIds, buildPayload) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  if (uniqueIds.length === 0) return [];

  const users = await User.find({ _id: { $in: uniqueIds } }).select('role').lean();
  const roleMap = new Map(users.map((u) => [u._id.toString(), u.role]));

  return uniqueIds.map((id) => {
    const role = roleMap.get(id) || 'student';
    const payload = buildPayload(id, role);
    return {
      user: id,
      link: ROLE_TASK_PATHS[role] || ROLE_TASK_PATHS.student,
      ...payload,
    };
  });
};

/**
 * Notifies a batch of users without letting a notification failure affect the
 * primary request/response flow.
 */
const notifyUsers = async (userIds, buildPayload) => {
  try {
    const notifications = await buildRoleLinkedNotifications(userIds, buildPayload);
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    logger.error('Failed to create task notifications:', err);
  }
};

/**
 * Helper to check role authorization and ownership.
 * Returns true if allowed, false otherwise.
 */
const checkTaskAccess = (task, req) => {
  const { id: userId, role } = req.user;

  if (role === 'admin') return true;

  if (role === 'guide') {
    // A guide can access tasks they created (checking populated or unpopulated createdBy)
    const creatorId = task.createdBy?._id ? task.createdBy._id.toString() : task.createdBy?.toString();
    if (creatorId === userId) return true;

    // Or tasks assigned to students assigned to this guide
    const assignedStudentIds = (req.user.assignedStudents || []).map((id) => id.toString());
    return task.assignees.some((assignee) => {
      const assigneeId = assignee?._id ? assignee._id.toString() : assignee?.toString();
      return assigneeId && assignedStudentIds.includes(assigneeId);
    });
  }

  if (role === 'student') {
    // A student can only access tasks assigned to them (checking populated or unpopulated assignee)
    return task.assignees.some((assignee) => {
      const assigneeId = assignee?._id ? assignee._id.toString() : assignee?.toString();
      return assigneeId === userId;
    });
  }

  return false;
};

/**
 * Ensures a guide can only assign tasks to students under their own cohort.
 * Admins are unrestricted. Returns an error message string, or null if valid.
 */
const validateGuideAssignees = (req, assignees) => {
  if (req.user.role !== 'guide' || !assignees || assignees.length === 0) return null;

  const allowedIds = new Set((req.user.assignedStudents || []).map((id) => id.toString()));
  const hasInvalidAssignee = assignees.some((id) => !allowedIds.has(id.toString()));

  return hasInvalidAssignee ? 'You can only assign tasks to students in your own cohort.' : null;
};

/**
 * @desc    Create a new task (Admin or Guide only)
 * @route   POST /api/tasks
 * @access  Admin, Guide
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      labels,
      assignees,
      internship,
      parentTask,
      dependencies,
      startDate,
      dueDate,
      estimatedHours,
      checklist,
      isRecurring,
      recurringConfig,
    } = req.body;

    const assigneeError = validateGuideAssignees(req, assignees);
    if (assigneeError) {
      return next(ApiError.forbidden(assigneeError));
    }

    // Resolve initial order (place at the end of the current column)
    const taskCount = await Task.countDocuments({ status: status || 'todo' });

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      labels: labels || [],
      assignees: assignees || [],
      createdBy: req.user.id,
      internship: internship || null,
      parentTask: parentTask || null,
      dependencies: dependencies || [],
      startDate: startDate || null,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || 0,
      checklist: checklist || [],
      order: taskCount,
      isRecurring: isRecurring || false,
      recurringConfig: isRecurring ? recurringConfig : undefined,
    });

    // Log creation activity
    await logActivity(task._id, req.user.id, 'created', { title: task.title });

    // Send notifications to assignees
    if (assignees && assignees.length > 0) {
      await notifyUsers(assignees, () => ({
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        type: 'task',
      }));
    }

    const populatedTask = await task.populate([
      { path: 'assignees', select: 'name email avatar role' },
      { path: 'createdBy', select: 'name email avatar role' },
    ]);

    ApiResponse.success(res, 201, 'Task created successfully.', populatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks with filtering (Admin, Guide, Student)
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, internship, parentTask, assigneeId } = req.query;
    const { id: userId, role } = req.user;

    const filter = {};

    // Apply role-based visibility scoping
    if (role === 'student') {
      filter.assignees = userId;
    } else if (role === 'guide') {
      const assignedStudentIds = req.user.assignedStudents || [];
      filter.$or = [
        { createdBy: userId },
        { assignees: { $in: assignedStudentIds } },
      ];
    }

    // Apply query filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (internship) filter.internship = internship;
    if (parentTask) {
      filter.parentTask = parentTask === 'null' ? null : parentTask;
    }
    if (assigneeId) filter.assignees = assigneeId;

    if (search) {
      const escapedSearch = escapeRegex(search);
      const searchConditions = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
      // Merge with existing $or (role visibility) using $and to avoid overwriting
      if (filter.$or) {
        const existingOr = filter.$or;
        delete filter.$or;
        filter.$and = [
          { $or: existingOr },
          { $or: searchConditions },
        ];
      } else {
        filter.$or = searchConditions;
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort('order createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Tasks fetched successfully.', tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single task by ID (Admin, Guide, Student)
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .populate('parentTask', 'title status')
      .populate('dependencies', 'title status');

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to view this task.'));
    }

    ApiResponse.success(res, 200, 'Task fetched successfully.', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a task (Admin, Guide full; Student limited)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to edit this task.'));
    }

    const { role, id: userId } = req.user;
    const updates = {};
    const oldStatus = task.status;

    if (role === 'student') {
      // Students can only change status or update checklist items
      if (req.body.status !== undefined) {
        updates.status = req.body.status;
      }
      if (req.body.checklist !== undefined) {
        updates.checklist = req.body.checklist;
      }
    } else {
      // Guides may only (re)assign students within their own cohort
      if (req.body.assignees !== undefined) {
        const assigneeError = validateGuideAssignees(req, req.body.assignees);
        if (assigneeError) {
          return next(ApiError.forbidden(assigneeError));
        }
      }

      // Admin/Guide can update all fields
      const allowedUpdates = [
        'title',
        'description',
        'status',
        'priority',
        'labels',
        'assignees',
        'internship',
        'parentTask',
        'dependencies',
        'startDate',
        'dueDate',
        'estimatedHours',
        'loggedHours',
        'checklist',
        'isRecurring',
        'recurringConfig',
      ];

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          if ((field === 'startDate' || field === 'dueDate') && req.body[field] === '') {
            updates[field] = null;
          } else {
            updates[field] = req.body[field];
          }
        }
      });
    }

    // Set completion date if status changed to completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed' && task.status === 'completed') {
      updates.completedAt = null;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    })
      .populate('assignees', 'name email avatar role')
      .populate('createdBy', 'name email avatar role');

    // Audit Log and Notification creation
    if (updates.status && updates.status !== oldStatus) {
      await logActivity(taskId, userId, 'status_changed', {
        oldStatus,
        newStatus: updates.status,
      });

      // Notify assignees + creator (excluding whoever just made the change)
      const notifiedUserIds = new Set(updatedTask.assignees.map((a) => a._id.toString()));
      notifiedUserIds.add(updatedTask.createdBy._id.toString());
      notifiedUserIds.delete(userId);

      await notifyUsers(Array.from(notifiedUserIds), () => ({
        title: 'Task Status Updated',
        message: `The status of "${updatedTask.title}" was updated to ${updates.status.replace('_', ' ')} by ${req.user.name}.`,
        type: 'task',
      }));
    } else {
      await logActivity(taskId, userId, 'updated', updates);
    }

    ApiResponse.success(res, 200, 'Task updated successfully.', updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task (Admin or Guide only)
 * @route   DELETE /api/tasks/:id
 * @access  Admin, Guide
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to delete this task.'));
    }

    // Detach subtasks rather than cascading the delete to them
    await Task.updateMany({ parentTask: task._id }, { parentTask: null });

    // Delete comments and activity logs related to this task
    await Promise.all([
      TaskComment.deleteMany({ task: task._id }),
      TaskActivity.deleteMany({ task: task._id }),
      task.deleteOne(),
    ]);

    ApiResponse.success(res, 200, 'Task and its associated data deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a comment to a task (Admin, Guide, Student)
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to comment on this task.'));
    }

    const { content, attachments } = req.body;

    // Detect mentions in the format @[UserId]
    const mentionRegex = /@([a-fA-F0-9]{24})/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    const comment = await TaskComment.create({
      task: taskId,
      author: req.user.id,
      content,
      mentions,
      attachments: attachments || [],
    });

    const populatedComment = await comment.populate('author', 'name email avatar role');

    // Log commented activity
    await logActivity(taskId, req.user.id, 'commented', { commentId: comment._id });

    // Notify task assignees, creator, and mentioned users
    const notifiedUserIds = new Set(mentions);
    task.assignees.forEach((assigneeId) => notifiedUserIds.add(assigneeId.toString()));
    notifiedUserIds.add(task.createdBy.toString());
    notifiedUserIds.delete(req.user.id); // exclude the comment author

    await notifyUsers(Array.from(notifiedUserIds), (id) => {
      const isMentioned = mentions.includes(id);
      return {
        title: isMentioned ? 'Mentioned in a Task' : 'New Task Comment',
        message: isMentioned
          ? `${req.user.name} mentioned you in a comment on "${task.title}".`
          : `${req.user.name} commented on task "${task.title}".`,
        type: 'task',
      };
    });

    ApiResponse.success(res, 201, 'Comment added successfully.', populatedComment);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for a task (Admin, Guide, Student)
 * @route   GET /api/tasks/:id/comments
 * @access  Private
 */
const getComments = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to view comments on this task.'));
    }

    const comments = await TaskComment.find({ task: task._id })
      .populate('author', 'name email avatar role')
      .sort('createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Comments fetched successfully.', comments);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder tasks drag-and-drop (Admin or Guide only)
 * @route   PUT /api/tasks/reorder
 * @access  Admin, Guide
 */
const reorderTasks = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return next(ApiError.badRequest('orderedIds array is required.'));
    }

    // Perform bulk updates of order fields
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    ApiResponse.success(res, 200, 'Tasks reordered successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity feed for a task (Admin, Guide, Student)
 * @route   GET /api/tasks/:id/activity
 * @access  Private
 */
const getTaskActivity = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(ApiError.notFound('Task not found.'));
    }

    if (!checkTaskAccess(task, req)) {
      return next(ApiError.forbidden('You are not authorized to view activity for this task.'));
    }

    const activities = await TaskActivity.find({ task: task._id })
      .populate('user', 'name email avatar role')
      .sort('-createdAt')
      .lean();

    ApiResponse.success(res, 200, 'Task activities fetched successfully.', activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getComments,
  reorderTasks,
  getTaskActivity,
};

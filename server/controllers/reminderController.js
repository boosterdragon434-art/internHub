const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { processDueReminders } = require('../services/reminderService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

/**
 * Check if the current user has access to a specific reminder.
 */
const checkReminderAccess = async (reminder, req) => {
  const { id: userId, role } = req.user;

  if (role === 'admin') return true;

  if (role === 'guide') {
    // Guide has access if they created it
    if (reminder.createdBy.toString() === userId) return true;

    // Or if the recipient is one of their assigned students
    const guide = await User.findById(userId).select('assignedStudents');
    const studentIds = guide.assignedStudents.map((id) => id.toString());
    if (studentIds.includes(reminder.user.toString())) return true;

    return false;
  }

  // Student has access if they are the recipient user
  return reminder.user.toString() === userId;
};

/**
 * @desc    Create a new reminder
 * @route   POST /api/reminders
 * @access  Private
 */
const createReminder = async (req, res, next) => {
  try {
    const { title, description, type, triggerAt, isRecurring, recurringConfig, channels, user, relatedTask } = req.body;
    const { id: currentUserId, role } = req.user;

    if (!title || !triggerAt) {
      return next(ApiError.badRequest('Reminder title and trigger date/time are required.'));
    }

    // Resolve recipient user ID
    let recipientUserId = currentUserId;
    if (user && user !== currentUserId) {
      if (role === 'student') {
        return next(ApiError.forbidden('Students can only schedule reminders for themselves.'));
      }
      
      if (role === 'guide') {
        // Verify student is assigned to this guide
        const guide = await User.findById(currentUserId).select('assignedStudents');
        const assignedStudentIds = guide.assignedStudents.map((id) => id.toString());
        if (!assignedStudentIds.includes(user.toString())) {
          return next(ApiError.forbidden('You can only create reminders for your assigned students.'));
        }
      }
      recipientUserId = user;
    }

    const reminder = await Reminder.create({
      user: recipientUserId,
      title,
      description: description || '',
      type: type || 'custom',
      triggerAt,
      isRecurring: isRecurring || false,
      recurringConfig: isRecurring ? recurringConfig : undefined,
      channels: channels || ['in_app'],
      relatedTask: relatedTask || null,
      createdBy: currentUserId,
      status: 'pending',
    });

    logger.info(`Reminder created: "${title}" for user ${recipientUserId} by ${currentUserId}`);

    ApiResponse.success(res, 201, 'Reminder scheduled successfully.', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reminders (scoped by role visibility)
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { status, type, search } = req.query;

    const filter = {};

    // Apply role-based visibility scoping
    if (role === 'student') {
      filter.user = userId;
    } else if (role === 'guide') {
      const guide = await User.findById(userId).select('assignedStudents');
      const studentIds = guide.assignedStudents || [];
      filter.$or = [
        { createdBy: userId },
        { user: userId },
        { user: { $in: studentIds } },
      ];
    }

    // Filters
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (search) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      );
    }

    const reminders = await Reminder.find(filter)
      .populate('user', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort('triggerAt')
      .lean();

    ApiResponse.success(res, 200, 'Reminders fetched successfully.', reminders);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a reminder
 * @route   PUT /api/reminders/:id
 * @access  Private
 */
const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return next(ApiError.notFound('Reminder not found.'));
    }

    const hasAccess = await checkReminderAccess(reminder, req);
    if (!hasAccess) {
      return next(ApiError.forbidden('You are not authorized to update this reminder.'));
    }

    const allowedUpdates = ['title', 'description', 'type', 'triggerAt', 'isRecurring', 'recurringConfig', 'channels', 'status'];
    
    // Students cannot change the recipient, related tasks, or author fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });

    await reminder.save();

    ApiResponse.success(res, 200, 'Reminder updated successfully.', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dismiss a reminder
 * @route   PUT /api/reminders/:id/dismiss
 * @access  Private
 */
const dismissReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return next(ApiError.notFound('Reminder not found.'));
    }

    const hasAccess = await checkReminderAccess(reminder, req);
    if (!hasAccess) {
      return next(ApiError.forbidden('You are not authorized to dismiss this reminder.'));
    }

    reminder.status = 'dismissed';
    await reminder.save();

    ApiResponse.success(res, 200, 'Reminder dismissed successfully.', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a reminder
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return next(ApiError.notFound('Reminder not found.'));
    }

    const hasAccess = await checkReminderAccess(reminder, req);
    if (!hasAccess) {
      return next(ApiError.forbidden('You are not authorized to delete this reminder.'));
    }

    await reminder.deleteOne();

    ApiResponse.success(res, 200, 'Reminder deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manual diagnostic trigger to process due reminders (Admin only)
 * @route   POST /api/reminders/trigger
 * @access  Admin
 */
const manualTriggerReminders = async (req, res, next) => {
  try {
    await processDueReminders();
    ApiResponse.success(res, 200, 'Due reminders processed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReminder,
  getReminders,
  updateReminder,
  dismissReminder,
  deleteReminder,
  manualTriggerReminders,
};

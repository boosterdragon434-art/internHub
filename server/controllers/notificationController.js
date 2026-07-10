const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    ApiResponse.success(res, 200, 'Notifications fetched.', {
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true }
    );
    ApiResponse.success(res, 200, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    ApiResponse.success(res, 200, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!deleted) {
      return next(ApiError.notFound('Notification not found.'));
    }
    
    ApiResponse.success(res, 200, 'Notification deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const clearReadNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      user: req.user.id,
      isRead: true,
    });
    
    ApiResponse.success(res, 200, 'Read notifications cleared successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearReadNotifications 
};

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const driveService = require('../services/driveService');
const { DRIVE_FOLDERS, PAGINATION } = require('../config/constants');

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'college', 'department', 'yearOfStudy', 'skills'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    ApiResponse.success(res, 200, 'Profile updated successfully.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        skills: user.skills,
        role: user.role,
        resumeUrl: user.resumeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload/re-upload resume
 * @route   PUT /api/users/resume
 * @access  Private
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('Please upload a PDF resume.'));
    }

    const user = await User.findById(req.user.id);

    // Delete old resume from Drive
    if (user.resumeDriveId) {
      await driveService.deleteFile(user.resumeDriveId);
    }

    const { fileId, webViewLink } = await driveService.uploadFile(
      req.file.buffer,
      `resume_${user.name}_${Date.now()}.pdf`,
      req.file.mimetype,
      DRIVE_FOLDERS.RESUMES
    );

    user.resumeUrl = webViewLink;
    user.resumeDriveId = fileId;
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, 200, 'Resume uploaded successfully.', {
      resumeUrl: webViewLink,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(ApiError.badRequest('Current and new password are required.'));
    }

    if (newPassword.length < 6) {
      return next(ApiError.badRequest('New password must be at least 6 characters.'));
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(ApiError.unauthorized('Current password is incorrect.'));
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (admin)
 * @route   GET /api/users
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      role,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Users fetched successfully.',
      users,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Admin
 */
const getUserStats = async (req, res, next) => {
  try {
    const [totalStudents, totalAdmins, verifiedCount, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isEmailVerified: true }),
      User.find({ role: 'student' })
        .select('name email college createdAt')
        .sort('-createdAt')
        .limit(5)
        .lean(),
    ]);

    ApiResponse.success(res, 200, 'User statistics fetched.', {
      totalStudents,
      totalAdmins,
      verifiedCount,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  uploadResume,
  changePassword,
  getAllUsers,
  getUserStats,
};

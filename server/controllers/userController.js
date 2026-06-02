const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const cloudinaryService = require('../services/cloudinaryService');
const { PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');

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

    // Delete old resume from Cloudinary
    if (user.resumePublicId) {
      await cloudinaryService.deleteFile(user.resumePublicId, 'auto');
    }

    const { publicId, secureUrl } = await cloudinaryService.uploadFile(
      req.file.buffer,
      'internhub/resumes',
      'auto'
    );

    user.resumeUrl = secureUrl;
    user.resumePublicId = publicId;
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, 200, 'Resume uploaded successfully.', {
      resumeUrl: secureUrl,
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
    const [totalStudents, totalAdmins, totalGuides, verifiedCount, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'guide' }),
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
      totalGuides,
      verifiedCount,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new guide account (admin only)
 * @route   POST /api/users/guides
 * @access  Admin
 */
const createGuide = async (req, res, next) => {
  try {
    const { name, email, password, phone, expertise, bio } = req.body;

    if (!name || !email || !password) {
      return next(ApiError.badRequest('Name, email, and password are required.'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email already exists.'));
    }

    const guide = await User.create({
      name,
      email,
      password,
      phone,
      expertise: expertise || [],
      bio: bio || '',
      role: 'guide',
      isEmailVerified: true, // Admin-created accounts are pre-verified
    });

    logger.info(`Admin ${req.user.email} created guide account: ${guide.email}`);

    ApiResponse.success(res, 201, 'Guide account created successfully.', {
      guide: {
        id: guide._id,
        name: guide.name,
        email: guide.email,
        role: guide.role,
        expertise: guide.expertise,
        bio: guide.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a guide to a student
 * @route   PUT /api/users/assign-guide
 * @access  Admin
 */
const assignGuideToStudent = async (req, res, next) => {
  try {
    const { guideId, studentId } = req.body;

    if (!guideId || !studentId) {
      return next(ApiError.badRequest('Both guideId and studentId are required.'));
    }

    const guide = await User.findOne({ _id: guideId, role: 'guide' });
    if (!guide) {
      return next(ApiError.notFound('Guide not found.'));
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return next(ApiError.notFound('Student not found.'));
    }

    // Check if student is already assigned to this guide
    if (student.assignedGuide && student.assignedGuide.toString() === guideId) {
      return next(ApiError.conflict('Student is already assigned to this guide.'));
    }

    // If student was assigned to a different guide, remove from that guide's list
    if (student.assignedGuide) {
      await User.findByIdAndUpdate(student.assignedGuide, {
        $pull: { assignedStudents: studentId },
      });
    }

    // Assign guide to student
    student.assignedGuide = guideId;
    await student.save({ validateBeforeSave: false });

    // Add student to guide's assigned list (avoid duplicates)
    if (!guide.assignedStudents.includes(studentId)) {
      guide.assignedStudents.push(studentId);
      await guide.save({ validateBeforeSave: false });
    }

    logger.info(`Admin ${req.user.email} assigned guide ${guide.email} to student ${student.email}`);

    ApiResponse.success(res, 200, 'Guide assigned to student successfully.', {
      guide: { id: guide._id, name: guide.name },
      student: { id: student._id, name: student.name },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unassign a guide from a student
 * @route   PUT /api/users/unassign-guide
 * @access  Admin
 */
const unassignGuide = async (req, res, next) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return next(ApiError.badRequest('studentId is required.'));
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return next(ApiError.notFound('Student not found.'));
    }

    if (!student.assignedGuide) {
      return next(ApiError.badRequest('Student has no guide assigned.'));
    }

    const guideId = student.assignedGuide;

    // Remove student from guide's list
    await User.findByIdAndUpdate(guideId, {
      $pull: { assignedStudents: studentId },
    });

    // Remove guide from student
    student.assignedGuide = null;
    await student.save({ validateBeforeSave: false });

    logger.info(`Admin ${req.user.email} unassigned guide from student ${student.email}`);

    ApiResponse.success(res, 200, 'Guide unassigned from student successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all guides (admin)
 * @route   GET /api/users/guides
 * @access  Admin
 */
const getAllGuides = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = { role: 'guide' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const guides = await User.find(filter)
      .select('name email phone expertise bio assignedStudents isActive createdAt')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Enrich with assigned student count
    const enrichedGuides = guides.map((g) => ({
      ...g,
      assignedStudentCount: g.assignedStudents ? g.assignedStudents.length : 0,
    }));

    ApiResponse.success(
      res,
      200,
      'Guides fetched successfully.',
      enrichedGuides,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
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
  createGuide,
  assignGuideToStudent,
  unassignGuide,
  getAllGuides,
};

const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');

/**
 * @desc    Get guide's dashboard statistics
 * @route   GET /api/guides/dashboard
 * @access  Guide
 */
const getGuideDashboard = async (req, res, next) => {
  try {
    const guideId = req.user.id;

    // Get assigned students
    const guide = await User.findById(guideId).select('assignedStudents');
    const studentIds = guide.assignedStudents || [];

    // Parallel queries for dashboard stats
    const [
      totalStudents,
      activeStudents,
      studentApplications,
      recentStudents,
    ] = await Promise.all([
      studentIds.length,
      User.countDocuments({ _id: { $in: studentIds }, isActive: true }),
      Application.countDocuments({ user: { $in: studentIds } }),
      User.find({ _id: { $in: studentIds } })
        .select('name email college department avatar isActive createdAt')
        .sort('-createdAt')
        .limit(5)
        .lean(),
    ]);

    // Get application status breakdown for assigned students
    const applicationStats = await Application.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    ApiResponse.success(res, 200, 'Guide dashboard data fetched.', {
      totalStudents,
      activeStudents,
      totalApplications: studentApplications,
      applicationStats,
      recentStudents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assigned students for the guide
 * @route   GET /api/guides/students
 * @access  Guide
 */
const getAssignedStudents = async (req, res, next) => {
  try {
    const guideId = req.user.id;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const guide = await User.findById(guideId).select('assignedStudents');
    const studentIds = guide.assignedStudents || [];

    const filter = { _id: { $in: studentIds } };

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { college: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const students = await User.find(filter)
      .select('name email phone college department yearOfStudy skills avatar isActive createdAt')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Assigned students fetched successfully.',
      students,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific student's progress (only if assigned to this guide)
 * @route   GET /api/guides/students/:id/progress
 * @access  Guide
 */
const getStudentProgress = async (req, res, next) => {
  try {
    const guideId = req.user.id;
    const studentId = req.params.id;

    // Verify the student is assigned to this guide
    const guide = await User.findById(guideId).select('assignedStudents');
    const isAssigned = guide.assignedStudents.some(
      (id) => id.toString() === studentId
    );

    if (!isAssigned) {
      return next(
        ApiError.forbidden('You are not authorized to view this student\'s progress.')
      );
    }

    // Get student details
    const student = await User.findById(studentId)
      .select('name email phone college department yearOfStudy skills avatar resumeUrl isActive createdAt')
      .lean();

    if (!student) {
      return next(ApiError.notFound('Student not found.'));
    }

    // Get student's applications with internship details
    const applications = await Application.find({ user: studentId })
      .populate('internship', 'title category mode duration status')
      .sort('-createdAt')
      .lean();

    // Calculate progress metrics
    const totalApplications = applications.length;
    const approvedCount = applications.filter((a) => a.status === 'Approved').length;
    const joinedCount = applications.filter((a) => a.status === 'Joined').length;
    const completionRate = totalApplications > 0
      ? Math.round((joinedCount / totalApplications) * 100)
      : 0;

    ApiResponse.success(res, 200, 'Student progress fetched.', {
      student,
      applications,
      metrics: {
        totalApplications,
        approvedCount,
        joinedCount,
        completionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update guide's own profile
 * @route   PUT /api/guides/profile
 * @access  Guide
 */
const updateGuideProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'bio', 'expertise', 'skills'];
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

    ApiResponse.success(res, 200, 'Guide profile updated successfully.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        expertise: user.expertise,
        skills: user.skills,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGuideDashboard,
  getAssignedStudents,
  getStudentProgress,
  updateGuideProfile,
};

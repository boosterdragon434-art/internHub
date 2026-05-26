const Internship = require('../models/Internship');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const driveService = require('../services/driveService');
const { PAGINATION, DRIVE_FOLDERS } = require('../config/constants');

/**
 * @desc    Get all internships (public, with search/filter/sort/pagination)
 * @route   GET /api/internships
 * @access  Public
 */
const getInternships = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      category,
      mode,
      status = 'active',
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (mode) filter.mode = mode;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Internship.countDocuments(filter);
    const internships = await Internship.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Internships fetched successfully.',
      internships,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single internship
 * @route   GET /api/internships/:id
 * @access  Public
 */
const getInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id).lean();

    if (!internship) {
      return next(ApiError.notFound('Internship not found.'));
    }

    // Get application count for this internship
    const applicationCount = await Application.countDocuments({
      internship: internship._id,
    });

    ApiResponse.success(res, 200, 'Internship fetched successfully.', {
      ...internship,
      applicationCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create internship
 * @route   POST /api/internships
 * @access  Admin
 */
const createInternship = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // Handle image upload to Google Drive
    if (req.file) {
      const { fileId, webViewLink } = await driveService.uploadFile(
        req.file.buffer,
        `internship_${Date.now()}_${req.file.originalname}`,
        req.file.mimetype,
        DRIVE_FOLDERS.IMAGES
      );
      req.body.imageUrl = webViewLink;
      req.body.imageDriveId = fileId;
    }

    const internship = await Internship.create(req.body);

    ApiResponse.success(res, 201, 'Internship created successfully.', internship);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update internship
 * @route   PUT /api/internships/:id
 * @access  Admin
 */
const updateInternship = async (req, res, next) => {
  try {
    let internship = await Internship.findById(req.params.id);

    if (!internship) {
      return next(ApiError.notFound('Internship not found.'));
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image from Drive
      if (internship.imageDriveId) {
        await driveService.deleteFile(internship.imageDriveId);
      }

      const { fileId, webViewLink } = await driveService.uploadFile(
        req.file.buffer,
        `internship_${Date.now()}_${req.file.originalname}`,
        req.file.mimetype,
        DRIVE_FOLDERS.IMAGES
      );
      req.body.imageUrl = webViewLink;
      req.body.imageDriveId = fileId;
    }

    internship = await Internship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    ApiResponse.success(res, 200, 'Internship updated successfully.', internship);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete internship
 * @route   DELETE /api/internships/:id
 * @access  Admin
 */
const deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return next(ApiError.notFound('Internship not found.'));
    }

    // Delete image from Drive
    if (internship.imageDriveId) {
      await driveService.deleteFile(internship.imageDriveId);
    }

    await Internship.findByIdAndDelete(req.params.id);

    ApiResponse.success(res, 200, 'Internship deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get internship statistics
 * @route   GET /api/internships/stats
 * @access  Admin
 */
const getInternshipStats = async (req, res, next) => {
  try {
    const [total, active, closed, draft, byCategory, byMode] = await Promise.all([
      Internship.countDocuments(),
      Internship.countDocuments({ status: 'active' }),
      Internship.countDocuments({ status: 'closed' }),
      Internship.countDocuments({ status: 'draft' }),
      Internship.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Internship.aggregate([
        { $group: { _id: '$mode', count: { $sum: 1 } } },
      ]),
    ]);

    ApiResponse.success(res, 200, 'Internship statistics fetched.', {
      total,
      active,
      closed,
      draft,
      byCategory,
      byMode,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipStats,
};

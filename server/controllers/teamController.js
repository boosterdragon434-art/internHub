const InternGroup = require('../models/InternGroup');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Create a new intern team/group
 * @route   POST /api/teams
 * @access  Admin
 */
const createTeam = async (req, res, next) => {
  try {
    const { name, description, guide, members } = req.body;

    // Validate guide exists and is a guide
    if (guide) {
      const guideUser = await User.findById(guide).select('role').lean();
      if (!guideUser || guideUser.role !== 'guide') {
        return next(ApiError.badRequest('Invalid guide. User must have the guide role.'));
      }
    }

    // Validate members are students
    if (members && members.length > 0) {
      const validStudents = await User.countDocuments({
        _id: { $in: members },
        role: 'student',
      });
      if (validStudents !== members.length) {
        return next(
          ApiError.badRequest('One or more members are not valid students.')
        );
      }
    }

    const team = await InternGroup.create({
      name,
      description: description || '',
      guide: guide || null,
      members: members || [],
      createdBy: req.user.id,
    });

    // If guide is assigned, also update the guide's assignedStudents
    if (guide && members && members.length > 0) {
      await User.findByIdAndUpdate(guide, {
        $addToSet: { assignedStudents: { $each: members } },
      });
      // Update each student's assignedGuide
      await User.updateMany(
        { _id: { $in: members } },
        { $set: { assignedGuide: guide } }
      );
    }

    const populated = await InternGroup.findById(team._id)
      .populate('guide', 'name email')
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name')
      .lean();

    logger.info(`Team created: ${name} by admin=${req.user.id}`);

    ApiResponse.success(res, 201, 'Team created successfully.', { team: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all teams with filters
 * @route   GET /api/teams
 * @access  Admin
 */
const getTeams = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      guideId,
      isActive,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};
    if (guideId) filter.guide = guideId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [total, teams] = await Promise.all([
      InternGroup.countDocuments(filter),
      InternGroup.find(filter)
        .populate('guide', 'name email avatar')
        .populate('members', 'name email avatar')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    ApiResponse.success(
      res,
      200,
      'Teams fetched successfully.',
      teams,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single team by ID
 * @route   GET /api/teams/:id
 * @access  Admin
 */
const getTeam = async (req, res, next) => {
  try {
    const team = await InternGroup.findById(req.params.id)
      .populate('guide', 'name email avatar bio expertise')
      .populate('members', 'name email avatar college department yearOfStudy')
      .populate('createdBy', 'name')
      .lean();

    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    ApiResponse.success(res, 200, 'Team fetched.', { team });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a team
 * @route   PUT /api/teams/:id
 * @access  Admin
 */
const updateTeam = async (req, res, next) => {
  try {
    const { name, description, guide, members, isActive } = req.body;

    const team = await InternGroup.findById(req.params.id);
    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    // Validate guide if changing
    if (guide !== undefined) {
      if (guide) {
        const guideUser = await User.findById(guide).select('role').lean();
        if (!guideUser || guideUser.role !== 'guide') {
          return next(ApiError.badRequest('Invalid guide.'));
        }
      }
      team.guide = guide;
    }

    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;
    if (isActive !== undefined) team.isActive = isActive;

    if (members !== undefined) {
      // Validate members are students
      if (members.length > 0) {
        const validStudents = await User.countDocuments({
          _id: { $in: members },
          role: 'student',
        });
        if (validStudents !== members.length) {
          return next(
            ApiError.badRequest('One or more members are not valid students.')
          );
        }
      }
      team.members = members;

      // Sync guide assignments if guide is set
      if (team.guide) {
        await User.findByIdAndUpdate(team.guide, {
          $addToSet: { assignedStudents: { $each: members } },
        });
        await User.updateMany(
          { _id: { $in: members } },
          { $set: { assignedGuide: team.guide } }
        );
      }
    }

    await team.save();

    const populated = await InternGroup.findById(team._id)
      .populate('guide', 'name email avatar')
      .populate('members', 'name email avatar')
      .lean();

    logger.info(`Team updated: ${team._id} by admin=${req.user.id}`);

    ApiResponse.success(res, 200, 'Team updated successfully.', { team: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (soft) a team
 * @route   DELETE /api/teams/:id
 * @access  Admin
 */
const deleteTeam = async (req, res, next) => {
  try {
    const team = await InternGroup.findById(req.params.id);
    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    team.isActive = false;
    await team.save();

    logger.info(`Team soft-deleted: ${team._id} by admin=${req.user.id}`);

    ApiResponse.success(res, 200, 'Team deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk add/remove members from a team
 * @route   PUT /api/teams/:id/members
 * @access  Admin
 */
const updateTeamMembers = async (req, res, next) => {
  try {
    const { add, remove } = req.body;

    const team = await InternGroup.findById(req.params.id);
    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    // Add members
    if (add && add.length > 0) {
      const validStudents = await User.countDocuments({
        _id: { $in: add },
        role: 'student',
      });
      if (validStudents !== add.length) {
        return next(
          ApiError.badRequest('One or more users to add are not valid students.')
        );
      }

      // Add to team
      const addIds = add.map((id) => id.toString());
      const existingIds = team.members.map((m) => m.toString());
      const newMembers = addIds.filter((id) => !existingIds.includes(id));
      team.members.push(...newMembers);

      // Sync with guide assignments
      if (team.guide) {
        await User.findByIdAndUpdate(team.guide, {
          $addToSet: { assignedStudents: { $each: newMembers } },
        });
        await User.updateMany(
          { _id: { $in: newMembers } },
          { $set: { assignedGuide: team.guide } }
        );
      }
    }

    // Remove members
    if (remove && remove.length > 0) {
      const removeSet = new Set(remove.map((id) => id.toString()));
      team.members = team.members.filter(
        (m) => !removeSet.has(m.toString())
      );
    }

    await team.save();

    const populated = await InternGroup.findById(team._id)
      .populate('guide', 'name email avatar')
      .populate('members', 'name email avatar')
      .lean();

    logger.info(`Team members updated: ${team._id} by admin=${req.user.id}`);

    ApiResponse.success(res, 200, 'Team members updated.', { team: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign or change guide for a team
 * @route   PUT /api/teams/:id/guide
 * @access  Admin
 */
const assignTeamGuide = async (req, res, next) => {
  try {
    const { guideId } = req.body;

    const team = await InternGroup.findById(req.params.id);
    if (!team) {
      return next(ApiError.notFound('Team not found.'));
    }

    if (guideId) {
      const guideUser = await User.findById(guideId).select('role').lean();
      if (!guideUser || guideUser.role !== 'guide') {
        return next(ApiError.badRequest('Invalid guide.'));
      }

      team.guide = guideId;

      // Sync: assign all team members to this guide
      if (team.members.length > 0) {
        await User.findByIdAndUpdate(guideId, {
          $addToSet: {
            assignedStudents: { $each: team.members.map((m) => m.toString()) },
          },
        });
        await User.updateMany(
          { _id: { $in: team.members } },
          { $set: { assignedGuide: guideId } }
        );
      }
    } else {
      team.guide = null;
    }

    await team.save();

    const populated = await InternGroup.findById(team._id)
      .populate('guide', 'name email avatar')
      .populate('members', 'name email avatar')
      .lean();

    logger.info(
      `Team guide ${guideId ? 'assigned' : 'removed'}: ${team._id} by admin=${req.user.id}`
    );

    ApiResponse.success(res, 200, 'Team guide updated.', { team: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  updateTeamMembers,
  assignTeamGuide,
};

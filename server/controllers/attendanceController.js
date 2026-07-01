const AttendanceSession = require('../models/AttendanceSession');
const AttendanceSettings = require('../models/AttendanceSettings');
const User = require('../models/User');
const InternGroup = require('../models/InternGroup');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { PAGINATION } = require('../config/constants');
const { generateAttendanceExcel } = require('../services/attendanceService');
const logger = require('../utils/logger');
const { getTodayIST, getISTNow, getISTMinutesSinceMidnight, getISTHour } = require('../utils/istTime');

/**
 * Parse an HH:MM time string into total minutes since midnight.
 * @param {string} timeStr
 * @returns {number}
 */
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Maximum plausible work duration in minutes (20 hours) for sanity checking */
const MAX_WORK_MINUTES = 20 * 60;

/**
 * Compute day classification based on total work duration and settings thresholds.
 * @param {number} totalWorkMinutes - Net work minutes
 * @param {object} settings - Attendance settings with minimumWorkHours, overtimeThresholdHours
 * @returns {string} 'full-day' | 'half-day' | 'overtime' | 'insufficient'
 */
const computeDayClassification = (totalWorkMinutes, settings) => {
  const totalHours = totalWorkMinutes / 60;
  const minHours = settings.minimumWorkHours || 6;
  const otHours = settings.overtimeThresholdHours || 8;

  if (totalHours >= otHours) return 'overtime';
  if (totalHours >= minHours) return 'full-day';
  if (totalHours >= minHours / 2) return 'half-day';
  return 'insufficient';
};

/**
 * Apply sanity bound to totalWorkDuration and log implausible values.
 * @param {object} session - The session document
 */
const applySanityBound = (session) => {
  if (session.totalWorkDuration > MAX_WORK_MINUTES) {
    logger.warn(
      `Implausible totalWorkDuration=${session.totalWorkDuration}min (>${MAX_WORK_MINUTES}min) for user=${session.user} date=${session.date}. Clamping to ${MAX_WORK_MINUTES}min.`
    );
    session.totalWorkDuration = MAX_WORK_MINUTES;
  }
};

/**
 * Auto-checkout any active student session for today if the time is past the auto-checkout hour.
 */
const autoCheckoutActiveSessions = async () => {
  try {
    const today = getTodayIST();
    const settings = await AttendanceSettings.getSettings();
    const currentHour = getISTHour();

    if (currentHour >= settings.autoCheckoutHour) {
      const activeSessions = await AttendanceSession.find({
        date: today,
        attendanceStatus: { $in: ['checked-in', 'on-break'] },
      });

      for (const session of activeSessions) {
        // Close open breaks
        for (const brk of session.breaks) {
          if (!brk.breakEnd) {
            brk.breakEnd = session.checkInTime;
            brk.duration = 0;
          }
        }

        const sessionDate = new Date(session.checkInTime);
        const autoCheckout = new Date(sessionDate);
        autoCheckout.setHours(settings.autoCheckoutHour, 0, 0, 0);

        const checkOutTime =
          autoCheckout > session.checkInTime ? autoCheckout : session.checkInTime;

        const totalBreakDuration = session.breaks.reduce(
          (sum, b) => sum + (b.duration || 0),
          0
        );
        const grossMs = checkOutTime - session.checkInTime;
        const grossMinutes = Math.max(0, Math.round(grossMs / 60000));

        session.checkOutTime = checkOutTime;
        session.grossDuration = grossMinutes;
        session.totalBreakDuration = totalBreakDuration;
        session.totalWorkDuration = Math.max(0, grossMinutes - totalBreakDuration);
        session.attendanceStatus = 'missed-checkout';
        session.missedCheckout = true;

        // Apply sanity bound
        applySanityBound(session);

        // Compute day classification with snapshot
        session.dayClassification = computeDayClassification(session.totalWorkDuration, settings);
        session.classificationThresholds = {
          minimumWorkHours: settings.minimumWorkHours,
          overtimeThresholdHours: settings.overtimeThresholdHours,
        };

        // Check break limit
        if (totalBreakDuration > (settings.maxBreakMinutes || 60)) {
          session.exceededBreakLimit = true;
        }

        await session.save();
        logger.info(`Auto-checkout active session past EOD for user=${session.user} date=${today}`);
      }
    }
  } catch (err) {
    logger.error('Error in autoCheckoutActiveSessions:', err);
  }
};

/**
 * Handle missed checkouts passively — if user has an open session from a previous day,
 * mark it as missed-checkout before allowing new actions.
 * @param {string} userId
 */
const handleMissedCheckouts = async (userId) => {
  const today = getTodayIST();
  const openSessions = await AttendanceSession.find({
    user: userId,
    date: { $ne: today },
    attendanceStatus: { $in: ['checked-in', 'on-break'] },
  });

  if (openSessions.length === 0) return;

  const settings = await AttendanceSettings.getSettings();

  for (const session of openSessions) {
    // Close any open breaks
    for (const brk of session.breaks) {
      if (!brk.breakEnd) {
        brk.breakEnd = session.checkInTime;
        brk.duration = 0;
      }
    }

    const sessionDate = new Date(session.checkInTime);
    const autoCheckout = new Date(sessionDate);
    autoCheckout.setHours(settings.autoCheckoutHour, 0, 0, 0);

    const checkOutTime =
      autoCheckout > session.checkInTime ? autoCheckout : session.checkInTime;

    const totalBreakDuration = session.breaks.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    );
    const grossMs = checkOutTime - session.checkInTime;
    const grossMinutes = Math.max(0, Math.round(grossMs / 60000));

    session.checkOutTime = checkOutTime;
    session.grossDuration = grossMinutes;
    session.totalBreakDuration = totalBreakDuration;
    session.totalWorkDuration = Math.max(0, grossMinutes - totalBreakDuration);
    session.attendanceStatus = 'missed-checkout';
    session.missedCheckout = true;

    // Apply sanity bound
    applySanityBound(session);

    // Compute day classification with snapshot
    session.dayClassification = computeDayClassification(session.totalWorkDuration, settings);
    session.classificationThresholds = {
      minimumWorkHours: settings.minimumWorkHours,
      overtimeThresholdHours: settings.overtimeThresholdHours,
    };

    // Check break limit
    if (totalBreakDuration > (settings.maxBreakMinutes || 60)) {
      session.exceededBreakLimit = true;
    }

    await session.save();
  }
};

// ═══════════════════════════════════════════════
//  STUDENT ACTIONS
// ═══════════════════════════════════════════════

/**
 * @desc    Student checks in for the day
 * @route   POST /api/attendance/check-in
 * @access  Student
 */
const checkIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enrollmentInstanceId, remarks } = req.body;
    const today = getTodayIST();

    if (!enrollmentInstanceId) {
      return next(ApiError.badRequest('Enrollment Instance ID is required to mark attendance.'));
    }

    // Handle any missed checkouts from previous days
    await handleMissedCheckouts(userId);

    // Prevent duplicate check-in for today for this specific enrollment
    const existing = await AttendanceSession.findOne({
      enrollmentInstance: enrollmentInstanceId,
      date: today,
    });
    if (existing) {
      return next(
        ApiError.conflict(
          'You have already checked in today for this internship.'
        )
      );
    }

    // Detect late arrival
    const settings = await AttendanceSettings.getSettings();
    const istNow = getISTNow();

    if (istNow.getUTCHours() >= settings.autoCheckoutHour) {
      return next(
        ApiError.badRequest(
          `Check-in is closed for today. Check-in is not allowed after the auto-checkout hour of ${settings.autoCheckoutHour}:00.`
        )
      );
    }

    const currentMinutes = getISTMinutesSinceMidnight();
    const expectedMinutes = parseTimeToMinutes(settings.expectedCheckInTime);
    const lateThreshold = expectedMinutes + settings.lateGraceMinutes;

    const isLate = currentMinutes > lateThreshold;
    const lateByMinutes = isLate ? currentMinutes - expectedMinutes : 0;

    // Get user's guide and team
    const user = await User.findById(userId)
      .select('assignedGuide')
      .lean();
    let teamId = null;
    if (user) {
      const group = await InternGroup.findOne({
        members: userId,
        isActive: true,
      })
        .select('_id')
        .lean();
      if (group) teamId = group._id;
    }

    const now = new Date();
    const session = await AttendanceSession.create({
      enrollmentInstance: enrollmentInstanceId,
      user: userId,
      guide: user?.assignedGuide || null,
      team: teamId,
      date: today,
      checkInTime: now,
      attendanceStatus: 'checked-in',
      isLate,
      lateByMinutes,
      ipAddress: (
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        ''
      )
        .toString()
        .split(',')[0]
        .trim()
        .substring(0, 100),
      deviceInfo: (req.headers['user-agent'] || '').substring(0, 300),
      remarks: remarks || '',
    });

    logger.info(
      `Attendance check-in: user=${userId} date=${today} late=${isLate}`
    );

    ApiResponse.success(res, 201, 'Checked in successfully.', { session });
  } catch (error) {
    // Handle unique index violation (race condition)
    if (error.code === 11000) {
      return next(
        ApiError.conflict('Duplicate check-in detected. You already have a session today.')
      );
    }
    next(error);
  }
};

/**
 * @desc    Student starts a break
 * @route   POST /api/attendance/break-start
 * @access  Student
 */
const breakStart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enrollmentInstanceId } = req.body;
    const today = getTodayIST();

    if (!enrollmentInstanceId) {
      return next(ApiError.badRequest('Enrollment Instance ID is required.'));
    }

    const session = await AttendanceSession.findOne({
      enrollmentInstance: enrollmentInstanceId,
      date: today,
    });

    if (!session) {
      return next(
        ApiError.badRequest('You must check in before starting a break.')
      );
    }

    if (session.attendanceStatus === 'checked-out') {
      return next(
        ApiError.badRequest('You have already checked out. Cannot start a break.')
      );
    }

    if (session.attendanceStatus === 'on-break') {
      return next(
        ApiError.badRequest(
          'You already have an active break. Please end it before starting a new one.'
        )
      );
    }

    // Verify no open break exists (defensive check)
    const hasOpenBreak = session.breaks.some((b) => !b.breakEnd);
    if (hasOpenBreak) {
      return next(
        ApiError.badRequest(
          'An active break already exists. End it before starting a new one.'
        )
      );
    }

    // Enforce maxBreakMinutes — block new breaks if already exceeded
    const settings = await AttendanceSettings.getSettings();
    if (session.totalBreakDuration >= (settings.maxBreakMinutes || 60)) {
      session.exceededBreakLimit = true;
      await session.save();
      return next(
        ApiError.badRequest(
          `You have exceeded the maximum allowed break time of ${settings.maxBreakMinutes} minutes for today. No further breaks allowed.`
        )
      );
    }

    session.breaks.push({ breakStart: new Date() });
    session.attendanceStatus = 'on-break';
    await session.save();

    logger.info(`Break started: user=${userId} date=${today}`);

    ApiResponse.success(res, 200, 'Break started.', { session });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student ends the current break
 * @route   POST /api/attendance/break-end
 * @access  Student
 */
const breakEnd = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enrollmentInstanceId } = req.body;
    const today = getTodayIST();

    if (!enrollmentInstanceId) {
      return next(ApiError.badRequest('Enrollment Instance ID is required.'));
    }

    const session = await AttendanceSession.findOne({
      enrollmentInstance: enrollmentInstanceId,
      date: today,
    });

    if (!session) {
      return next(ApiError.badRequest('No active session found for today.'));
    }

    if (session.attendanceStatus !== 'on-break') {
      return next(
        ApiError.badRequest('You are not currently on a break.')
      );
    }

    // Find the open break
    const openBreak = session.breaks.find((b) => !b.breakEnd);
    if (!openBreak) {
      return next(ApiError.badRequest('No active break found to end.'));
    }

    const now = new Date();
    openBreak.breakEnd = now;
    openBreak.duration = Math.round(
      (now - new Date(openBreak.breakStart)) / 60000
    );

    // Recalculate total break duration
    session.totalBreakDuration = session.breaks.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    );

    // Enforce maxBreakMinutes — flag if exceeded
    const settings = await AttendanceSettings.getSettings();
    if (session.totalBreakDuration > (settings.maxBreakMinutes || 60)) {
      session.exceededBreakLimit = true;
      session.remarks = session.remarks
        ? `${session.remarks} | Break limit exceeded (${session.totalBreakDuration}/${settings.maxBreakMinutes} min)`
        : `Break limit exceeded (${session.totalBreakDuration}/${settings.maxBreakMinutes} min)`;
      logger.warn(
        `Break limit exceeded: user=${userId} date=${today} total=${session.totalBreakDuration}min limit=${settings.maxBreakMinutes}min`
      );
    }

    session.attendanceStatus = 'checked-in';
    await session.save();

    logger.info(
      `Break ended: user=${userId} date=${today} breakDuration=${openBreak.duration}min`
    );

    ApiResponse.success(res, 200, 'Break ended.', { session });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student checks out for the day
 * @route   POST /api/attendance/check-out
 * @access  Student
 */
const checkOut = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enrollmentInstanceId, remarks } = req.body;
    const today = getTodayIST();

    if (!enrollmentInstanceId) {
      return next(ApiError.badRequest('Enrollment Instance ID is required.'));
    }

    const session = await AttendanceSession.findOne({
      enrollmentInstance: enrollmentInstanceId,
      date: today,
    });

    if (!session) {
      return next(
        ApiError.badRequest('You must check in before checking out.')
      );
    }

    if (session.attendanceStatus === 'checked-out') {
      return next(
        ApiError.badRequest('You have already checked out for today.')
      );
    }

    const now = new Date();

    // Auto-close any open break
    const openBreak = session.breaks.find((b) => !b.breakEnd);
    if (openBreak) {
      openBreak.breakEnd = now;
      openBreak.duration = Math.round(
        (now - new Date(openBreak.breakStart)) / 60000
      );
    }

    // Recalculate all durations
    session.totalBreakDuration = session.breaks.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    );

    const grossMs = now - new Date(session.checkInTime);
    session.grossDuration = Math.max(0, Math.round(grossMs / 60000));
    session.totalWorkDuration = Math.max(
      0,
      session.grossDuration - session.totalBreakDuration
    );

    // Apply sanity bound
    applySanityBound(session);

    session.checkOutTime = now;
    session.attendanceStatus = 'checked-out';
    session.remarks = req.body.remarks || session.remarks;

    // Compute day classification with snapshot
    const settings = await AttendanceSettings.getSettings();
    session.dayClassification = computeDayClassification(session.totalWorkDuration, settings);
    session.classificationThresholds = {
      minimumWorkHours: settings.minimumWorkHours,
      overtimeThresholdHours: settings.overtimeThresholdHours,
    };

    // Check break limit at checkout too
    if (session.totalBreakDuration > (settings.maxBreakMinutes || 60)) {
      session.exceededBreakLimit = true;
    }

    await session.save();

    logger.info(
      `Checkout: user=${userId} date=${today} worked=${session.totalWorkDuration}min breaks=${session.totalBreakDuration}min classification=${session.dayClassification}`
    );

    ApiResponse.success(res, 200, 'Checked out successfully.', { session });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current day's attendance state (for session persistence after refresh)
 * @route   GET /api/attendance/my-status
 * @access  Student
 */
const getMyStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enrollmentInstanceId } = req.query;
    const today = getTodayIST();

    if (!enrollmentInstanceId) {
      return next(ApiError.badRequest('Enrollment Instance ID is required.'));
    }

    // Handle missed checkouts passively (scoped to this user only — no global scan)
    await handleMissedCheckouts(userId);

    const session = await AttendanceSession.findOne({
      enrollmentInstance: enrollmentInstanceId,
      date: today,
    }).lean();

    // Compute live work duration for sessions still in progress
    let liveWorkMinutes = 0;
    if (session && session.attendanceStatus !== 'checked-out' && session.attendanceStatus !== 'missed-checkout') {
      const now = new Date();
      const grossMs = now - new Date(session.checkInTime);
      const grossMinutes = Math.max(0, Math.round(grossMs / 60000));

      // Calculate current break time (including any open break)
      let currentBreakTotal = session.breaks.reduce(
        (sum, b) => sum + (b.duration || 0),
        0
      );
      const openBreak = session.breaks.find((b) => !b.breakEnd);
      if (openBreak) {
        currentBreakTotal += Math.round(
          (now - new Date(openBreak.breakStart)) / 60000
        );
      }

      liveWorkMinutes = Math.max(0, grossMinutes - currentBreakTotal);
    }

    const settings = await AttendanceSettings.getSettings();

    ApiResponse.success(res, 200, 'Current attendance status fetched.', {
      session: session || null,
      liveWorkMinutes,
      today,
      autoCheckoutHour: settings.autoCheckoutHour,
      expectedCheckInTime: settings.expectedCheckInTime,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's own attendance history
 * @route   GET /api/attendance/my-history
 * @access  Student
 */
const getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      startDate,
      endDate,
      sort = '-date',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = { user: userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const [total, records] = await Promise.all([
      AttendanceSession.countDocuments(filter),
      AttendanceSession.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    ApiResponse.success(
      res,
      200,
      'Attendance history fetched.',
      records,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's personal attendance statistics
 * @route   GET /api/attendance/my-stats
 * @access  Student
 */
const getMyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const allSessions = await AttendanceSession.find({ user: userId })
      .sort('-date')
      .lean();

    const totalDays = allSessions.length;
    const checkedOutDays = allSessions.filter(
      (s) => s.attendanceStatus === 'checked-out'
    ).length;
    const lateDays = allSessions.filter((s) => s.isLate).length;
    const missedCheckouts = allSessions.filter(
      (s) => s.missedCheckout
    ).length;

    const totalWorkMinutes = allSessions.reduce(
      (sum, s) => sum + (s.totalWorkDuration || 0),
      0
    );
    const avgWorkMinutes =
      checkedOutDays > 0 ? Math.round(totalWorkMinutes / checkedOutDays) : 0;

    // Attendance streak (consecutive days present)
    let streak = 0;
    const today = getTodayIST();
    const sortedDates = allSessions.map((s) => s.date).sort().reverse();
    if (sortedDates.length > 0) {
      let checkDate = today;
      for (const d of sortedDates) {
        if (d === checkDate) {
          streak++;
          // Previous day
          const prev = new Date(checkDate + 'T00:00:00Z');
          prev.setDate(prev.getDate() - 1);
          checkDate = prev.toISOString().split('T')[0];
        } else if (d < checkDate) {
          break;
        }
      }
    }

    // This month stats
    const thisMonth = today.substring(0, 7); // YYYY-MM
    const thisMonthSessions = allSessions.filter((s) =>
      s.date.startsWith(thisMonth)
    );
    const thisMonthPresent = thisMonthSessions.length;
    const thisMonthLate = thisMonthSessions.filter((s) => s.isLate).length;

    ApiResponse.success(res, 200, 'Attendance stats fetched.', {
      totalDays,
      checkedOutDays,
      lateDays,
      missedCheckouts,
      totalWorkMinutes,
      avgWorkMinutes,
      streak,
      thisMonth: {
        present: thisMonthPresent,
        late: thisMonthLate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
//  GUIDE ACTIONS
// ═══════════════════════════════════════════════

/**
 * @desc    Get attendance records for guide's assigned students
 * @route   GET /api/attendance/guide/students
 * @access  Guide
 */
const getGuideStudentAttendance = async (req, res, next) => {
  try {
    // Removed global autoCheckoutActiveSessions() — cron handles this now
    const guideId = req.user.id;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      userId,
      teamId,
      status,
      startDate,
      endDate,
      search,
      sort = '-date',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    // Get assigned student IDs
    const guide = await User.findById(guideId)
      .select('assignedStudents')
      .lean();
    const studentIds = guide?.assignedStudents || [];

    if (studentIds.length === 0) {
      return ApiResponse.success(
        res,
        200,
        'No assigned students.',
        [],
        ApiResponse.paginate(pageNum, limitNum, 0)
      );
    }

    const filter = { user: { $in: studentIds } };

    if (userId && studentIds.some((id) => id.toString() === userId)) {
      filter.user = userId;
    }
    if (teamId) filter.team = teamId;
    if (status) filter.attendanceStatus = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const [total, records] = await Promise.all([
      AttendanceSession.countDocuments(filter),
      AttendanceSession.find(filter)
        .populate('user', 'name email avatar')
        .populate('team', 'name')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    ApiResponse.success(
      res,
      200,
      'Guide student attendance fetched.',
      records,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated analytics for guide's assigned students
 * @route   GET /api/attendance/guide/analytics
 * @access  Guide
 */
const getGuideAnalytics = async (req, res, next) => {
  try {
    // Removed global autoCheckoutActiveSessions() — cron handles this now
    const guideId = req.user.id;
    const today = getTodayIST();

    const guide = await User.findById(guideId)
      .select('assignedStudents')
      .lean();
    const studentIds = guide?.assignedStudents || [];

    if (studentIds.length === 0) {
      return ApiResponse.success(res, 200, 'No assigned students.', {
        totalStudents: 0,
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
        todayOnBreak: 0,
        weeklyData: [],
      });
    }

    // Today's stats
    const todaySessions = await AttendanceSession.find({
      user: { $in: studentIds },
      date: today,
    }).lean();

    const todayPresent = todaySessions.length;
    const todayAbsent = studentIds.length - todayPresent;
    const todayLate = todaySessions.filter((s) => s.isLate).length;
    const todayOnBreak = todaySessions.filter(
      (s) => s.attendanceStatus === 'on-break'
    ).length;

    // Weekly data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const count = await AttendanceSession.countDocuments({
        user: { $in: studentIds },
        date: dateStr,
      });

      weeklyData.push({ date: dateStr, day: dayName, present: count });
    }

    ApiResponse.success(res, 200, 'Guide analytics fetched.', {
      totalStudents: studentIds.length,
      todayPresent,
      todayAbsent,
      todayLate,
      todayOnBreak,
      weeklyData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export assigned students' attendance to Excel
 * @route   GET /api/attendance/guide/export
 * @access  Guide
 */
const exportGuideAttendance = async (req, res, next) => {
  try {
    const guideId = req.user.id;
    const { startDate, endDate, userId, teamId, status } = req.query;

    const guide = await User.findById(guideId)
      .select('assignedStudents')
      .lean();
    const studentIds = guide?.assignedStudents || [];

    const filter = { user: { $in: studentIds } };
    if (userId && studentIds.some((id) => id.toString() === userId)) {
      filter.user = userId;
    }
    if (teamId) filter.team = teamId;
    if (status) filter.attendanceStatus = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await AttendanceSession.find(filter)
      .populate('user', 'name email')
      .populate('guide', 'name')
      .populate('team', 'name')
      .sort('-date')
      .lean();

    // Detect month scope for optional monthly summary worksheet
    const monthScope = (startDate && endDate && startDate.substring(0, 7) === endDate.substring(0, 7))
      ? startDate.substring(0, 7) : null;

    const buffer = await generateAttendanceExcel(records, monthScope);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_report_${getTodayIST()}.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
//  ADMIN ACTIONS
// ═══════════════════════════════════════════════

/**
 * @desc    Get all attendance records with full filters
 * @route   GET /api/attendance/admin/all
 * @access  Admin
 */
const getAdminAllAttendance = async (req, res, next) => {
  try {
    // Removed global autoCheckoutActiveSessions() — cron handles this now
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      userId,
      guideId,
      teamId,
      status,
      startDate,
      endDate,
      search,
      sort = '-date',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const filter = {};
    if (userId) filter.user = userId;
    if (guideId) filter.guide = guideId;
    if (teamId) filter.team = teamId;
    if (status) filter.attendanceStatus = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    // If search is provided, first find matching user IDs
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();

      const userIds = matchingUsers.map((u) => u._id);
      if (filter.user) {
        // Intersect with existing user filter
        filter.user = { $in: [filter.user].flat().filter((id) => userIds.some((uid) => uid.toString() === id.toString())) };
      } else {
        filter.user = { $in: userIds };
      }
    }

    const [total, records] = await Promise.all([
      AttendanceSession.countDocuments(filter),
      AttendanceSession.find(filter)
        .populate('user', 'name email avatar')
        .populate('guide', 'name email')
        .populate('team', 'name')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    ApiResponse.success(
      res,
      200,
      'All attendance records fetched.',
      records,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get global attendance analytics for admin dashboard
 * @route   GET /api/attendance/admin/analytics
 * @access  Admin
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    // Removed global autoCheckoutActiveSessions() — cron handles this now
    const today = getTodayIST();

    // Count all students
    const totalStudents = await User.countDocuments({
      role: 'student',
      isActive: true,
    });

    // Today's sessions
    const todaySessions = await AttendanceSession.find({ date: today }).lean();

    const todayPresent = todaySessions.filter(s => s.attendanceStatus !== 'missed-checkout').length;
    const todayAbsent = Math.max(0, totalStudents - todaySessions.length);
    const todayUnchecked = todaySessions.filter(s => s.attendanceStatus === 'missed-checkout').length;
    const todayLate = todaySessions.filter((s) => s.isLate).length;
    const todayOnBreak = todaySessions.filter(
      (s) => s.attendanceStatus === 'on-break'
    ).length;
    const todayCheckedOut = todaySessions.filter(
      (s) => s.attendanceStatus === 'checked-out'
    ).length;

    // Weekly trend (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const count = await AttendanceSession.countDocuments({ date: dateStr });
      const lateCount = await AttendanceSession.countDocuments({
        date: dateStr,
        isLate: true,
      });

      weeklyData.push({
        date: dateStr,
        day: dayName,
        present: count,
        late: lateCount,
        absent: totalStudents - count,
      });
    }

    // Monthly summary
    const thisMonth = today.substring(0, 7);
    const monthSessions = await AttendanceSession.find({
      date: { $regex: `^${thisMonth}` },
    }).lean();

    const monthTotalSessions = monthSessions.length;
    const monthAvgWorkMinutes =
      monthTotalSessions > 0
        ? Math.round(
            monthSessions.reduce(
              (sum, s) => sum + (s.totalWorkDuration || 0),
              0
            ) / monthTotalSessions
          )
        : 0;

    ApiResponse.success(res, 200, 'Admin analytics fetched.', {
      totalStudents,
      todayPresent,
      todayAbsent,
      todayUnchecked,
      todayLate,
      todayOnBreak,
      todayCheckedOut,
      weeklyData,
      monthSummary: {
        totalSessions: monthTotalSessions,
        avgWorkMinutes: monthAvgWorkMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export all attendance to Excel
 * @route   GET /api/attendance/admin/export
 * @access  Admin
 */
const exportAdminAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, userId, guideId, teamId, status } = req.query;

    const filter = {};
    if (userId) filter.user = userId;
    if (guideId) filter.guide = guideId;
    if (teamId) filter.team = teamId;
    if (status) filter.attendanceStatus = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await AttendanceSession.find(filter)
      .populate('user', 'name email')
      .populate('guide', 'name')
      .populate('team', 'name')
      .sort('-date')
      .lean();

    // Detect month scope for optional monthly summary worksheet
    const monthScope = (startDate && endDate && startDate.substring(0, 7) === endDate.substring(0, 7))
      ? startDate.substring(0, 7) : null;

    const buffer = await generateAttendanceExcel(records, monthScope);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_full_report_${getTodayIST()}.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance settings
 * @route   GET /api/attendance/admin/settings
 * @access  Admin
 */
const getAttendanceSettings = async (req, res, next) => {
  try {
    const settings = await AttendanceSettings.getSettings();
    ApiResponse.success(res, 200, 'Attendance settings fetched.', { settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update attendance settings
 * @route   PUT /api/attendance/admin/settings
 * @access  Admin
 */
const updateAttendanceSettings = async (req, res, next) => {
  try {
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = new AttendanceSettings();
    }

    const allowedFields = [
      'expectedCheckInTime',
      'lateGraceMinutes',
      'maxBreakMinutes',
      'autoCheckoutHour',
      'workingDaysPerWeek',
      'minimumWorkHours',
      'overtimeThresholdHours',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    logger.info(`Attendance settings updated by admin=${req.user.id}`);

    ApiResponse.success(res, 200, 'Attendance settings updated.', {
      settings: settings.toObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live status of all interns (present, on-break, absent)
 * @route   GET /api/attendance/admin/live-status
 * @access  Admin
 */
const getLiveStatus = async (req, res, next) => {
  try {
    // Removed global autoCheckoutActiveSessions() — cron handles this now
    const today = getTodayIST();

    // Get all active students
    const students = await User.find({ role: 'student', isActive: true })
      .select('name email avatar assignedGuide')
      .lean();

    // Get today's sessions
    const sessions = await AttendanceSession.find({ date: today })
      .populate('team', 'name')
      .lean();

    const sessionMap = new Map();
    sessions.forEach((s) => sessionMap.set(s.user.toString(), s));

    const liveStatuses = students.map((student) => {
      const session = sessionMap.get(student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        status: session ? session.attendanceStatus : 'absent',
        checkInTime: session?.checkInTime || null,
        team: session?.team || null,
        isLate: session?.isLate || false,
      };
    });

    ApiResponse.success(res, 200, 'Live attendance status fetched.', {
      statuses: liveStatuses,
      summary: {
        total: students.length,
        present: sessions.filter(
          (s) => s.attendanceStatus === 'checked-in'
        ).length,
        onBreak: sessions.filter(
          (s) => s.attendanceStatus === 'on-break'
        ).length,
        checkedOut: sessions.filter(
          (s) => s.attendanceStatus === 'checked-out'
        ).length,
        unchecked: sessions.filter(
          (s) => s.attendanceStatus === 'missed-checkout'
        ).length,
        absent: Math.max(0, students.length - sessions.length),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════
//  MONTHLY HOURS ENDPOINTS (Phase 2)
// ═══════════════════════════════════════════════

/**
 * Build the MongoDB aggregation pipeline for monthly hours.
 * @param {object} matchFilter - Base $match filter
 * @param {string} month - YYYY-MM string
 * @param {number} skip - Pagination skip
 * @param {number} limit - Pagination limit
 * @returns {Array} Aggregation pipeline stages
 */
const buildMonthlyHoursPipeline = (matchFilter, month, skip, limit) => {
  // Compute date range for the month
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endYear = mon === 12 ? year + 1 : year;
  const endMonth = mon === 12 ? 1 : mon + 1;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  return [
    {
      $match: {
        ...matchFilter,
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: '$user',
        totalWorkMinutes: { $sum: '$totalWorkDuration' },
        totalBreakMinutes: { $sum: '$totalBreakDuration' },
        presentDays: { $sum: 1 },
        lateDays: { $sum: { $cond: ['$isLate', 1, 0] } },
        missedCheckoutDays: { $sum: { $cond: ['$missedCheckout', 1, 0] } },
        fullDays: { $sum: { $cond: [{ $eq: ['$dayClassification', 'full-day'] }, 1, 0] } },
        halfDays: { $sum: { $cond: [{ $eq: ['$dayClassification', 'half-day'] }, 1, 0] } },
        overtimeDays: { $sum: { $cond: [{ $eq: ['$dayClassification', 'overtime'] }, 1, 0] } },
        insufficientDays: { $sum: { $cond: [{ $eq: ['$dayClassification', 'insufficient'] }, 1, 0] } },
        exceededBreakDays: { $sum: { $cond: ['$exceededBreakLimit', 1, 0] } },
      },
    },
    { $sort: { totalWorkMinutes: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo',
              pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
            },
          },
          { $unwind: '$userInfo' },
          {
            $project: {
              _id: 1,
              user: '$userInfo',
              totalWorkMinutes: 1,
              totalWorkHours: { $round: [{ $divide: ['$totalWorkMinutes', 60] }, 2] },
              totalBreakMinutes: 1,
              presentDays: 1,
              lateDays: 1,
              missedCheckoutDays: 1,
              classification: {
                fullDays: '$fullDays',
                halfDays: '$halfDays',
                overtimeDays: '$overtimeDays',
                insufficientDays: '$insufficientDays',
              },
              exceededBreakDays: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];
};

/**
 * @desc    Get monthly hours for all interns (admin)
 * @route   GET /api/attendance/admin/monthly-hours
 * @access  Admin
 */
const getAdminMonthlyHours = async (req, res, next) => {
  try {
    const {
      month,
      userId,
      teamId,
      guideId,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    const currentMonth = month || getTodayIST().substring(0, 7);
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    const matchFilter = {};
    if (userId) matchFilter.user = require('mongoose').Types.ObjectId.createFromHexString(userId);
    if (teamId) matchFilter.team = require('mongoose').Types.ObjectId.createFromHexString(teamId);
    if (guideId) matchFilter.guide = require('mongoose').Types.ObjectId.createFromHexString(guideId);

    const pipeline = buildMonthlyHoursPipeline(matchFilter, currentMonth, (pageNum - 1) * limitNum, limitNum);
    const [result] = await AttendanceSession.aggregate(pipeline);

    const data = result.data || [];
    const total = result.totalCount[0]?.count || 0;

    ApiResponse.success(res, 200, 'Admin monthly hours fetched.', {
      month: currentMonth,
      interns: data,
    }, ApiResponse.paginate(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly hours for guide's assigned students
 * @route   GET /api/attendance/guide/monthly-hours
 * @access  Guide
 */
const getGuideMonthlyHours = async (req, res, next) => {
  try {
    const guideId = req.user.id;
    const {
      month,
      userId,
      teamId,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    const currentMonth = month || getTodayIST().substring(0, 7);
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    // Get assigned student IDs
    const guide = await User.findById(guideId).select('assignedStudents').lean();
    const studentIds = guide?.assignedStudents || [];

    if (studentIds.length === 0) {
      return ApiResponse.success(res, 200, 'No assigned students.', {
        month: currentMonth,
        interns: [],
      }, ApiResponse.paginate(pageNum, limitNum, 0));
    }

    const matchFilter = { user: { $in: studentIds } };
    if (userId && studentIds.some((id) => id.toString() === userId)) {
      matchFilter.user = require('mongoose').Types.ObjectId.createFromHexString(userId);
    }
    if (teamId) matchFilter.team = require('mongoose').Types.ObjectId.createFromHexString(teamId);

    const pipeline = buildMonthlyHoursPipeline(matchFilter, currentMonth, (pageNum - 1) * limitNum, limitNum);
    const [result] = await AttendanceSession.aggregate(pipeline);

    const data = result.data || [];
    const total = result.totalCount[0]?.count || 0;

    ApiResponse.success(res, 200, 'Guide monthly hours fetched.', {
      month: currentMonth,
      interns: data,
    }, ApiResponse.paginate(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's own monthly hours
 * @route   GET /api/attendance/my-monthly-hours
 * @access  Student
 */
const getMyMonthlyHours = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    const currentMonth = month || getTodayIST().substring(0, 7);

    const matchFilter = { user: require('mongoose').Types.ObjectId.createFromHexString(userId) };
    const pipeline = buildMonthlyHoursPipeline(matchFilter, currentMonth, 0, 1);
    const [result] = await AttendanceSession.aggregate(pipeline);

    const data = result.data[0] || null;

    ApiResponse.success(res, 200, 'Monthly hours fetched.', {
      month: currentMonth,
      summary: data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  breakStart,
  breakEnd,
  checkOut,
  getMyStatus,
  getMyHistory,
  getMyStats,
  getGuideStudentAttendance,
  getGuideAnalytics,
  exportGuideAttendance,
  getAdminAllAttendance,
  getAdminAnalytics,
  exportAdminAttendance,
  getAttendanceSettings,
  updateAttendanceSettings,
  getLiveStatus,
  autoCheckoutActiveSessions,
  getAdminMonthlyHours,
  getGuideMonthlyHours,
  getMyMonthlyHours,
};

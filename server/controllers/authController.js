const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const emailService = require('../services/emailService');

/**
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, college, department, yearOfStudy } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email already exists.'));
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      college,
      department,
      yearOfStudy,
      role: 'student',
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email (non-blocking)
    emailService.sendEmailVerification(user, verificationToken).catch(() => {});

    const token = user.getSignedJwtToken();

    ApiResponse.success(res, 201, 'Registration successful. Please verify your email.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    // Check account lockout
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(
        ApiError.tooMany(
          `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`
        )
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    // Successful login — reset lockout counters
    await user.resetLoginAttempts();

    const token = user.getSignedJwtToken();

    ApiResponse.success(res, 200, 'Login successful.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
        college: user.college,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        skills: user.skills,
        avatar: user.avatar,
        resumeUrl: user.resumeUrl,
        bio: user.bio,
        expertise: user.expertise,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin login
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return next(ApiError.unauthorized('Invalid admin credentials.'));
    }

    // Check account lockout
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(
        ApiError.tooMany(
          `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`
        )
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return next(ApiError.unauthorized('Invalid admin credentials.'));
    }

    // Successful login — reset lockout counters
    await user.resetLoginAttempts();

    const token = user.getSignedJwtToken();

    ApiResponse.success(res, 200, 'Admin login successful.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Guide login
 * @route   POST /api/auth/guide/login
 * @access  Public
 */
const guideLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'guide' }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return next(ApiError.unauthorized('Invalid guide credentials.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your guide account has been deactivated. Contact the administrator.'));
    }

    // Check account lockout
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(
        ApiError.tooMany(
          `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`
        )
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return next(ApiError.unauthorized('Invalid guide credentials.'));
    }

    // Successful login — reset lockout counters
    await user.resetLoginAttempts();

    const token = user.getSignedJwtToken();

    ApiResponse.success(res, 200, 'Guide login successful.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        expertise: user.expertise,
        bio: user.bio,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(ApiError.badRequest('Invalid or expired verification token.'));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking)
    emailService.sendRegistration(user).catch(() => {});

    ApiResponse.success(res, 200, 'Email verified successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password — send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Don't reveal if email exists — still return success
      return ApiResponse.success(res, 200, 'If that email exists, a reset link has been sent.');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email (non-blocking)
    emailService.sendPasswordReset(user, resetToken).catch(async () => {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    });

    ApiResponse.success(res, 200, 'If that email exists, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(ApiError.badRequest('Invalid or expired reset token.'));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    ApiResponse.success(res, 200, 'Password reset successful.', { token });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      college: user.college,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
      skills: user.skills,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      resumeUrl: user.resumeUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    // Include guide-specific fields
    if (user.role === 'guide') {
      userData.expertise = user.expertise;
      userData.bio = user.bio;
      userData.assignedStudents = user.assignedStudents;
    }

    // Include student-specific guide assignment
    if (user.role === 'student') {
      userData.assignedGuide = user.assignedGuide;
    }

    ApiResponse.success(res, 200, 'User fetched successfully.', {
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (invalidates token on all devices)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.tokenVersion += 1;
      await user.save();
    }
    ApiResponse.success(res, 200, 'Logged out successfully from all devices.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  guideLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};

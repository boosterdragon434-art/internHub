const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Protect routes — verifies JWT token and attaches user to request.
 */
const protect = async (req, _res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Not authorized. No token provided.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User no longer exists.'));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(ApiError.unauthorized('Session expired or invalidated. Please log in again.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Not authorized. Invalid token.'));
  }
};

/**
 * Authorize by role — restricts access to specified roles.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'student')
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this route.`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };

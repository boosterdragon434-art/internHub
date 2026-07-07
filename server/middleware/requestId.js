const crypto = require('crypto');

/**
 * Middleware to attach a unique request correlation ID to every request.
 * Enables tracing individual requests across log entries in concurrent environments.
 *
 * The ID is also set as the `X-Request-Id` response header for client-side tracing.
 */
const requestId = (req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;

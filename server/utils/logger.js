/**
 * Structured logger utility.
 * Uses console with level prefixes and timestamps.
 * Replace with Winston/Pino in production for file transport.
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Formats a log message with timestamp and level.
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {*} [data] - Optional additional data
 * @returns {string} Formatted log string
 */
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;
  if (data !== undefined) {
    const serialized =
      data instanceof Error
        ? data.stack || data.message
        : typeof data === 'object'
          ? JSON.stringify(data, null, 2)
          : data;
    return `${base}\n${serialized}`;
  }
  return base;
};

const logger = {
  info: (message, data) => {
    console.log(formatMessage(LOG_LEVELS.INFO, message, data));
  },

  warn: (message, data) => {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
  },

  error: (message, data) => {
    console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
  },

  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage(LOG_LEVELS.DEBUG, message, data));
    }
  },
};

module.exports = logger;

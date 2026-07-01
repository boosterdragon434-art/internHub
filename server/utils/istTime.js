/**
 * Centralized IST (Indian Standard Time) utilities.
 * Single source of truth for IST time conversions — replaces
 * the duplicated +5.5h offset logic throughout the codebase.
 *
 * IST = UTC + 5 hours 30 minutes
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get the current Date object shifted to IST.
 * @returns {Date} A Date whose UTC methods return IST wall-clock values.
 */
const getISTNow = () => {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
};

/**
 * Get today's date string in YYYY-MM-DD format (IST).
 * @returns {string} e.g. '2026-07-01'
 */
const getTodayIST = () => {
  return getISTNow().toISOString().split('T')[0];
};

/**
 * Get the current IST time as minutes since midnight.
 * @returns {number} e.g. 570 for 09:30 IST
 */
const getISTMinutesSinceMidnight = () => {
  const ist = getISTNow();
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
};

/**
 * Get the current IST hour (0-23).
 * @returns {number}
 */
const getISTHour = () => {
  return getISTNow().getUTCHours();
};

module.exports = {
  IST_OFFSET_MS,
  getISTNow,
  getTodayIST,
  getISTMinutesSinceMidnight,
  getISTHour,
};

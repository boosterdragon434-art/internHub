/**
 * Escapes special regex characters in a user-supplied string to prevent
 * ReDoS (Regular Expression Denial of Service) attacks when used in MongoDB $regex queries.
 *
 * @param {string} str - The raw user input string
 * @returns {string} Escaped string safe for use in $regex
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = escapeRegex;

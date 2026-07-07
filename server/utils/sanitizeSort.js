/**
 * Validates and sanitizes a sort parameter against a whitelist of allowed sort fields.
 * Prevents MongoDB injection via arbitrary sort strings.
 *
 * @param {string} sort - The user-supplied sort string (e.g., '-createdAt')
 * @param {string[]} allowedFields - List of valid sort options
 * @param {string} [defaultSort='-createdAt'] - Fallback if sort is invalid
 * @returns {string} A safe sort string
 */
const sanitizeSort = (sort, allowedFields, defaultSort = '-createdAt') => {
  if (!sort || typeof sort !== 'string') return defaultSort;
  return allowedFields.includes(sort) ? sort : defaultSort;
};

/** Common sort whitelist for most list endpoints */
const COMMON_SORT_FIELDS = [
  '-createdAt',
  'createdAt',
  '-updatedAt',
  'updatedAt',
  '-name',
  'name',
  '-email',
  'email',
  '-date',
  'date',
  '-status',
  'status',
];

module.exports = { sanitizeSort, COMMON_SORT_FIELDS };

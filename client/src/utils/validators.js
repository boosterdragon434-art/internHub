/**
 * Validates an email address.
 * @param {string} email 
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase().trim());
};

/**
 * Validates an Indian phone number (10 digits).
 * @param {string} phone 
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  const re = /^[6789]\d{9}$/;
  return re.test(String(phone).trim());
};

/**
 * Validates password strength (min 6 chars).
 * @param {string} password 
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

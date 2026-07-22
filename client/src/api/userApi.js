import api from './axios';

export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export const reuploadResume = async (formData) => {
  const response = await api.put('/users/resume', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/users/password', { currentPassword, newPassword });
  return response.data;
};

export const getAllUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get('/users/stats');
  return response.data;
};

// ─── User Management (Admin) ────────────────────────────────────────

/**
 * Lock a user account — blocks login and dashboard access.
 * @param {string} userId
 * @param {string} [reason]
 */
export const lockUser = async (userId, reason = '') => {
  const response = await api.put(`/users/${userId}/lock`, { reason });
  return response.data;
};

/**
 * Unlock a locked user account — restores access.
 * @param {string} userId
 */
export const unlockUser = async (userId) => {
  const response = await api.put(`/users/${userId}/unlock`);
  return response.data;
};

/**
 * Soft-delete a user — hides from queries, preserves data, restorable.
 * @param {string} userId
 * @param {string} [reason]
 */
export const softDeleteUser = async (userId, reason = '') => {
  const response = await api.delete(`/users/${userId}/soft`, { data: { reason } });
  return response.data;
};

/**
 * Restore a soft-deleted user.
 * @param {string} userId
 */
export const restoreUser = async (userId) => {
  const response = await api.put(`/users/${userId}/restore`);
  return response.data;
};

/**
 * Permanently delete a user and all related data (IRREVERSIBLE).
 * Requires confirming the user's email.
 * @param {string} userId
 * @param {string} confirmEmail - Must match the target user's email
 */
export const hardDeleteUser = async (userId, confirmEmail) => {
  const response = await api.delete(`/users/${userId}/permanent`, { data: { confirmEmail } });
  return response.data;
};


import api from './axios';

/**
 * Fetch the current student's enrollment instances.
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getMyEnrollments = async () => {
  const response = await api.get('/applications/my-enrollments');
  return response.data;
};

import api from './axios';

/**
 * Guide API service — endpoints for guide-specific operations.
 */

/** Get guide dashboard statistics */
export const getGuideDashboard = () => api.get('/guides/dashboard');

/** Get assigned students (with pagination & search) */
export const getAssignedStudents = (params = {}) =>
  api.get('/guides/students', { params });

/** Get a specific student's progress */
export const getStudentProgress = (studentId) =>
  api.get(`/guides/students/${studentId}/progress`);

/** Update guide profile */
export const updateGuideProfile = (data) => api.put('/guides/profile', data);

/* ----- Admin Guide Management ----- */

/** Get all guides (admin) */
export const getAllGuides = (params = {}) =>
  api.get('/users/guides', { params });

/** Create a guide account (admin) */
export const createGuide = (data) => api.post('/users/guides', data);

/** Assign a guide to a student (admin) */
export const assignGuide = (data) => api.put('/users/assign-guide', data);

/** Unassign a guide from a student (admin) */
export const unassignGuide = (data) => api.put('/users/unassign-guide', data);

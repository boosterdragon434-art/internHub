import api from './axios';

/**
 * Attendance API service — endpoints for all attendance operations.
 */

// ─── Student Endpoints ──────────────────────────────────────────────

/** Check in for the day */
export const checkIn = (data = {}) => api.post('/attendance/check-in', data);

/** Start a break */
export const breakStart = () => api.post('/attendance/break-start', {});

/** End current break */
export const breakEnd = () => api.post('/attendance/break-end', {});

/** Check out for the day */
export const checkOut = (data = {}) => api.post('/attendance/check-out', data);

/** Get current day's attendance status (for session persistence) */
export const getMyStatus = () => api.get('/attendance/my-status');

/** Get personal attendance history (paginated) */
export const getMyHistory = (params = {}) =>
  api.get('/attendance/my-history', { params });

/** Get personal attendance statistics */
export const getMyStats = () => api.get('/attendance/my-stats');

/** Get student's own monthly hours */
export const getMyMonthlyHours = (params = {}) =>
  api.get('/attendance/my-monthly-hours', { params });

// ─── Guide Endpoints ────────────────────────────────────────────────

/** Get attendance records for assigned students */
export const getGuideAttendance = (params = {}) =>
  api.get('/attendance/guide/students', { params });

/** Get analytics for assigned students */
export const getGuideAnalytics = (params = {}) =>
  api.get('/attendance/guide/analytics', { params });

/** Export assigned students' attendance as Excel */
export const exportGuideAttendance = (params = {}) =>
  api.get('/attendance/guide/export', {
    params,
    responseType: 'blob',
  });

/** Get guide's students monthly hours */
export const getGuideMonthlyHours = (params = {}) =>
  api.get('/attendance/guide/monthly-hours', { params });

// ─── Admin Endpoints ────────────────────────────────────────────────

/** Get all attendance records with filters */
export const getAdminAttendance = (params = {}) =>
  api.get('/attendance/admin/all', { params });

/** Get global analytics */
export const getAdminAnalytics = () => api.get('/attendance/admin/analytics');

/** Export all attendance as Excel */
export const exportAdminAttendance = (params = {}) =>
  api.get('/attendance/admin/export', {
    params,
    responseType: 'blob',
  });

/** Get attendance settings */
export const getAttendanceSettings = () =>
  api.get('/attendance/admin/settings');

/** Update attendance settings */
export const updateAttendanceSettings = (data) =>
  api.put('/attendance/admin/settings', data);

/** Get live status of all interns */
export const getLiveStatus = () => api.get('/attendance/admin/live-status');

/** Get admin monthly hours for all interns */
export const getAdminMonthlyHours = (params = {}) =>
  api.get('/attendance/admin/monthly-hours', { params });

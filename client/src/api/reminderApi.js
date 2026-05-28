import api from './axios';

/**
 * Reminder API service — handles reminder scheduling, rescheduling, and dismiss actions.
 */

/** Get scoped list of reminders with optional search & filter parameters */
export const getReminders = (params = {}) => api.get('/reminders', { params });

/** Create a new reminder */
export const createReminder = (data) => api.post('/reminders', data);

/** Update a reminder (supports full edits for guides/admins, or dismisses) */
export const updateReminder = (reminderId, data) => api.put(`/reminders/${reminderId}`, data);

/** Delete a reminder */
export const deleteReminder = (reminderId) => api.delete(`/reminders/${reminderId}`);

/** Dismiss a reminder to suppress alerts */
export const dismissReminder = (reminderId) => api.put(`/reminders/${reminderId}/dismiss`);

/** Trigger manual due reminder check (admin diagnostics only) */
export const manualTriggerReminders = () => api.post('/reminders/trigger');

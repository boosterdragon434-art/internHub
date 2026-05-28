import api from './axios';

/**
 * Task API service — ClickUp-like task system API interactions.
 */

/** Get filtered list of tasks */
export const getTasks = (params = {}) => api.get('/tasks', { params });

/** Get a single task by ID */
export const getTask = (taskId) => api.get(`/tasks/${taskId}`);

/** Create a new task (guide/admin only) */
export const createTask = (data) => api.post('/tasks', data);

/** Update a task (full for guide/admin, limited for student) */
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);

/** Delete a task (guide/admin only) */
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);

/** Bulk update drag-n-drop task order (guide/admin only) */
export const reorderTasks = (orderedIds) => api.put('/tasks/reorder', { orderedIds });

/** Add comment to a task */
export const addComment = (taskId, contentData) => api.post(`/tasks/${taskId}/comments`, contentData);

/** Get task comments */
export const getComments = (taskId) => api.get(`/tasks/${taskId}/comments`);

/** Get task activity feed logs */
export const getTaskActivity = (taskId) => api.get(`/tasks/${taskId}/activity`);

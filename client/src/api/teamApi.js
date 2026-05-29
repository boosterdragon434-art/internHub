import api from './axios';

/**
 * Team API service — endpoints for team/group management.
 */

/** Get all teams (paginated, with filters) */
export const getTeams = (params = {}) => api.get('/teams', { params });

/** Get a single team by ID */
export const getTeam = (id) => api.get(`/teams/${id}`);

/** Create a new team */
export const createTeam = (data) => api.post('/teams', data);

/** Update a team */
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);

/** Delete a team (soft delete) */
export const deleteTeam = (id) => api.delete(`/teams/${id}`);

/** Bulk add/remove members from a team */
export const updateTeamMembers = (id, data) =>
  api.put(`/teams/${id}/members`, data);

/** Assign or change guide for a team */
export const assignTeamGuide = (id, data) =>
  api.put(`/teams/${id}/guide`, data);

import api from './axios';

/**
 * Certificate API service — manages certificate list, generates credentials,
 * handles verification lookups, and manages certificate templates.
 */

// ─── Student Endpoints ───────────────────────────────────────

/** Get issued certificates for the logged-in student */
export const getMyCertificates = () => api.get('/certificates/my');

// ─── Admin Certificate Endpoints ─────────────────────────────

/** Generate and issue a new certificate (admin only) */
export const generateCertificate = (data) => api.post('/certificates/generate', data);

/** Revoke an issued certificate (admin only) */
export const revokeCertificate = (id) => api.put(`/certificates/${id}/revoke`);

// ─── Admin Template CRUD Endpoints ───────────────────────────

/** Get all certificate templates */
export const getTemplates = () => api.get('/certificates/templates');

/** Create a new certificate template */
export const createTemplate = (data) => api.post('/certificates/templates', data);

/** Update an existing certificate template */
export const updateTemplate = (id, data) => api.put(`/certificates/templates/${id}`, data);

/** Delete a certificate template */
export const deleteTemplate = (id) => api.delete(`/certificates/templates/${id}`);

// ─── Public Endpoints ────────────────────────────────────────

/** Public verification lookup (bypasses auth tokens) */
export const verifyCertificate = (certificateId) => api.get(`/certificates/verify/${certificateId}`);

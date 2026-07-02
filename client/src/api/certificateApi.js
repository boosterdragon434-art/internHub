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

/** Bulk generate certificates for multiple students */
export const bulkGenerate = (data) => api.post('/certificates/bulk-generate', data);

/** Preview certificate before generating (returns base64 PDF) */
export const previewCertificate = (data) => api.post('/certificates/preview', data);

/** Get all certificates for admin listing */
export const getAllCertificates = (params) => api.get('/certificates/admin/all', { params });

/** Revoke an issued certificate (admin only) */
export const revokeCertificate = (id) => api.put(`/certificates/${id}/revoke`);

/** Download a certificate PDF as blob */
export const downloadCertificate = (id) =>
  api.get(`/certificates/${id}/download`, { responseType: 'blob' });

// ─── Admin Template CRUD Endpoints ───────────────────────────

/** Get all certificate templates with optional search/filter */
export const getTemplates = (params) => api.get('/certificates/templates', { params });

/** Get template statistics (count, storage usage) */
export const getTemplateStats = () => api.get('/certificates/templates/stats');

/**
 * Create a new certificate template.
 * Supports upload progress tracking via onUploadProgress callback.
 */
export const createTemplate = (data, onUploadProgress) =>
  api.post('/certificates/templates', data, {
    onUploadProgress,
    timeout: 120000, // 2 minutes for large uploads
  });

/** Update an existing certificate template */
export const updateTemplate = (id, data, onUploadProgress) =>
  api.put(`/certificates/templates/${id}`, data, {
    onUploadProgress,
    timeout: 120000,
  });

/** Delete a certificate template */
export const deleteTemplate = (id) => api.delete(`/certificates/templates/${id}`);

/** Duplicate a certificate template */
export const duplicateTemplate = (id) => api.post(`/certificates/templates/${id}/duplicate`);

/** Test render a template */
export const testRenderTemplate = (id) => api.get(`/certificates/templates/${id}/test-render`);

/** Toggle template active/inactive status */
export const toggleTemplateStatus = (id, status) =>
  api.put(`/certificates/templates/${id}/toggle-status`, { status });

/** Download template background as blob */
export const downloadTemplateFile = (id) =>
  api.get(`/certificates/templates/${id}/download`, { responseType: 'blob' });

// ─── Public Endpoints ────────────────────────────────────────

/** Public verification lookup (bypasses auth tokens) */
export const verifyCertificate = (certificateId) => api.get(`/certificates/verify/${certificateId}`);

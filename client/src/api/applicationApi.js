import api from './axios';

export const submitApplication = async (formData) => {
  const response = await api.post('/applications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/applications/my');
  return response.data;
};

export const getAllApplications = async (params = {}) => {
  const response = await api.get('/applications', { params });
  return response.data;
};

export const getApplicationDetail = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

export const updateApplicationStatus = async (id, status, adminNotes = '') => {
  const response = await api.put(`/applications/${id}/status`, { status, adminNotes });
  return response.data;
};

export const assignPaymentAmount = async (id, amount) => {
  const response = await api.put(`/applications/${id}/assign-payment`, { amount });
  return response.data;
};

export const performBulkAction = async (applicationIds, action) => {
  const response = await api.post('/applications/bulk', { applicationIds, action });
  return response.data;
};

export const getApplicationStats = async () => {
  const response = await api.get('/applications/stats');
  return response.data;
};

export const exportApplicationsCsv = async (params = {}) => {
  const response = await api.get('/applications/export/csv', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

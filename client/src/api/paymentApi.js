import api from './axios';

export const submitUtr = async (applicationId, utrNumber, receiptFile) => {
  const formData = new FormData();
  formData.append('applicationId', applicationId);
  formData.append('utrNumber', utrNumber);
  if (receiptFile) {
    formData.append('image', receiptFile);
  }
  const response = await api.post('/payments/submit-utr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMyPaymentRequests = async () => {
  const response = await api.get('/payments/requests');
  return response.data;
};

export const adminVerifyPayment = async (paymentId, action, reason = '') => {
  const response = await api.put(`/payments/${paymentId}/verify`, { action, reason });
  return response.data;
};

export const getMyPayments = async () => {
  const response = await api.get('/payments/my');
  return response.data;
};

export const getAllPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const sendPaymentReminder = async (applicationId) => {
  const response = await api.post(`/payments/send-request/${applicationId}`);
  return response.data;
};

export const getPaymentStats = async () => {
  const response = await api.get('/payments/stats');
  return response.data;
};

export const exportPaymentsCsv = async () => {
  const response = await api.get('/payments/export/csv', {
    responseType: 'blob',
  });
  return response.data;
};

import api from './axios';

export const createPaymentOrder = async (applicationId) => {
  const response = await api.post('/payments/create-order', { applicationId });
  return response.data;
};

export const verifyPayment = async (verificationData) => {
  const response = await api.post('/payments/verify', verificationData);
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

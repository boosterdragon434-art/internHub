import api from './axios';

export const verifyEmailToken = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
};

export const forgotPasswordRequest = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordRequest = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

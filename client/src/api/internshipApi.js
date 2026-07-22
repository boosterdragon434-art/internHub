import api from './axios';

export const getInternshipsList = async (params = {}) => {
  const response = await api.get('/internships', { params });
  return response.data;
};

export const getInternshipDetail = async (id) => {
  const response = await api.get(`/internships/${id}`);
  return response.data;
};

export const getInternshipStats = async () => {
  const response = await api.get('/internships/stats');
  return response.data;
};

export const createInternship = async (formData) => {
  const response = await api.post('/internships', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
};

export const updateInternship = async (id, formData) => {
  const response = await api.put(`/internships/${id}`, formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
};

export const deleteInternship = async (id) => {
  const response = await api.delete(`/internships/${id}`);
  return response.data;
};

import api from './api.js';

export const leaveService = {
  apply: async (leaveData) => {
    const response = await api.post('/leaves/apply', leaveData);
    return response.data;
  },

  getMyLeaves: async (filters = {}) => {
    const response = await api.get('/leaves/my-leaves', { params: filters });
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/leaves/pending');
    return response.data;
  },

  approve: async (id) => {
    const response = await api.put(`/leaves/${id}/approve`);
    return response.data;
  },

  reject: async (id) => {
    const response = await api.put(`/leaves/${id}/reject`);
    return response.data;
  },

  getBalance: async () => {
    const response = await api.get('/leaves/balance');
    return response.data;
  },
};


import api from './api.js';

export const dashboardService = {
  getAdmin: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  getEmployee: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },
};


import api from './api.js';

export const attendanceService = {
  mark: async (attendanceData) => {
    const response = await api.post('/attendance/mark', attendanceData);
    return response.data;
  },

  getMyLogs: async (filters = {}) => {
    const response = await api.get('/attendance/my-logs', { params: filters });
    return response.data;
  },

  getEmployeeAttendance: async (employeeId, filters = {}) => {
    const response = await api.get(`/attendance/employee/${employeeId}`, { params: filters });
    return response.data;
  },

  getReport: async (month, year) => {
    const response = await api.get(`/attendance/report/${month}/${year}`);
    return response.data;
  },
};


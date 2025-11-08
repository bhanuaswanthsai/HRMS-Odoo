import api from './api.js';

export const payrollService = {
  process: async (employeeId, month, year) => {
    const response = await api.post(`/payroll/process/${employeeId}/${month}/${year}`);
    return response.data;
  },

  getEmployeePayroll: async (employeeId, month, year) => {
    const response = await api.get(`/payroll/employee/${employeeId}/${month}/${year}`);
    return response.data;
  },

  getPayslip: async (payslipId) => {
    const response = await api.get(`/payroll/payslips/${payslipId}`);
    return response.data;
  },

  update: async (id, payrollData) => {
    const response = await api.put(`/payroll/${id}/edit`, payrollData);
    return response.data;
  },

  getReport: async (month, year) => {
    const response = await api.get(`/payroll/reports/${month}/${year}`);
    return response.data;
  },
};


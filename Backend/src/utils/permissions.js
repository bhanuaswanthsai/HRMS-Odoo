// Permission matrix based on roles
export const PERMISSIONS = {
  // User Management
  USER_MANAGEMENT: {
    admin: true,
    hr_officer: false,
    payroll_officer: false,
    employee: false,
  },

  // Employee Management
  EMPLOYEE_CREATE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  EMPLOYEE_UPDATE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  EMPLOYEE_DELETE: {
    admin: true,
    hr_officer: false,
    payroll_officer: false,
    employee: false,
  },
  EMPLOYEE_VIEW: {
    admin: true,
    hr_officer: true,
    payroll_officer: true,
    employee: true,
  },

  // Attendance Management
  ATTENDANCE_MANAGE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  ATTENDANCE_VIEW_ALL: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  ATTENDANCE_VIEW_OWN: {
    admin: true,
    hr_officer: true,
    payroll_officer: true,
    employee: true,
  },

  // Leave Management
  LEAVE_APPROVE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  LEAVE_APPLY: {
    admin: true,
    hr_officer: true,
    payroll_officer: true,
    employee: true,
  },
  LEAVE_VIEW_ALL: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },

  // Payroll Management
  PAYROLL_PROCESS: {
    admin: true,
    hr_officer: false,
    payroll_officer: true,
    employee: false,
  },
  PAYROLL_VIEW_ALL: {
    admin: true,
    hr_officer: false,
    payroll_officer: true,
    employee: false,
  },
  PAYROLL_VIEW_OWN: {
    admin: true,
    hr_officer: true,
    payroll_officer: true,
    employee: true,
  },

  // Reports
  REPORTS_VIEW: {
    admin: true,
    hr_officer: false,
    payroll_officer: true,
    employee: false,
  },

  // Settings
  SETTINGS_MANAGE: {
    admin: true,
    hr_officer: false,
    payroll_officer: false,
    employee: false,
  },
};

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  if (!PERMISSIONS[permission]) {
    return false;
  }
  return PERMISSIONS[permission][userRole] || false;
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  const permissions = {};
  Object.keys(PERMISSIONS).forEach((key) => {
    permissions[key] = PERMISSIONS[key][role] || false;
  });
  return permissions;
};


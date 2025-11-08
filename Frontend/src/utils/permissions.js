// Frontend permission matrix
export const PERMISSIONS = {
  USER_MANAGEMENT: {
    admin: true,
    hr_officer: false,
    payroll_officer: false,
    employee: false,
  },
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
  ATTENDANCE_MANAGE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  LEAVE_APPROVE: {
    admin: true,
    hr_officer: true,
    payroll_officer: false,
    employee: false,
  },
  PAYROLL_PROCESS: {
    admin: true,
    hr_officer: false,
    payroll_officer: true,
    employee: false,
  },
  REPORTS_VIEW: {
    admin: true,
    hr_officer: false,
    payroll_officer: true,
    employee: false,
  },
  SETTINGS_MANAGE: {
    admin: true,
    hr_officer: false,
    payroll_officer: false,
    employee: false,
  },
};

export const hasPermission = (userRole, permission) => {
  if (!PERMISSIONS[permission]) {
    return false;
  }
  return PERMISSIONS[permission][userRole] || false;
};

export const canViewAll = (userRole, resourceType) => {
  if (userRole === 'admin') return true;
  if (resourceType === 'attendance' && userRole === 'hr_officer') return true;
  if (resourceType === 'leave' && userRole === 'hr_officer') return true;
  if (resourceType === 'payroll' && userRole === 'payroll_officer') return true;
  return false;
};


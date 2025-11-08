import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission, canViewAll } from '../utils/permissions.js';

export const usePermissions = () => {
  const { user } = useAuth();

  const checkPermission = (permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const canView = (resourceType) => {
    if (!user) return false;
    return canViewAll(user.role, resourceType);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isHR = () => {
    return user?.role === 'hr_officer';
  };

  const isPayrollOfficer = () => {
    return user?.role === 'payroll_officer';
  };

  const isEmployee = () => {
    return user?.role === 'employee';
  };

  return {
    checkPermission,
    canView,
    isAdmin,
    isHR,
    isPayrollOfficer,
    isEmployee,
    userRole: user?.role,
  };
};


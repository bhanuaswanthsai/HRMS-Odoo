import { hasPermission } from '../utils/permissions.js';

// Middleware to check specific permission
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions',
      });
    }

    next();
  };
};

// Middleware to check if user can view own or all records
export const checkViewPermission = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    const { id } = req.params;

    // Admin and HR can view all
    if (userRole === 'admin' || userRole === 'hr_officer') {
      return next();
    }

    // Payroll officer can view payroll records
    if (resourceType === 'payroll' && userRole === 'payroll_officer') {
      return next();
    }

    // Employees can only view their own records
    if (id && req.user.employee_id) {
      // Check if the requested resource belongs to the user
      // This will be handled in the controller
      req.viewOwnOnly = true;
      return next();
    }

    // If no ID, check if user can view all
    if (resourceType === 'attendance' && hasPermission(userRole, 'ATTENDANCE_VIEW_ALL')) {
      return next();
    }

    if (resourceType === 'leave' && hasPermission(userRole, 'LEAVE_VIEW_ALL')) {
      return next();
    }

    // Default: deny access
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own records',
    });
  };
};


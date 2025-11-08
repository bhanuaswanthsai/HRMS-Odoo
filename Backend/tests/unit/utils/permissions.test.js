import { hasPermission, getRolePermissions, PERMISSIONS } from '../../../src/utils/permissions.js';

describe('Permission Utilities', () => {
  describe('hasPermission', () => {
    it('should return true for admin with USER_MANAGEMENT permission', () => {
      expect(hasPermission('admin', 'USER_MANAGEMENT')).toBe(true);
    });

    it('should return false for hr_officer with USER_MANAGEMENT permission', () => {
      expect(hasPermission('hr_officer', 'USER_MANAGEMENT')).toBe(false);
    });

    it('should return true for admin and hr_officer with EMPLOYEE_CREATE permission', () => {
      expect(hasPermission('admin', 'EMPLOYEE_CREATE')).toBe(true);
      expect(hasPermission('hr_officer', 'EMPLOYEE_CREATE')).toBe(true);
    });

    it('should return false for employee with EMPLOYEE_CREATE permission', () => {
      expect(hasPermission('employee', 'EMPLOYEE_CREATE')).toBe(false);
    });

    it('should return true for payroll_officer with PAYROLL_PROCESS permission', () => {
      expect(hasPermission('payroll_officer', 'PAYROLL_PROCESS')).toBe(true);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission('admin', 'INVALID_PERMISSION')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid_role', 'USER_MANAGEMENT')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const permissions = getRolePermissions('admin');
      
      expect(permissions.USER_MANAGEMENT).toBe(true);
      expect(permissions.EMPLOYEE_CREATE).toBe(true);
      expect(permissions.PAYROLL_PROCESS).toBe(true);
      expect(permissions.SETTINGS_MANAGE).toBe(true);
    });

    it('should return correct permissions for hr_officer', () => {
      const permissions = getRolePermissions('hr_officer');
      
      expect(permissions.USER_MANAGEMENT).toBe(false);
      expect(permissions.EMPLOYEE_CREATE).toBe(true);
      expect(permissions.LEAVE_APPROVE).toBe(true);
      expect(permissions.PAYROLL_PROCESS).toBe(false);
    });

    it('should return correct permissions for employee', () => {
      const permissions = getRolePermissions('employee');
      
      expect(permissions.EMPLOYEE_CREATE).toBe(false);
      expect(permissions.LEAVE_APPLY).toBe(true);
      expect(permissions.PAYROLL_VIEW_OWN).toBe(true);
    });
  });

  describe('Permission Matrix Coverage', () => {
    it('should have permissions defined for all roles', () => {
      const roles = ['admin', 'hr_officer', 'payroll_officer', 'employee'];
      const permissionKeys = Object.keys(PERMISSIONS);
      
      permissionKeys.forEach(permission => {
        roles.forEach(role => {
          expect(PERMISSIONS[permission]).toHaveProperty(role);
        });
      });
    });
  });
});


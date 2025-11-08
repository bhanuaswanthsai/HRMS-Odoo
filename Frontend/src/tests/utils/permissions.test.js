import { describe, it, expect } from 'vitest';
import { hasPermission, canViewAll } from '../../utils/permissions.js';

describe('Frontend Permissions', () => {
  describe('hasPermission', () => {
    it('should return true for admin with USER_MANAGEMENT', () => {
      expect(hasPermission('admin', 'USER_MANAGEMENT')).toBe(true);
    });

    it('should return false for employee with USER_MANAGEMENT', () => {
      expect(hasPermission('employee', 'USER_MANAGEMENT')).toBe(false);
    });

    it('should return true for admin and hr_officer with EMPLOYEE_CREATE', () => {
      expect(hasPermission('admin', 'EMPLOYEE_CREATE')).toBe(true);
      expect(hasPermission('hr_officer', 'EMPLOYEE_CREATE')).toBe(true);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission('admin', 'INVALID_PERMISSION')).toBe(false);
    });
  });

  describe('canViewAll', () => {
    it('should return true for admin viewing any resource', () => {
      expect(canViewAll('admin', 'attendance')).toBe(true);
      expect(canViewAll('admin', 'leave')).toBe(true);
      expect(canViewAll('admin', 'payroll')).toBe(true);
    });

    it('should return true for hr_officer viewing attendance', () => {
      expect(canViewAll('hr_officer', 'attendance')).toBe(true);
    });

    it('should return true for payroll_officer viewing payroll', () => {
      expect(canViewAll('payroll_officer', 'payroll')).toBe(true);
    });

    it('should return false for employee viewing all', () => {
      expect(canViewAll('employee', 'attendance')).toBe(false);
      expect(canViewAll('employee', 'payroll')).toBe(false);
    });
  });
});


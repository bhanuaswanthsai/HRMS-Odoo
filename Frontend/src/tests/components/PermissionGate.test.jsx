import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PermissionGate from '../../components/PermissionGate.jsx';
import { AuthProvider } from '../../context/AuthContext.jsx';

// Mock usePermissions hook
vi.mock('../../hooks/usePermissions.js', () => ({
  usePermissions: () => ({
    checkPermission: (permission) => {
      // Mock: admin has all permissions
      return permission === 'EMPLOYEE_CREATE';
    },
  }),
}));

describe('PermissionGate Component', () => {
  it('should render children when permission is granted', () => {
    render(
      <AuthProvider>
        <PermissionGate permission="EMPLOYEE_CREATE">
          <div>Protected Content</div>
        </PermissionGate>
      </AuthProvider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when permission is denied', () => {
    render(
      <AuthProvider>
        <PermissionGate permission="USER_MANAGEMENT">
          <div>Protected Content</div>
        </PermissionGate>
      </AuthProvider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render fallback when permission is denied', () => {
    render(
      <AuthProvider>
        <PermissionGate 
          permission="USER_MANAGEMENT"
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </PermissionGate>
      </AuthProvider>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});


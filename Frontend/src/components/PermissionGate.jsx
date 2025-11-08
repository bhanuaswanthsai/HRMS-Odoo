import { usePermissions } from '../hooks/usePermissions.js';

const PermissionGate = ({ permission, children, fallback = null }) => {
  const { checkPermission } = usePermissions();

  if (!checkPermission(permission)) {
    return fallback;
  }

  return children;
};

export default PermissionGate;


import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPermissions?: string[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback,
  requiredPermissions = []
}) => {
  const { user, hasPermission } = useAuth();

  // Check if user has required role
  const hasRequiredRole = user && allowedRoles.includes(user.role);

  // Check if user has all required permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    hasPermission(permission)
  );

  if (!hasRequiredRole || !hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="m-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this feature. Required role: {allowedRoles.join(', ')}
          {requiredPermissions.length > 0 && ` and permissions: ${requiredPermissions.join(', ')}`}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
import React from "react";
import { useAppSelector } from "@/store/hooks";
import { selectHasPermission } from "@/store/slices/authSlice";

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const hasPermission = useAppSelector(selectHasPermission(permission));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;

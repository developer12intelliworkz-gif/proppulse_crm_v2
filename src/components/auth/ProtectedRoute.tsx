// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isLeadsAccessRole } from "@/utils/rolePermissions";
import OnboardingGuard from "./OnboardingGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  /** Skip onboarding redirect (onboarding routes use the guard directly). */
  skipOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  skipOnboarding = false,
}) => {
  const { isAuthenticated, hasPermission, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission === "view_leads" && isLeadsAccessRole(user?.role)) {
    const content = <>{children}</>;
    return skipOnboarding ? content : <OnboardingGuard>{content}</OnboardingGuard>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const content = <>{children}</>;
  return skipOnboarding ? content : <OnboardingGuard>{content}</OnboardingGuard>;
};

export default ProtectedRoute;

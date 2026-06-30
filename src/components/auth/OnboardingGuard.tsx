import { useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchOnboardingStatus,
  resolveOnboardingPath,
  type OnboardingStatus,
} from "@/utils/onboarding";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const isOnboardingStepPath = (pathname: string) => {
  const path = pathname.replace(/\/$/, "");
  return (
    path.endsWith("/step1") ||
    path.endsWith("/step2") ||
    path.endsWith("/company") ||
    path.endsWith("/brand")
  );
};

const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const locallyComplete = Boolean(user?.company_id && user?.brand_id);

  const loadStatus = useCallback(async () => {
    try {
      const next = await fetchOnboardingStatus();
      setStatus(next);
    } catch (error) {
      console.error("Failed to load onboarding status:", error);
      setStatus({
        userCount: 2,
        needsOnboarding: false,
        onboardingStep: null,
        hasCompany: true,
        brandCount: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadStatus();
  }, [loadStatus, user?.id, user?.company_id, user?.brand_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!status) return <>{children}</>;

  if (isOnboardingRoute) {
    if (!status.needsOnboarding || locallyComplete) {
      return <Navigate to="/dashboard" replace />;
    }

    const path = location.pathname.replace(/\/$/, "");
    if (path === "/onboarding") {
      return <Navigate to={resolveOnboardingPath(status)} replace />;
    }

    if (isOnboardingStepPath(location.pathname)) {
      return <>{children}</>;
    }

    return <Navigate to={resolveOnboardingPath(status)} replace />;
  }

  if (status.needsOnboarding && !locallyComplete) {
    return <Navigate to={resolveOnboardingPath(status)} replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;

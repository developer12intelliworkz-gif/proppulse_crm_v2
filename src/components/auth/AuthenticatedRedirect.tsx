import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getPostLoginPath } from "@/utils/onboarding";

/** Sends authenticated users to dashboard or the correct onboarding step. */
const AuthenticatedRedirect = () => {
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setPath(await getPostLoginPath());
      } catch {
        setPath("/dashboard");
      }
    })();
  }, []);

  if (!path) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <Navigate to={path} replace />;
};

export default AuthenticatedRedirect;

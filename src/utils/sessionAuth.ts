export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

export const clearAuthSession = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
};

const isLoginRequest = (url?: string) =>
  Boolean(url?.includes("/auth/login"));

export const isAuthFailure = (status?: number, message?: string) => {
  const normalized = (message ?? "").toLowerCase();
  if (status === 401) return true;
  if (status === 403) {
    return (
      normalized.includes("invalid") ||
      normalized.includes("expired") ||
      normalized.includes("token") ||
      normalized.includes("unauthorized")
    );
  }
  return false;
};

/** Clear session and send user to login (avoids staying on dashboard with a dead token). */
export const handleSessionExpired = (requestUrl?: string) => {
  if (isLoginRequest(requestUrl)) return;

  clearAuthSession();
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));

  const onLoginPage =
    window.location.pathname === "/login" ||
    window.location.pathname === "/";
  if (!onLoginPage) {
    window.location.replace("/login");
  }
};

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  initializeAuth,
  loginUser,
  logout as logoutAction,
  refreshPermissions,
  setUser,
  listenForSessionExpired,
  selectAuth,
  selectIsAuthenticated,
} from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/rolePermissions";

import type { User } from "@/store/types/auth";

export type { User };

/** Bootstraps auth state from localStorage and session listeners. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void (async () => {
      const result = await dispatch(initializeAuth());
      if (initializeAuth.fulfilled.match(result) && result.payload.user) {
        await dispatch(refreshPermissions());
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    return listenForSessionExpired(dispatch);
  }, [dispatch]);

  return <>{children}</>;
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await dispatch(loginUser({ email, password })).unwrap();
        return { success: true as const };
      } catch (err) {
        return {
          success: false as const,
          error: typeof err === "string" ? err : "Login failed",
        };
      }
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const refreshPermissionsFn = useCallback(async () => {
    await dispatch(refreshPermissions());
  }, [dispatch]);

  const hasPermission = useCallback(
    (permission: string) =>
      checkPermission(auth.user?.role, auth.rolePermissions, permission),
    [auth.user?.role, auth.rolePermissions],
  );

  const setUserFn = useCallback(
    (user: User | null) => {
      dispatch(setUser(user));
    },
    [dispatch],
  );

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: useAppSelector(selectIsAuthenticated),
    isLoading: auth.isLoading,
    login,
    logout,
    hasPermission,
    setUser: setUserFn,
    refreshPermissions: refreshPermissionsFn,
  };
};

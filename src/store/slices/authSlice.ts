import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/utils/sessionAuth";
import {
  User,
  INITIAL_ROLE_PERMISSIONS,
} from "@/store/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  rolePermissions: Record<string, string[]>;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  rolePermissions: { ...INITIAL_ROLE_PERMISSIONS },
};

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async () => {
    const storedToken = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    if (!storedToken || !userData) {
      return { user: null, token: null };
    }
    try {
      const parsedUser = JSON.parse(userData) as User;
      return { user: parsedUser, token: storedToken };
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      return { user: null, token: null };
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      let { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return rejectWithValue("Invalid server response");
      }

      if (!userData.role && userData.roles_permissions_id) {
        try {
          const rolesResponse = await axiosInstance.get("/roles-permissions");
          const rolesData = rolesResponse.data;
          const roleDetails = rolesData[userData.roles_permissions_id];
          if (roleDetails) {
            userData = {
              ...userData,
              role: roleDetails.role_name,
              roles_permissions_id: userData.roles_permissions_id,
            };
          }
        } catch (mapError) {
          console.error("Error mapping role:", mapError);
        }
      }

      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("user_data", JSON.stringify(userData));
      await dispatch(refreshPermissions(userData as User)).unwrap();
      return { user: userData as User, token: newToken };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage =
        err.response?.data?.error ||
        "Login failed. Please check your credentials and try again.";
      return rejectWithValue(errorMessage);
    }
  },
);

export const refreshPermissions = createAsyncThunk(
  "auth/refreshPermissions",
  async (userOverride: User | undefined, { getState }) => {
    const state = getState() as { auth: AuthState };
    const user = userOverride ?? state.auth.user;

    // Enforce loading permissions from backend for all roles including admin

    const response = await axiosInstance.get("/roles-permissions");
    const rolesData = Object.entries(response.data).map(
      ([id, details]: [string, unknown]) => ({
        id,
        ...(details as Record<string, unknown>),
      }),
    );

    const newPerms: Record<string, string[]> = {};
    rolesData.forEach((role) => {
      if (role.status) {
        let perms = (role.permissions as string[]) || [];
        if (perms && typeof perms === "object" && !Array.isArray(perms)) {
          perms = Object.values(perms).flat() as string[];
        }
        if (!Array.isArray(perms)) perms = [];
        const roleName = (role.role_name as string)?.toLowerCase() || "unknown";
        newPerms[roleName] = perms;
      }
    });

    return newPerms;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user_data", JSON.stringify(action.payload));
      }
    },
    logout(state) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      state.user = null;
      state.token = null;
      state.rolePermissions = { ...INITIAL_ROLE_PERMISSIONS };
    },
    sessionExpired(state) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      state.user = null;
      state.token = null;
      state.rolePermissions = { ...INITIAL_ROLE_PERMISSIONS };
    },
    mergeRolePermissions(
      state,
      action: PayloadAction<Record<string, string[]>>,
    ) {
      state.rolePermissions = { ...state.rolePermissions, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(refreshPermissions.fulfilled, (state, action) => {
        state.rolePermissions = {
          ...state.rolePermissions,
          ...action.payload,
        };
      })
      .addCase(refreshPermissions.rejected, (state) => {
        state.rolePermissions = { ...INITIAL_ROLE_PERMISSIONS };
      });
  },
});

export const { setUser, logout, sessionExpired, mergeRolePermissions } =
  authSlice.actions;

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.user && !!state.auth.token;

export const selectHasPermission =
  (permission: string) => (state: { auth: AuthState }) => {
    const { user, rolePermissions } = state.auth;
    if (!user?.role) return false;
    const normalizedRole = user.role.toLowerCase().trim();
    const perms = rolePermissions[normalizedRole] || [];
    return Array.isArray(perms) ? perms.includes(permission) : false;
  };

export default authSlice.reducer;

/** Register session-expired listener (call once from AuthProvider). */
export function listenForSessionExpired(dispatch: (action: unknown) => void) {
  const handler = () => dispatch(sessionExpired());
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
  return () =>
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
}

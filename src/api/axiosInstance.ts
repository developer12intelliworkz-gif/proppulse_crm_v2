import axios, { InternalAxiosRequestConfig } from "axios";
import { SECURITY_CONFIG } from "@/config/security";
import { handleSessionExpired, isAuthFailure } from "@/utils/sessionAuth";

const axiosInstance = axios.create({
  baseURL: `${SECURITY_CONFIG.API_BASE_URL}/`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No auth token found in localStorage");
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message;

    if (isAuthFailure(status, message)) {
      handleSessionExpired(error.config?.url);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

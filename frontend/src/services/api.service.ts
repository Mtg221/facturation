import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Store access token in memory (not localStorage)
let accessToken: string | null = null;
let csrfToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Fetch CSRF token from backend
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api/csrf-token`, { withCredentials: true });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch {
    return null;
  }
}

// Request interceptor: attach access token and CSRF token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  // Add CSRF token for state-changing requests
  const mutatingMethods = ['post', 'put', 'patch', 'delete'];
  if (mutatingMethods.includes(config.method?.toLowerCase() || '')) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return config;
});

// Response interceptor: handle 401 with silent refresh via cookie
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is in HttpOnly cookie, just call refresh endpoint with credentials
        const response = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          null,
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = response.data.data;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      const message = (error.response?.data as { message?: string | string[] })?.message;
      const errorMsg = Array.isArray(message) ? message[0] : message ?? 'Une erreur est survenue';
      toast.error(errorMsg);
    }

    return Promise.reject(error);
  },
);

export default api;
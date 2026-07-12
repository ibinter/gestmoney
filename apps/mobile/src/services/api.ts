import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.gestmoney.com/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('access_token', data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// --- Transactions ---
export const transactionApi = {
  list: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
  create: (data: Record<string, unknown>) => api.post('/transactions', data),
  getById: (id: string) => api.get(`/transactions/${id}`),
  getReceipt: (id: string) => api.get(`/transactions/${id}/receipt`),
};

// --- Float ---
export const floatApi = {
  list: () => api.get('/float'),
  requestRestock: (operatorId: string, amount: number) =>
    api.post('/float/restock-request', { operatorId, amount }),
  history: (operatorId?: string) =>
    api.get('/float/history', { params: { operatorId } }),
};

// --- Commissions ---
export const commissionApi = {
  summary: (period?: 'day' | 'week' | 'month') =>
    api.get('/commissions/summary', { params: { period } }),
  list: (params?: Record<string, unknown>) => api.get('/commissions', { params }),
};

// --- Dashboard ---
export const dashboardApi = {
  agentStats: () => api.get('/dashboard/agent'),
};

export default api;

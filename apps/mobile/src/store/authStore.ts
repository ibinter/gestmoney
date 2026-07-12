import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  code: string;
  agencyName: string;
  agencyId: string;
  role: string;
  avatar?: string;
  activeOperators: string[];
}

interface AuthState {
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  agent: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      await SecureStore.setItemAsync('agent', JSON.stringify(data.user));
      set({ agent: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Identifiants invalides. Veuillez réessayer.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('agent');
    set({ agent: null, isAuthenticated: false });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const agentJson = await SecureStore.getItemAsync('agent');
      if (token && agentJson) {
        const agent = JSON.parse(agentJson) as Agent;
        set({ agent, isAuthenticated: true });
      }
    } catch {
      // session invalide
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

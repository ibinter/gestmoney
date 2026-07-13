// ============================================================
// STORE AUTHENTIFICATION — ZUSTAND
// Sécurité : le token JWT est stocké en cookie httpOnly (côté NestJS).
// Le store ne conserve que les métadonnées utilisateur (non sensibles).
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Appeler l'endpoint logout pour effacer les cookies httpOnly côté serveur
        fetch('/api/auth-logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'gestmoney-auth',
      // Ne persiste que les données non-sensibles
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

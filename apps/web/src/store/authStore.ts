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
  /** false tant que `persist` n'a pas relu le localStorage. Au premier rendu
   *  client, `isAuthenticated` vaut toujours false : sans ce drapeau, un
   *  garde de route renverrait vers /login un utilisateur pourtant connecté. */
  hasHydrated: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (valeur: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

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

      setHasHydrated: (valeur) => set({ hasHydrated: valeur }),
    }),
    {
      name: 'gestmoney-auth',
      // Ne persiste que les données non-sensibles. `hasHydrated` est
      // volontairement exclu : il doit repartir à false à chaque chargement.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Appelé après la relecture du localStorage. On passe par l'état reçu en
      // argument : référencer `useAuthStore` ici tomberait dans sa zone morte
      // temporelle (l'hydratation est synchrone, la const n'est pas encore
      // assignée) et le drapeau ne serait jamais levé.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

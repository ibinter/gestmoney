/**
 * Tests unitaires — Store Zustand authStore
 * Vitest
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ─── Mock localStorage ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ─── Import du store après le mock ───────────────────────────────────────────

import { useAuthStore } from '@/store/authStore';

const mockUser = {
  id: 'user-1',
  nom: 'KOUAKOU',
  prenom: 'Patrice',
  email: 'patrice@ibigsoft.ci',
  role: 'super_admin',
  actif: true,
  createdAt: '2024-01-01',
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    act(() => {
      useAuthStore.getState().logout();
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ─── État initial ─────────────────────────────────────────────────────────────

  describe('État initial', () => {
    it('devrait avoir user = null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('devrait avoir token = null', () => {
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('devrait avoir isAuthenticated = false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ─── login() ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('devrait mettre à jour user après login', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'access-token-123');
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('devrait mettre à jour token après login', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'access-token-123');
      });

      expect(useAuthStore.getState().token).toBe('access-token-123');
    });

    it('devrait passer isAuthenticated à true après login', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'access-token-123');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('devrait persister le token dans localStorage', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'access-token-123');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gestmoney_token',
        'access-token-123',
      );
    });
  });

  // ─── logout() ────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'access-token-123');
      });
    });

    it('devrait remettre user à null après logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('devrait remettre token à null après logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().token).toBeNull();
    });

    it('devrait passer isAuthenticated à false après logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('devrait supprimer le token du localStorage', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gestmoney_token');
    });
  });

  // ─── updateUser() ─────────────────────────────────────────────────────────────

  describe('updateUser()', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().login(mockUser as any, 'token-1');
      });
    });

    it('devrait mettre à jour un champ de l\'utilisateur', () => {
      act(() => {
        useAuthStore.getState().updateUser({ nom: 'DUPONT' } as any);
      });

      expect(useAuthStore.getState().user?.nom).toBe('DUPONT');
    });

    it('devrait préserver les champs non modifiés', () => {
      act(() => {
        useAuthStore.getState().updateUser({ nom: 'DUPONT' } as any);
      });

      const user = useAuthStore.getState().user as any;
      expect(user.email).toBe(mockUser.email);
      expect(user.role).toBe(mockUser.role);
    });

    it('devrait ne rien faire si user est null', () => {
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.getState().updateUser({ nom: 'DUPONT' } as any);
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});

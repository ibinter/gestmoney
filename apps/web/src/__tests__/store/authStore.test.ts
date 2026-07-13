/**
 * Tests unitaires — Store Zustand authStore
 * Vitest — migré vers cookie httpOnly (le token n'est plus en localStorage)
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

// Mock fetch (utilisé par logout pour appeler /api/auth-logout)
globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

// ─── Import du store après le mock ───────────────────────────────────────────

import { useAuthStore } from '@/store/authStore';

const mockUser = {
  id: 'user-1',
  nom: 'KOUAKOU',
  prenom: 'Patrice',
  email: 'patrice@ibigsoft.ci',
  role: 'SUPER_ADMIN',
  actif: true,
  createdAt: '2024-01-01',
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('État initial', () => {
    it('devrait avoir user = null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('devrait avoir isAuthenticated = false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('login()', () => {
    it('devrait mettre à jour user après login', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any);
      });
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('devrait passer isAuthenticated à true après login', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any);
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('ne devrait PAS stocker de token en localStorage (sécurité cookie httpOnly)', () => {
      act(() => {
        useAuthStore.getState().login(mockUser as any);
      });
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'gestmoney_token',
        expect.any(String),
      );
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().login(mockUser as any);
      });
    });

    it('devrait remettre user à null après logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('devrait passer isAuthenticated à false après logout', () => {
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('devrait appeler /api/auth-logout pour effacer les cookies httpOnly', () => {
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/auth-logout',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    });
  });

  describe('updateUser()', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().login(mockUser as any);
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
        useAuthStore.setState({ user: null });
        useAuthStore.getState().updateUser({ nom: 'DUPONT' } as any);
      });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});

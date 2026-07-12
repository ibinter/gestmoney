/**
 * Setup global pour Vitest + Testing Library
 * Ce fichier est exécuté avant chaque suite de tests.
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Nettoyage automatique du DOM après chaque test
afterEach(() => {
  cleanup();
});

// ─── Mock global de matchMedia (non disponible dans jsdom) ───────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Mock de ResizeObserver ───────────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ─── Suppression des warnings React en tests ─────────────────────────────────
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Ignorer les warnings connus de Next.js en environnement test
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

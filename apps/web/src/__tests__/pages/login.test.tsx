/**
 * Tests unitaires — Page Login
 * Vitest + Testing Library
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks Next.js ────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ─── Mock du store Zustand ────────────────────────────────────────────────────

const mockLogin = vi.fn();
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
  }),
}));

// ─── Mock des icônes lucide-react ─────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
}));

import LoginPage from '@/app/(auth)/login/page';

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le formulaire de connexion', () => {
    render(<LoginPage />);
    expect(screen.getByText('Connexion')).toBeDefined();
    // Champ email
    expect(screen.getByPlaceholderText('vous@exemple.ci')).toBeDefined();
    // Champ mot de passe
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    // Bouton
    expect(screen.getByText('Se connecter')).toBeDefined();
  });

  it('devrait afficher le titre GESTMONEY', () => {
    render(<LoginPage />);
    const titles = screen.getAllByText('GESTMONEY');
    expect(titles.length).toBeGreaterThan(0);
  });

  it("devrait afficher le slogan IBIG SOFT", () => {
    render(<LoginPage />);
    const byIbig = screen.getAllByText('by IBIG SOFT');
    expect(byIbig.length).toBeGreaterThan(0);
  });

  it('devrait afficher une erreur si les champs sont vides à la soumission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Vider les champs pré-remplis
    const emailInput = screen.getByPlaceholderText('vous@exemple.ci') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    await user.clear(emailInput);
    await user.clear(passwordInput);

    const submitBtn = screen.getByText('Se connecter').closest('button')!;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Veuillez remplir tous les champs.')).toBeDefined();
    });
  });

  it('devrait appeler authStore.login() avec des credentials valides', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Les champs sont pré-remplis avec les credentials de démo
    const submitBtn = screen.getByText('Se connecter').closest('button')!;
    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'admin@gestmoney.ci' }),
          'mock_token_xyz_123',
        );
      },
      { timeout: 2000 },
    );
  });

  it('devrait naviguer vers /dashboard après connexion réussie', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitBtn = screen.getByText('Se connecter').closest('button')!;
    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      },
      { timeout: 2000 },
    );
  });

  it('devrait afficher une erreur pour des credentials incorrects', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('vous@exemple.ci');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.clear(emailInput);
    await user.type(emailInput, 'mauvais@email.ci');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'mauvaismdp');

    const submitBtn = screen.getByText('Se connecter').closest('button')!;
    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(screen.getByText('Email ou mot de passe incorrect.')).toBeDefined();
      },
      { timeout: 2000 },
    );
  });

  it('devrait afficher/masquer le mot de passe en cliquant sur Afficher', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByText('Afficher');
    await user.click(toggleBtn);

    await waitFor(() => {
      const updatedInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      expect(updatedInput.type).toBe('text');
    });
  });

  it('le bouton submit doit être de type submit', () => {
    render(<LoginPage />);
    const submitBtn = screen.getByText('Se connecter').closest('button') as HTMLButtonElement;
    expect(submitBtn.type).toBe('submit');
  });
});

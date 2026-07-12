/**
 * Tests unitaires — Composant Button
 * Vitest + Testing Library
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  // ─── Rendu de base ──────────────────────────────────────────────────────────

  it('devrait rendre le texte enfant', () => {
    render(<Button>Valider</Button>);
    expect(screen.getByText('Valider')).toBeDefined();
  });

  // ─── Variantes ───────────────────────────────────────────────────────────────

  it('devrait rendre la variante primary par défaut', () => {
    render(<Button variante="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary');
  });

  it('devrait rendre la variante secondary', () => {
    render(<Button variante="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-sidebar');
  });

  it('devrait rendre la variante danger', () => {
    render(<Button variante="danger">Supprimer</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-danger');
  });

  it('devrait rendre la variante ghost', () => {
    render(<Button variante="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('devrait rendre la variante outline', () => {
    render(<Button variante="outline">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-2');
  });

  // ─── Tailles ─────────────────────────────────────────────────────────────────

  it('devrait appliquer la taille sm', () => {
    render(<Button taille="sm">Petit</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-xs');
  });

  it('devrait appliquer la taille md par défaut', () => {
    render(<Button>Moyen</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-sm');
  });

  it('devrait appliquer la taille lg', () => {
    render(<Button taille="lg">Grand</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-base');
  });

  // ─── Événements ───────────────────────────────────────────────────────────────

  it('devrait appeler onClick au clic', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas appeler onClick si disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Désactivé
      </Button>,
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    // Le bouton est disabled, pointer-events: none → le handler ne doit pas s'appeler
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── État disabled ────────────────────────────────────────────────────────────

  it('devrait avoir l\'attribut disabled si disabled=true', () => {
    render(<Button disabled>Désactivé</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('devrait ajouter opacity-60 si disabled', () => {
    render(<Button disabled>Désactivé</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('opacity-60');
  });

  // ─── État loading ─────────────────────────────────────────────────────────────

  it('devrait afficher un spinner SVG si loading=true', () => {
    render(<Button loading>Chargement</Button>);
    const btn = screen.getByRole('button');
    // Le SVG de spinner doit être présent
    const svg = btn.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.className.toString()).toContain('animate-spin');
  });

  it('devrait désactiver le bouton si loading=true', () => {
    render(<Button loading>Chargement</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('devrait avoir opacity-60 si loading=true', () => {
    render(<Button loading>Chargement</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('opacity-60');
  });

  // ─── Full width ───────────────────────────────────────────────────────────────

  it('devrait appliquer w-full si fullWidth=true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  // ─── Icône ───────────────────────────────────────────────────────────────────

  it("devrait afficher l'icône à gauche par défaut", () => {
    render(<Button icone={<span data-testid="icon">★</span>}>Avec icône</Button>);
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it("ne devrait pas afficher l'icône si loading=true", () => {
    render(<Button loading icone={<span data-testid="icon">★</span>}>Chargement</Button>);
    expect(screen.queryByTestId('icon')).toBeNull();
  });
});

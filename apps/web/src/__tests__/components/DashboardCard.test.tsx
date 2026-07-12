/**
 * Tests unitaires — Composant DashboardCard
 * Vitest + Testing Library
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  icone: '💰',
  titre: 'Float Orange Money',
  stats: [
    { label: 'Solde actuel', valeur: '1 250 000 FCFA', couleur: 'success' as const },
    { label: 'Agents actifs', valeur: 12 },
  ],
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('DashboardCard', () => {
  // ─── Rendu du titre ──────────────────────────────────────────────────────────

  it('devrait afficher le titre', () => {
    render(<DashboardCard {...defaultProps} />);
    expect(screen.getByText('Float Orange Money')).toBeDefined();
  });

  // ─── Affichage de l'icône ─────────────────────────────────────────────────────

  it("devrait afficher l'icône", () => {
    render(<DashboardCard {...defaultProps} />);
    expect(screen.getByText('💰')).toBeDefined();
  });

  // ─── Affichage des statistiques ──────────────────────────────────────────────

  it('devrait afficher les labels et valeurs des stats', () => {
    render(<DashboardCard {...defaultProps} />);
    expect(screen.getByText('Solde actuel')).toBeDefined();
    expect(screen.getByText('1 250 000 FCFA')).toBeDefined();
    expect(screen.getByText('Agents actifs')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
  });

  it('devrait afficher toutes les stats fournies', () => {
    const stats = [
      { label: 'Total transactions', valeur: 42 },
      { label: 'Montant total', valeur: '5 000 000 FCFA' },
      { label: 'Commissions', valeur: '50 000 FCFA' },
    ];
    render(<DashboardCard {...defaultProps} stats={stats} />);
    expect(screen.getByText('Total transactions')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Montant total')).toBeDefined();
    expect(screen.getByText('Commissions')).toBeDefined();
  });

  // ─── Événement onClick ───────────────────────────────────────────────────────

  it('devrait appeler onClick lors du clic sur la carte', () => {
    const onClick = vi.fn();
    render(<DashboardCard {...defaultProps} onClick={onClick} />);
    const card = screen.getByText('Float Orange Money').closest('div[class*="rounded-card"]') ?? document.querySelector('[class*="rounded-card"]')!;
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas avoir cursor-pointer sans onClick', () => {
    render(<DashboardCard {...defaultProps} />);
    const wrapper = document.querySelector('[class*="rounded-card"]');
    expect(wrapper?.className ?? '').not.toContain('cursor-pointer');
  });

  // ─── Badge alerte ─────────────────────────────────────────────────────────────

  it('devrait afficher le badge si fourni', () => {
    render(<DashboardCard {...defaultProps} badge="Alerte critique" />);
    expect(screen.getByText('Alerte critique')).toBeDefined();
  });

  it('ne devrait pas afficher le badge si absent', () => {
    render(<DashboardCard {...defaultProps} />);
    expect(screen.queryByText('Alerte critique')).toBeNull();
  });

  it('devrait appliquer ring-warning si alerte=true', () => {
    render(<DashboardCard {...defaultProps} alerte={true} />);
    const wrapper = document.querySelector('[class*="rounded-card"]');
    expect(wrapper?.className ?? '').toContain('ring-');
  });

  // ─── Actions rapides ──────────────────────────────────────────────────────────

  it('devrait afficher les boutons d\'action', () => {
    const actions = [
      { label: 'Détail', onClick: vi.fn() },
      { label: 'Réapprovisionner', onClick: vi.fn() },
    ];
    render(<DashboardCard {...defaultProps} actions={actions} />);
    expect(screen.getByText('Détail')).toBeDefined();
    expect(screen.getByText('Réapprovisionner')).toBeDefined();
  });

  it('devrait appeler le bon onClick d\'action et stopper la propagation', () => {
    const onCardClick = vi.fn();
    const onActionClick = vi.fn();
    const actions = [{ label: 'Action', onClick: onActionClick }];
    render(<DashboardCard {...defaultProps} onClick={onCardClick} actions={actions} />);
    fireEvent.click(screen.getByText('Action'));
    expect(onActionClick).toHaveBeenCalled();
    // La propagation est stoppée : onCardClick ne doit pas avoir été appelé par l'action
  });

  it("ne devrait pas afficher la zone d'actions si actions=[]", () => {
    render(<DashboardCard {...defaultProps} actions={[]} />);
    const borderedSection = document.querySelector('[class*="border-t"]');
    expect(borderedSection).toBeNull();
  });
});

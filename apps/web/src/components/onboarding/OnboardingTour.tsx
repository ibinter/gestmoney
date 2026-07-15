'use client';
// ============================================================
// ONBOARDING TOUR — GESTMONEY
// Visite guidée interactive, adaptée au rôle, avec overlay
// Déclenchée à la première connexion ou depuis l'aide
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, LayoutDashboard, Menu, CreditCard, BarChart2, Settings, Headphones } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';

const TOUR_STORAGE_KEY = 'gestmoney_tour_done';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  titre: string;
  description: string;
  icon: React.ElementType;
  /** Sélecteur CSS de l'élément à mettre en évidence (optionnel) */
  targetSelector?: string;
  /** Position du tooltip par rapport à la cible */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Rôles concernés — vide = tous les rôles */
  roles?: string[];
  /** Action optionnelle */
  actionLabel?: string;
  actionHref?: string;
  color?: string;
}

// ─── Étapes par rôle ─────────────────────────────────────────────────────────

const ALL_STEPS: TourStep[] = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue sur GESTMONEY',
    description: 'Votre plateforme panafricaine de gestion Mobile Money. Cette visite guidée vous présentera les fonctionnalités essentielles en moins de 2 minutes.',
    icon: LayoutDashboard,
    position: 'center',
    color: '#009E00',
  },
  {
    id: 'dashboard',
    titre: 'Tableau de bord',
    description: 'Votre tableau de bord affiche en temps réel les KPI clés : transactions du jour, volumes, alertes et performances. Tout ce dont vous avez besoin d\'un coup d\'œil.',
    icon: LayoutDashboard,
    targetSelector: '[data-tour="dashboard-kpi"]',
    position: 'bottom',
    color: '#009E00',
  },
  {
    id: 'sidebar',
    titre: 'Menu de navigation',
    description: 'Accédez à toutes les sections depuis le menu latéral : Transactions, Agents, Float, Rapports, Commissions... Sur mobile, il se rétracte automatiquement.',
    icon: Menu,
    targetSelector: '[data-tour="sidebar"]',
    position: 'right',
    color: '#FFD000',
  },
  {
    id: 'transaction',
    titre: 'Créer une transaction',
    description: 'Enregistrez dépôts, retraits et transferts Mobile Money en quelques secondes. Sélectionnez l\'opérateur, saisissez le montant et le numéro du client.',
    icon: CreditCard,
    targetSelector: '[data-tour="new-transaction"]',
    position: 'bottom',
    color: '#009E00',
    actionLabel: 'Voir les transactions',
    actionHref: '/dashboard/transactions',
    roles: ['super_admin', 'SUPER_ADMIN', 'admin', 'ADMIN', 'agent', 'AGENT', 'caissier', 'CAISSIER'],
  },
  {
    id: 'rapports',
    titre: 'Rapports & BI',
    description: 'Analysez vos performances avec des graphiques détaillés. Exportez vos rapports en PDF ou Excel en un clic. Les données sont disponibles en temps réel.',
    icon: BarChart2,
    targetSelector: '[data-tour="rapports-link"]',
    position: 'right',
    color: '#009E00',
    actionLabel: 'Voir les rapports',
    actionHref: '/dashboard/rapports',
    roles: ['super_admin', 'SUPER_ADMIN', 'admin', 'ADMIN', 'superviseur', 'SUPERVISEUR', 'VIEWER'],
  },
  {
    id: 'profil',
    titre: 'Paramètres de profil',
    description: 'Personnalisez votre compte : photo, langue (FR/EN), mode sombre, notifications. Sécurisez votre accès avec la double authentification.',
    icon: Settings,
    targetSelector: '[data-tour="profile-menu"]',
    position: 'bottom',
    color: '#111111',
    actionLabel: 'Mon profil',
    actionHref: '/dashboard/profile',
  },
  {
    id: 'support',
    titre: 'Support & Assistant SARA',
    description: 'SARA, notre assistante IA, répond à toutes vos questions 24h/24. Contactez aussi notre équipe de support via le chat ou par email.',
    icon: Headphones,
    targetSelector: '[data-tour="support-btn"]',
    position: 'top',
    color: '#009E00',
    actionLabel: 'Contacter le support',
    actionHref: '/dashboard/support',
  },
];

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function filterStepsByRole(role: string): TourStep[] {
  return ALL_STEPS.filter((s) => !s.roles || s.roles.includes(role));
}

// ─── Tooltip positionné ──────────────────────────────────────────────────────

interface TooltipPos {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  transform?: string;
}

function computeTooltipPos(
  targetRect: DOMRect | null,
  position: TourStep['position'],
  tooltipW = 340,
  tooltipH = 240,
): TooltipPos {
  if (!targetRect || position === 'center') {
    return {
      top: '50%' as unknown as number,
      left: '50%' as unknown as number,
      transform: 'translate(-50%, -50%)',
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 12;
  const pad = 16;

  switch (position) {
    case 'bottom':
      return {
        top: Math.min(targetRect.bottom + gap, vh - tooltipH - pad),
        left: Math.max(pad, Math.min(targetRect.left, vw - tooltipW - pad)),
      };
    case 'top':
      return {
        top: Math.max(pad, targetRect.top - tooltipH - gap),
        left: Math.max(pad, Math.min(targetRect.left, vw - tooltipW - pad)),
      };
    case 'right':
      return {
        top: Math.max(pad, targetRect.top),
        left: Math.min(targetRect.right + gap, vw - tooltipW - pad),
      };
    case 'left':
      return {
        top: Math.max(pad, targetRect.top),
        left: Math.max(pad, targetRect.left - tooltipW - gap),
      };
    default:
      return { top: vh / 2 - tooltipH / 2, left: vw / 2 - tooltipW / 2 };
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface OnboardingTourProps {
  /** Force l'affichage même si déjà vu (depuis Centre d'aide) */
  forceStart?: boolean;
  onClose?: () => void;
}

export function OnboardingTour({ forceStart = false, onClose }: OnboardingTourProps) {
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>();

  const steps = user ? filterStepsByRole(user.role) : ALL_STEPS;
  const step = steps[stepIdx];

  // Déclenchement
  useEffect(() => {
    setMounted(true);
    if (forceStart) {
      setVisible(true);
      setStepIdx(0);
      return;
    }
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [forceStart]);

  // Met à jour la position de l'élément ciblé
  const updateTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      rafRef.current = requestAnimationFrame(() => {
        setTargetRect(el.getBoundingClientRect());
      });
    } else {
      setTargetRect(null);
    }
  }, [step?.targetSelector]);

  useEffect(() => {
    if (visible) updateTarget();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, stepIdx, updateTarget]);

  const fermer = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setVisible(false);
    onClose?.();
  };

  const suivant = () => {
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
    else fermer();
  };

  const precedent = () => setStepIdx((i) => Math.max(0, i - 1));

  if (!mounted || !visible || !step) return null;

  const tooltipPos = computeTooltipPos(targetRect, step.position);
  const StepIcon = step.icon;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === steps.length - 1;
  const progressPct = ((stepIdx + 1) / steps.length) * 100;
  const color = step.color ?? '#009E00';

  return (
    <>
      {/* Overlay semi-transparent */}
      <div
        className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px]"
        onClick={fermer}
        aria-hidden="true"
      />

      {/* Highlight de l'élément ciblé */}
      {targetRect && (
        <div
          className="fixed z-[91] rounded-xl ring-2 ring-offset-2 ring-white/80 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: `0 0 0 4000px rgba(0,0,0,0.45)`,
          }}
        />
      )}

      {/* Tooltip / Carte */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Visite guidée — Étape ${stepIdx + 1}`}
        className="fixed z-[92] w-[min(340px,calc(100vw-32px))] bg-white dark:bg-[hsl(0_0%_10%)] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden pointer-events-auto"
        style={tooltipPos as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de progression */}
        <div className="h-1 bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: color }}
          />
        </div>

        {/* Corps */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + '18' }}
              >
                <StepIcon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {stepIdx + 1} / {steps.length}
                </p>
                <h2 className="text-sm font-bold text-text-main leading-tight">{step.titre}</h2>
              </div>
            </div>
            <button
              onClick={fermer}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08 flex-shrink-0"
              aria-label="Fermer la visite"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>

          {/* Action optionnelle */}
          {step.actionLabel && step.actionHref && (
            <a
              href={step.actionHref}
              onClick={fermer}
              className="inline-block mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-text-main hover:bg-gray-50 dark:hover:bg-white/05 transition-colors"
            >
              {step.actionLabel} →
            </a>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                i === stepIdx ? 'w-5' : 'w-1.5 bg-gray-200 dark:bg-white/20'
              )}
              style={i === stepIdx ? { backgroundColor: color } : {}}
              aria-label={`Aller à l'étape ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-gray-100 dark:border-white/08 mt-3">
          <div>
            {!isFirst && (
              <button
                onClick={precedent}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-text-main transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fermer}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08"
            >
              Ignorer
            </button>
            <button
              onClick={suivant}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-all active:scale-95"
              style={{ backgroundColor: color === '#FFD000' ? '#111' : color }}
            >
              {isLast ? 'Terminer' : 'Suivant'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook utilitaire pour déclencher/réinitialiser le tour
export function useOnboardingTour() {
  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
  };
  const isCompleted = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  };
  return { reset, isCompleted };
}

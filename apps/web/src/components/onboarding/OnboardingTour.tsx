'use client';
// ============================================================
// ONBOARDING TOUR — GESTMONEY
// Visite guidée interactive de l'application.
//
// Principes :
//  • Chaque étape pointe une ancre `data-tour="…"` réellement posée dans le DOM.
//  • Une étape dont l'ancre est absente (page non visible pour ce rôle,
//    module masqué…) est AUTOMATIQUEMENT SAUTÉE : la visite ne bloque jamais.
//  • Le fait d'avoir terminé la visite est mémorisé (localStorage), elle ne se
//    relance donc pas à chaque connexion. Le bouton « Relancer la visite »
//    du Guide utilisateur la redémarre à la demande (prop `forceStart`).
// ============================================================
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, LayoutDashboard, Menu, CreditCard, BarChart2,
  Settings, Bell, Wallet, Users, Building2, Banknote, BookOpen, ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';

/** Versionné : incrémenter le suffixe rejoue la visite pour tout le monde. */
const TOUR_STORAGE_KEY = 'gestmoney_tour_done_v2';

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
  /** Action optionnelle */
  actionLabel?: string;
  actionHref?: string;
  color?: string;
}

// ─── Étapes ──────────────────────────────────────────────────────────────────
// Aucune étape n'est filtrée par rôle : la présence de l'ancre dans le DOM
// fait déjà office de filtre (la sidebar n'affiche que les entrées permises).

const ALL_STEPS: TourStep[] = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue sur GESTMONEY',
    description:
      "Prenons deux minutes pour faire le tour. Vous ne verrez ici que les écrans auxquels votre compte a accès — les autres sont automatiquement passés.",
    icon: LayoutDashboard,
    position: 'center',
    color: '#009E00',
  },
  {
    id: 'dashboard',
    titre: 'Votre tableau de bord',
    description:
      "C'est votre point de départ à chaque connexion : opérations du jour, volumes, float et alertes. Le contenu change selon votre rôle (administrateur, gérant, agent ou auditeur).",
    icon: LayoutDashboard,
    targetSelector: '[data-tour="dashboard-kpi"]',
    position: 'bottom',
    color: '#009E00',
  },
  {
    id: 'sidebar',
    titre: 'Le menu de gauche',
    description:
      "Tous les modules sont ici, regroupés par thème. Sur téléphone, il s'ouvre avec le bouton menu en haut à gauche. Les pastilles de couleur signalent ce qui demande votre attention.",
    icon: Menu,
    targetSelector: '[data-tour="sidebar"]',
    position: 'right',
    color: '#FFD000',
  },
  {
    id: 'nouvelle-transaction',
    titre: 'Enregistrer une opération',
    description:
      "Ce bouton ouvre directement la saisie d'un dépôt, d'un retrait, d'un cash in ou d'un cash out. Opérateur et montant suffisent ; le nom et le numéro du client sont facultatifs.",
    icon: CreditCard,
    targetSelector: '[data-tour="new-transaction"]',
    position: 'bottom',
    color: '#009E00',
  },
  {
    id: 'transactions',
    titre: 'Le journal des transactions',
    description:
      "Toutes vos opérations, filtrables par date, type, opérateur, statut ou agent. C'est ici qu'un gérant valide les opérations restées « En attente », et qu'on exporte le journal en CSV.",
    icon: CreditCard,
    targetSelector: '[data-tour="nav-transactions"]',
    position: 'right',
    color: '#009E00',
    actionLabel: 'Ouvrir les transactions',
    actionHref: '/dashboard/transactions',
  },
  {
    id: 'float',
    titre: 'Le float opérateurs',
    description:
      "Votre solde chez chaque opérateur, en temps réel, avec son seuil d'alerte. Quand une jauge passe au rouge, demandez un réapprovisionnement depuis cette page.",
    icon: Wallet,
    targetSelector: '[data-tour="nav-float"]',
    position: 'right',
    color: '#F59E0B',
    actionLabel: 'Ouvrir le float',
    actionHref: '/dashboard/float',
  },
  {
    id: 'caisse',
    titre: 'La caisse',
    description:
      "Le journal des espèces : entrées, sorties et écart de caisse du jour. C'est le contrôle à faire chaque soir avant de fermer le point de vente.",
    icon: Banknote,
    targetSelector: '[data-tour="nav-caisse"]',
    position: 'right',
    color: '#10B981',
    actionLabel: 'Ouvrir la caisse',
    actionHref: '/dashboard/caisse',
  },
  {
    id: 'agents',
    titre: 'Vos agents et vos agences',
    description:
      "Créez vos points de vente, puis rattachez-y vos agents. Chaque agent reçoit un mot de passe temporaire que vous lui remettez à la création de son compte.",
    icon: Users,
    targetSelector: '[data-tour="nav-agents"]',
    position: 'right',
    color: '#3B82F6',
    actionLabel: 'Ouvrir les agents',
    actionHref: '/dashboard/agents',
  },
  {
    id: 'agences',
    titre: 'Le réseau d’agences',
    description:
      "La vue carte de votre réseau : agences actives, agents rattachés, villes couvertes. Une agence se désactive sans être supprimée, son historique reste intact.",
    icon: Building2,
    targetSelector: '[data-tour="nav-agences"]',
    position: 'right',
    color: '#EC4899',
    actionLabel: 'Ouvrir les agences',
    actionHref: '/dashboard/agences',
  },
  {
    id: 'rapports',
    titre: 'Rapports & BI',
    description:
      "Les chiffres consolidés de votre réseau, avec export CSV, XLSX et PDF. C'est ce que vous transmettez à votre direction ou à votre comptable.",
    icon: BarChart2,
    targetSelector: '[data-tour="rapports-link"]',
    position: 'bottom',
    color: '#009E00',
    actionLabel: 'Voir les rapports',
    actionHref: '/dashboard/rapports',
  },
  {
    id: 'comptabilite',
    titre: 'Comptabilité SYSCOHADA',
    description:
      "Grand livre, balance, compte de résultat et bilan sont générés automatiquement à partir de vos opérations, dans le plan comptable SYSCOHADA.",
    icon: BookOpen,
    targetSelector: '[data-tour="nav-comptabilite"]',
    position: 'right',
    color: '#6366F1',
    actionLabel: 'Ouvrir la comptabilité',
    actionHref: '/dashboard/comptabilite',
  },
  {
    id: 'audit',
    titre: 'Audit & surveillance',
    description:
      "Le journal de tout ce qui est fait dans la plateforme, plus un signalement des comptes dont le volume d'actions sort de l'ordinaire. C'est une invitation à vérifier, pas une accusation.",
    icon: ShieldCheck,
    targetSelector: '[data-tour="nav-ia-fraude"]',
    position: 'right',
    color: '#8B5CF6',
    actionLabel: 'Ouvrir la surveillance',
    actionHref: '/dashboard/ia-fraude',
  },
  {
    id: 'notifications',
    titre: 'Vos notifications',
    description:
      "La cloche regroupe les alertes float, les opérations à valider et les messages du système. Le compteur rouge indique ce qui n'a pas encore été lu.",
    icon: Bell,
    targetSelector: '[data-tour="notifications-btn"]',
    position: 'bottom',
    color: '#EF4444',
    actionLabel: 'Voir les notifications',
    actionHref: '/dashboard/notifications',
  },
  {
    id: 'profil',
    titre: 'Votre compte',
    description:
      "Depuis votre avatar : profil, langue (français / anglais), mode sombre et déconnexion. Les paramètres de sécurité se trouvent dans Paramètres → Sécurité.",
    icon: Settings,
    targetSelector: '[data-tour="profile-menu"]',
    position: 'left',
    color: '#111111',
    actionLabel: 'Mon profil',
    actionHref: '/dashboard/profile',
  },
  {
    id: 'fin',
    titre: 'C’est tout pour l’essentiel',
    description:
      "Le Guide utilisateur détaille chaque module pas à pas, et vous pouvez relancer cette visite à tout moment depuis son bouton « Relancer la visite ».",
    icon: BookOpen,
    position: 'center',
    color: '#009E00',
    actionLabel: 'Ouvrir le guide',
    actionHref: '/dashboard/guide',
  },
];

// ─── Résolution des ancres ───────────────────────────────────────────────────

/**
 * Retourne le premier élément VISIBLE correspondant au sélecteur.
 * La sidebar est rendue deux fois (fixe desktop + overlay mobile) : sans ce
 * filtre, on mettrait en évidence la copie masquée, hors de l'écran.
 */
function trouverCibleVisible(selecteur: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const candidats = Array.from(document.querySelectorAll<HTMLElement>(selecteur));
  for (const el of candidats) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && el.offsetParent !== null) return el;
  }
  return null;
}

/** Une étape est retenue si elle n'a pas d'ancre, ou si son ancre est visible. */
function etapesDisponibles(): TourStep[] {
  return ALL_STEPS.filter(
    (s) => !s.targetSelector || trouverCibleVisible(s.targetSelector) !== null,
  );
}

// ─── Tooltip positionné ──────────────────────────────────────────────────────

interface TooltipPos {
  top?: number | string;
  left?: number | string;
  transform?: string;
}

function computeTooltipPos(
  targetRect: DOMRect | null,
  position: TourStep['position'],
  tooltipW = 340,
  tooltipH = 250,
): TooltipPos {
  if (!targetRect || position === 'center') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 12;
  const pad = 16;
  const clampX = (x: number) => Math.max(pad, Math.min(x, vw - tooltipW - pad));
  const clampY = (y: number) => Math.max(pad, Math.min(y, vh - tooltipH - pad));

  // Sur petit écran, on ne tente pas de placer à gauche/droite : la carte
  // occupe presque toute la largeur, elle irait hors champ.
  const etroit = vw < 720;
  const pos = etroit && (position === 'left' || position === 'right') ? 'bottom' : position;

  switch (pos) {
    case 'bottom':
      return { top: clampY(targetRect.bottom + gap), left: clampX(targetRect.left) };
    case 'top':
      return { top: clampY(targetRect.top - tooltipH - gap), left: clampX(targetRect.left) };
    case 'right':
      return { top: clampY(targetRect.top), left: clampX(targetRect.right + gap) };
    case 'left':
      return { top: clampY(targetRect.top), left: clampX(targetRect.left - tooltipW - gap) };
    default:
      return { top: clampY(vh / 2 - tooltipH / 2), left: clampX(vw / 2 - tooltipW / 2) };
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface OnboardingTourProps {
  /** Force l'affichage même si la visite a déjà été faite (bouton « Relancer »). */
  forceStart?: boolean;
  onClose?: () => void;
}

export function OnboardingTour({ forceStart = false, onClose }: OnboardingTourProps) {
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  /** Recalculé à chaque ouverture : les ancres dépendent de la page et du rôle. */
  const [steps, setSteps] = useState<TourStep[]>([ALL_STEPS[0]]);
  const rafRef = useRef<number>();

  const step: TourStep | undefined = steps[stepIdx];

  const ouvrir = useCallback(() => {
    setSteps(etapesDisponibles());
    setStepIdx(0);
    setVisible(true);
  }, []);

  // Déclenchement
  useEffect(() => {
    setMounted(true);
    if (forceStart) {
      // Laisse le temps au DOM de la page de se peindre avant de lire les ancres.
      const t = setTimeout(ouvrir, 150);
      return () => clearTimeout(t);
    }
    let done = false;
    try {
      done = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    } catch {
      done = true; // storage indisponible : on n'importune pas l'utilisateur
    }
    if (!done) {
      const timer = setTimeout(ouvrir, 1200);
      return () => clearTimeout(timer);
    }
  }, [forceStart, ouvrir]);

  // Met à jour la position de l'élément ciblé
  const updateTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = trouverCibleVisible(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    rafRef.current = requestAnimationFrame(() => {
      setTargetRect(el.getBoundingClientRect());
    });
  }, [step?.targetSelector]);

  useEffect(() => {
    if (!visible) return;
    updateTarget();
    const onResize = () => updateTarget();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, stepIdx, updateTarget]);

  const fermer = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch { /* storage indisponible : sans conséquence */ }
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const suivant = useCallback(() => {
    setStepIdx((i) => {
      if (i < steps.length - 1) return i + 1;
      fermer();
      return i;
    });
  }, [steps.length, fermer]);

  const precedent = useCallback(() => setStepIdx((i) => Math.max(0, i - 1)), []);

  // Clavier : ← → pour naviguer, Échap pour quitter.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      else if (e.key === 'ArrowRight') suivant();
      else if (e.key === 'ArrowLeft') precedent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, fermer, suivant, precedent]);

  const tooltipPos = useMemo(
    () => computeTooltipPos(targetRect, step?.position),
    [targetRect, step?.position],
  );

  if (!mounted || !visible || !step) return null;
  // `user` n'est pas utilisé pour filtrer (la présence des ancres suffit) mais
  // reste lu pour que le tour se remonte proprement au changement de compte.
  void user;

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
            boxShadow: '0 0 0 4000px rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* Tooltip / Carte */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Visite guidée — Étape ${stepIdx + 1} sur ${steps.length}`}
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

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {step.description}
          </p>

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
        <div className="flex justify-center gap-1.5 pb-1 flex-wrap px-4">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIdx(i)}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                i === stepIdx ? 'w-5' : 'w-1.5 bg-gray-200 dark:bg-white/20',
              )}
              style={i === stepIdx ? { backgroundColor: color } : {}}
              aria-label={`Aller à l'étape ${i + 1} : ${s.titre}`}
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
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch { /* sans conséquence */ }
  };
  const isCompleted = () => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  };
  return { reset, isCompleted };
}

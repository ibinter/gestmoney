'use client';
// ============================================================
// ONBOARDING CHECKLIST — GESTMONEY
// Checklist visible dans le dashboard pour les nouveaux comptes
// Sauvegardée en localStorage — se masque quand tout est coché
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  User, Building2, UserPlus, CreditCard, BarChart2, Settings, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const STORAGE_KEY = 'gestmoney_onboarding_checklist';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const ITEMS: ChecklistItem[] = [
  { id: 'profile',      label: 'Compléter le profil',            description: 'Renseignez votre photo et vos coordonnées',       href: '/dashboard/profile',     icon: User },
  { id: 'company',      label: 'Paramétrer la société',          description: 'Configurez le nom, le logo et les opérateurs',    href: '/dashboard/settings',    icon: Building2 },
  { id: 'agence',       label: 'Créer une première agence',      description: 'Ajoutez votre premier point de vente',            href: '/dashboard/agences',     icon: Building2 },
  { id: 'agent',        label: 'Ajouter un agent',               description: 'Invitez un agent à rejoindre votre réseau',      href: '/dashboard/agents',      icon: UserPlus },
  { id: 'transaction',  label: 'Effectuer une transaction test', description: 'Enregistrez votre première opération Mobile Money', href: '/dashboard/transactions', icon: CreditCard },
  { id: 'commissions',  label: 'Configurer les commissions',     description: 'Définissez les taux pour chaque opérateur',      href: '/dashboard/commissions', icon: Settings },
  { id: 'rapports',     label: 'Voir les rapports',              description: 'Explorez vos tableaux de bord et exports',       href: '/dashboard/rapports',    icon: BarChart2 },
];

function loadState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* silencieux */ }
}

const DISMISS_KEY = 'gestmoney_onboarding_checklist_dismissed';

interface OnboardingChecklistProps {
  /** Force l'affichage même si déjà terminé (utile pour la démo) */
  forceVisible?: boolean;
}

export function OnboardingChecklist({ forceVisible = false }: OnboardingChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChecked(loadState());
    const isDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    setDismissed(isDismissed);
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveState(next);
      return next;
    });
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  if (!mounted) return null;

  const completedCount = ITEMS.filter((i) => checked[i.id]).length;
  const totalCount = ITEMS.length;
  const allDone = completedCount === totalCount;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  // Se masque si tout est coché ou si l'utilisateur a fermé
  if ((dismissed || allDone) && !forceVisible) return null;

  return (
    <div className="bg-white dark:bg-[hsl(0_0%_12%)] rounded-card shadow-card border border-gray-100 dark:border-white/08 overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/08">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#009E00]/10 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-[#009E00]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main">Guide de démarrage</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedCount} / {totalCount} étapes complétées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/08 transition-colors"
            aria-label={collapsed ? 'Développer' : 'Réduire'}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/08 transition-colors"
            aria-label="Masquer la checklist"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-white/08">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Progression</span>
          <span className="text-xs font-semibold text-[#009E00]">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#009E00] to-[#00c500] transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Liste des items */}
      {!collapsed && (
        <ul className="divide-y divide-gray-50 dark:divide-white/05">
          {ITEMS.map((item) => {
            const isDone = !!checked[item.id];
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/03 transition-colors group">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(item.id)}
                    className={clsx(
                      'flex-shrink-0 transition-colors',
                      isDone ? 'text-[#009E00]' : 'text-gray-300 dark:text-white/20 hover:text-gray-400',
                    )}
                    aria-label={isDone ? `Décocher : ${item.label}` : `Cocher : ${item.label}`}
                  >
                    {isDone
                      ? <CheckCircle2 size={20} />
                      : <Circle size={20} />
                    }
                  </button>

                  {/* Icône */}
                  <div className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    isDone ? 'bg-[#009E00]/10' : 'bg-gray-100 dark:bg-white/08',
                  )}>
                    <Icon size={14} className={isDone ? 'text-[#009E00]' : 'text-gray-400'} />
                  </div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm font-medium leading-tight',
                      isDone ? 'text-gray-400 line-through' : 'text-text-main',
                    )}>
                      {item.label}
                    </p>
                    {!isDone && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>

                  {/* Lien */}
                  {!isDone && (
                    <a
                      href={item.href}
                      className="text-xs font-medium text-[#009E00] hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      Faire →
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Hook utilitaire pour réinitialiser la checklist
export function useOnboardingChecklist() {
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISMISS_KEY);
  };
  const markDone = (id: string) => {
    const state = loadState();
    state[id] = true;
    saveState(state);
  };
  return { reset, markDone };
}

'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Building2, UserPlus, Zap, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

const STORAGE_KEY = 'gestmoney-onboarded';

// ─── Étapes du wizard ──────────────────────────────────────────────────────
const ETAPES = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue sur GESTMONEY',
    description: 'La plateforme panafricaine de gestion Mobile Money. Découvrez comment configurer votre espace en quelques minutes.',
    icone: Zap,
    couleur: '#009E00',
    action: null,
    actionLabel: null,
    contenu: BienvenueContenu,
  },
  {
    id: 'operateur',
    titre: 'Configurer vos opérateurs',
    description: 'Activez les réseaux Mobile Money que vous utilisez : Orange Money, Wave, MTN MoMo, Moov...',
    icone: Building2,
    couleur: '#FFD000',
    action: '/dashboard/settings',
    actionLabel: 'Configurer maintenant',
    contenu: OperateurContenu,
  },
  {
    id: 'agent',
    titre: 'Créer votre premier agent',
    description: 'Ajoutez vos agents de terrain pour commencer à tracer les transactions et gérer votre réseau.',
    icone: UserPlus,
    couleur: '#3B82F6',
    action: '/dashboard/agents',
    actionLabel: 'Ajouter un agent',
    contenu: AgentContenu,
  },
  {
    id: 'termine',
    titre: 'Vous êtes prêt !',
    description: 'Votre espace GESTMONEY est configuré. Explorez le tableau de bord et découvrez toutes les fonctionnalités.',
    icone: CheckCircle2,
    couleur: '#009E00',
    action: '/dashboard',
    actionLabel: 'Aller au tableau de bord',
    contenu: TermineContenu,
  },
] as const;

// ─── Contenus par étape ────────────────────────────────────────────────────

function BienvenueContenu() {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {[
        { emoji: '📊', label: 'Tableaux de bord temps réel' },
        { emoji: '💳', label: 'Suivi des transactions' },
        { emoji: '👥', label: 'Gestion du réseau d\'agents' },
        { emoji: '📈', label: 'Rapports & Business Intelligence' },
        { emoji: '🔔', label: 'Alertes intelligentes' },
        { emoji: '🌙', label: 'Mode sombre intégré' },
      ].map((f) => (
        <div key={f.label} className="flex items-center gap-2.5 bg-white dark:bg-white/05 rounded-xl p-2.5 border border-gray-100 dark:border-white/08">
          <span className="text-xl">{f.emoji}</span>
          <span className="text-xs text-text-main font-medium leading-tight">{f.label}</span>
        </div>
      ))}
    </div>
  );
}

function OperateurContenu() {
  const OPERATEURS = [
    { nom: 'Orange Money', logo: '🟠', pays: 'CI, SN, CM, ML, BF...' },
    { nom: 'Wave',         logo: '🌊', pays: 'CI, SN' },
    { nom: 'MTN MoMo',    logo: '🟡', pays: 'GH, CM, BJ, UG...' },
    { nom: 'Moov Money',  logo: '🔵', pays: 'BJ, TG, CI, BF...' },
    { nom: 'Airtel Money', logo: '❤️', pays: 'KE, TZ, NG, ZM...' },
    { nom: 'Flooz',       logo: '💜', pays: 'TG, BJ' },
  ];
  return (
    <div className="space-y-2 mt-4">
      {OPERATEURS.map((op) => (
        <div key={op.nom} className="flex items-center gap-3 bg-white dark:bg-white/05 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-white/08">
          <span className="text-xl w-7 text-center">{op.logo}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-main">{op.nom}</p>
            <p className="text-xs text-text-muted truncate">{op.pays}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/20" />
        </div>
      ))}
    </div>
  );
}

function AgentContenu() {
  return (
    <div className="mt-4 space-y-3">
      {[
        { etape: '1', texte: 'Rendez-vous dans Agents > Ajouter un agent', done: false },
        { etape: '2', texte: 'Renseignez le nom, le téléphone et l\'agence', done: false },
        { etape: '3', texte: 'L\'agent reçoit ses identifiants par SMS', done: false },
        { etape: '4', texte: 'Il peut commencer à enregistrer des transactions', done: false },
      ].map((s) => (
        <div key={s.etape} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {s.etape}
          </div>
          <p className="text-sm text-text-main leading-snug">{s.texte}</p>
        </div>
      ))}
    </div>
  );
}

function TermineContenu() {
  return (
    <div className="mt-4 space-y-3">
      <div className="bg-[#009E00]/08 border border-[#009E00]/20 rounded-xl p-4 text-center">
        <p className="text-4xl mb-2">🎉</p>
        <p className="text-sm text-text-main font-semibold">Compte configuré avec succès</p>
        <p className="text-xs text-text-muted mt-1">Vous pouvez relancer ce guide à tout moment depuis Paramètres &gt; Guide de démarrage</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { emoji: '⌘K', label: 'Navigation rapide' },
          { emoji: '🌙', label: 'Mode sombre' },
          { emoji: '📥', label: 'Export PDF/XLSX' },
        ].map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/05 rounded-xl p-2.5 border border-gray-100 dark:border-white/08">
            <p className="text-lg font-mono font-bold text-text-main">{t.emoji}</p>
            <p className="text-[10px] text-text-muted mt-1 leading-tight">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [etapeIdx, setEtapeIdx] = useState(0);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Petit délai pour laisser la page se charger
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const fermer = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const suivant = () => {
    if (etapeIdx < ETAPES.length - 1) {
      setEtapeIdx((i) => i + 1);
    } else {
      fermer();
    }
  };

  const precedent = () => setEtapeIdx((i) => Math.max(0, i - 1));

  const allerAction = (href: string) => {
    fermer();
    router.push(href);
  };

  if (!visible) return null;

  const etape = ETAPES[etapeIdx];
  const Icone = etape.icone;
  const ContenuComp = etape.contenu;
  const estDerniere = etapeIdx === ETAPES.length - 1;

  // Titres/descriptions traduits par ID d'étape
  const stepKeys = ['bienvenue', 'operateur', 'agent', 'termine'] as const;
  const stepTranslations = t.onboarding.steps;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] animate-in fade-in duration-200"
        onClick={fermer}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Guide de démarrage GESTMONEY"
        className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-surface dark:bg-[hsl(0_0%_10%)] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barre de progression */}
          <div className="h-1 bg-gray-100 dark:bg-white/10">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${((etapeIdx + 1) / ETAPES.length) * 100}%`,
                backgroundColor: etape.couleur,
              }}
            />
          </div>

          {/* Corps */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: etape.couleur + '18' }}
                >
                  <Icone size={20} style={{ color: etape.couleur }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                    {t.onboarding.step} {etapeIdx + 1} {t.onboarding.of} {ETAPES.length}
                  </p>
                  <h2 className="text-base font-bold text-text-main leading-tight mt-0.5">
                    {stepTranslations[stepKeys[etapeIdx]]?.titre ?? etape.titre}
                  </h2>
                </div>
              </div>
              <button
                onClick={fermer}
                className="text-gray-400 hover:text-text-main transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08 flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-text-muted leading-relaxed">{stepTranslations[stepKeys[etapeIdx]]?.description ?? etape.description}</p>

            {/* Contenu spécifique à l'étape */}
            <ContenuComp />
          </div>

          {/* Indicateurs d'étape (dots) */}
          <div className="flex justify-center gap-1.5 pb-1">
            {ETAPES.map((_, i) => (
              <button
                key={i}
                onClick={() => setEtapeIdx(i)}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === etapeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-gray-200 dark:bg-white/20'
                )}
                aria-label={`Aller à l'étape ${i + 1}`}
              />
            ))}
          </div>

          {/* Pied : boutons */}
          <div className="px-6 pb-6 pt-4 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-white/08 mt-4">
            <div className="flex gap-2">
              {etapeIdx > 0 && (
                <button
                  onClick={precedent}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/08"
                >
                  <ChevronLeft size={15} />
                  {t.onboarding.back}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {etape.action && !estDerniere && (
                <button
                  onClick={() => allerAction(etape.action!)}
                  className="text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-text-main hover:bg-gray-50 dark:hover:bg-white/05 transition-colors"
                >
                  {etape.actionLabel}
                </button>
              )}
              <button
                onClick={estDerniere && etape.action ? () => allerAction(etape.action!) : suivant}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all shadow-sm active:scale-95"
                style={{ backgroundColor: etape.couleur === '#FFD000' ? '#111' : etape.couleur }}
              >
                {estDerniere
                  ? (stepTranslations[stepKeys[etapeIdx]]?.actionLabel ?? t.onboarding.finish)
                  : t.onboarding.next}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook utilitaire pour rouvrir le wizard depuis les paramètres
export function useOnboarding() {
  const reset = () => localStorage.removeItem(STORAGE_KEY);
  return { reset };
}

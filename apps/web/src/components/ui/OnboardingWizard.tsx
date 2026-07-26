'use client';
// ============================================================
// ONBOARDING WIZARD — GESTMONEY
// Wizard 5 étapes, modal plein écran, progression visuelle.
// Affiché à la 1ère connexion si onboarding non terminé.
// Accessible depuis /dashboard/onboarding.
// Peut être fermé ("Faire ça plus tard") et rouvert.
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingEtat {
  etape1: boolean;
  etape2: boolean;
  etape3: boolean;
  etape4: boolean;
  etape5: boolean;
  termine: boolean;
  completees: number;
  total: number;
}

interface Etape {
  icone: string;
  titre: string;
  description: string;
  cta: string;
  href: string;
  ctaLabel: string;
}

// ─── Définition des étapes ────────────────────────────────────────────────────

const ETAPES: Etape[] = [
  {
    icone: '🏢',
    titre: 'Complétez votre profil',
    description: 'Ajoutez votre logo, vos coordonnées et vos informations légales pour personnaliser votre espace GESTMONEY.',
    cta: 'Aller au profil',
    href: '/dashboard/profile',
    ctaLabel: 'Compléter le profil',
  },
  {
    icone: '🏪',
    titre: 'Créez votre première agence',
    description: 'Votre réseau Mobile Money commence avec une agence. Renseignez le nom, la ville et le code de votre premier point de vente.',
    cta: 'Créer une agence',
    href: '/dashboard/agences',
    ctaLabel: 'Créer une agence',
  },
  {
    icone: '👤',
    titre: 'Ajoutez votre premier agent',
    description: 'Affectez un agent à votre agence. Il recevra ses identifiants et pourra commencer à enregistrer des opérations.',
    cta: 'Ajouter un agent',
    href: '/dashboard/agents',
    ctaLabel: 'Ajouter un agent',
  },
  {
    icone: '📱',
    titre: 'Configurez vos opérateurs',
    description: 'Sélectionnez Orange Money, MTN MoMo, Wave et les autres opérateurs disponibles dans votre zone. Définissez vos seuils de float.',
    cta: 'Configurer les opérateurs',
    href: '/dashboard/operateurs',
    ctaLabel: 'Configurer maintenant',
  },
  {
    icone: '💳',
    titre: 'Enregistrez votre première transaction',
    description: 'Vous êtes prêt ! Essayez un dépôt test pour vous familiariser avec le journal des opérations.',
    cta: 'Faire une transaction',
    href: '/dashboard/transactions',
    ctaLabel: 'Commencer',
  },
];

// ─── Confetti CSS pur ─────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#009E00', '#FFD000', '#FF6B00', '#3B82F6', '#EC4899', '#10B981'];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 6}px`,
    duration: `${1.5 + Math.random() * 1}s`,
  }));

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        pointerEvents: 'none', zIndex: 0,
      }}
    >
      <style>{`
        @keyframes gm-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `gm-confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Écran de félicitations ───────────────────────────────────────────────────

function Felicitations({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div style={{ position: 'relative', textAlign: 'center', padding: '40px 32px' }}>
      <Confetti />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🎉</div>
        <h2 style={{
          fontSize: 24, fontWeight: 800, color: 'var(--gm-text, #111)',
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Votre réseau GESTMONEY est prêt !
        </h2>
        <p style={{
          fontSize: 15, color: 'var(--gm-text-2, #6b7280)',
          marginBottom: 32, maxWidth: 380, margin: '0 auto 32px',
        }}>
          Félicitations ! Vous avez complété toutes les étapes de configuration.
          Votre réseau Mobile Money peut maintenant opérer.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { onClose(); router.push('/dashboard'); }}
            style={{
              padding: '12px 28px', borderRadius: 12,
              background: 'var(--gm-primary, #009E00)', color: '#fff',
              fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Aller au tableau de bord
          </button>
          <button
            onClick={() => { onClose(); router.push('/dashboard/guide'); }}
            style={{
              padding: '12px 28px', borderRadius: 12,
              background: 'transparent', color: 'var(--gm-text, #111)',
              fontWeight: 600, fontSize: 14,
              border: '1.5px solid var(--gm-border, #e5e7eb)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Voir le guide utilisateur
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────────────

function BarreProgression({ total, actif }: { total: number; actif: number }) {
  return (
    <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--gm-border, #e5e7eb)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gm-text-2, #6b7280)' }}>
          Étape {actif + 1} sur {total}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gm-primary, #009E00)' }}>
          {Math.round(((actif + 1) / total) * 100)}%
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 99,
        background: 'var(--gm-bg-subtle, #f3f4f6)',
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #009E00, #00c500)',
          width: `${((actif + 1) / total) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      {/* Pastilles numérotées */}
      <div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 99,
              background: i <= actif ? 'var(--gm-primary, #009E00)' : 'var(--gm-bg-subtle, #e5e7eb)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Carte d'une étape ────────────────────────────────────────────────────────

function CarteEtape({
  etape,
  index,
  total,
  onNext,
  onPrev,
  onSkip,
}: {
  etape: Etape;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div style={{ padding: '32px 28px' }}>
      {/* Icône */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--gm-primary-subtle, #f0fdf0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 20,
      }}>
        {etape.icone}
      </div>

      {/* Titre */}
      <h2 style={{
        fontSize: 20, fontWeight: 800,
        color: 'var(--gm-text, #111)',
        marginBottom: 10, lineHeight: 1.3,
      }}>
        {etape.titre}
      </h2>

      {/* Description */}
      <p style={{
        fontSize: 14, color: 'var(--gm-text-2, #6b7280)',
        lineHeight: 1.6, marginBottom: 28,
      }}>
        {etape.description}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => { router.push(etape.href); onNext(); }}
          style={{
            padding: '13px 20px', borderRadius: 12,
            background: 'var(--gm-primary, #009E00)', color: '#fff',
            fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          {etape.ctaLabel} →
        </button>

        <button
          onClick={onSkip}
          style={{
            padding: '10px 20px', borderRadius: 12,
            background: 'transparent', color: 'var(--gm-text-2, #9ca3af)',
            fontWeight: 500, fontSize: 13, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          Passer cette étape →
        </button>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 28,
        paddingTop: 20, borderTop: '1px solid var(--gm-border, #e5e7eb)',
      }}>
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            padding: '8px 16px', borderRadius: 10,
            background: 'transparent',
            color: isFirst ? 'var(--gm-text-3, #d1d5db)' : 'var(--gm-text-2, #6b7280)',
            fontWeight: 500, fontSize: 13,
            border: '1.5px solid ' + (isFirst ? 'var(--gm-border, #e5e7eb)' : 'var(--gm-border, #d1d5db)'),
            cursor: isFirst ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Précédent
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '8px 20px', borderRadius: 10,
            background: 'var(--gm-primary, #009E00)', color: '#fff',
            fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {isLast ? 'Terminer ✓' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

// ─── Hook d'état onboarding ───────────────────────────────────────────────────

const STORAGE_DISMISSED = 'gestmoney_onboarding_wizard_dismissed';

export function useOnboardingWizard() {
  const [etat, setEtat] = useState<OnboardingEtat | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const fetchEtat = useCallback(async () => {
    try {
      const res = await api.get<OnboardingEtat>('/onboarding');
      const data = res.data;
      setEtat(data);
      // Afficher si non terminé et non masqué par l'utilisateur
      const dismissed = typeof window !== 'undefined' && localStorage.getItem(STORAGE_DISMISSED) === 'true';
      if (!data.termine && !dismissed) {
        setVisible(true);
      }
    } catch {
      // Pas de backend accessible : pas de wizard bloquant
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEtat();
  }, [fetchEtat]);

  const marquerEtape = useCallback(async (etape: string) => {
    try {
      const res = await api.post<OnboardingEtat>(`/onboarding/marquer/${etape}`);
      setEtat(res.data);
    } catch { /* non bloquant */ }
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DISMISSED, 'true');
    }
    setVisible(false);
  }, []);

  const open = useCallback(() => setVisible(true), []);

  return { etat, loading, visible, open, dismiss, marquerEtape, refetch: fetchEtat };
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface OnboardingWizardProps {
  /** Si true : affiche le wizard même si terminé (mode démo ou page dédiée). */
  forceVisible?: boolean;
  onClose?: () => void;
}

export function OnboardingWizard({ forceVisible = false, onClose }: OnboardingWizardProps) {
  const { etat, visible, dismiss } = useOnboardingWizard();
  const [etapeActuelle, setEtapeActuelle] = useState(0);
  const [termine, setTermine] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Positionner sur la première étape non complétée
  useEffect(() => {
    if (!etat) return;
    const keys: (keyof OnboardingEtat)[] = ['etape1', 'etape2', 'etape3', 'etape4', 'etape5'];
    const idx = keys.findIndex((k) => !etat[k]);
    setEtapeActuelle(idx === -1 ? ETAPES.length - 1 : idx);
  }, [etat]);

  if (!mounted) return null;
  if (!forceVisible && !visible) return null;

  const fermer = () => {
    dismiss();
    onClose?.();
  };

  const allerEtape = (i: number) => {
    if (i >= ETAPES.length) {
      setTermine(true);
    } else {
      setEtapeActuelle(Math.max(0, Math.min(i, ETAPES.length - 1)));
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={fermer}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Assistant de démarrage GESTMONEY"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', zIndex: 201,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'var(--gm-surface, #fff)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          border: '1px solid var(--gm-border, #e5e7eb)',
        }}
      >
        {/* En-tête */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--gm-primary, #009E00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gm-text-2, #9ca3af)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                GESTMONEY
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gm-text, #111)', lineHeight: 1 }}>
                Guide de démarrage
              </div>
            </div>
          </div>
          <button
            onClick={fermer}
            aria-label="Fermer le wizard"
            title="Faire ça plus tard"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--gm-bg-subtle, #f3f4f6)',
              cursor: 'pointer', fontSize: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--gm-text-2, #6b7280)',
            }}
          >
            ×
          </button>
        </div>

        {/* Corps */}
        {termine ? (
          <Felicitations onClose={fermer} />
        ) : (
          <>
            <BarreProgression total={ETAPES.length} actif={etapeActuelle} />
            <CarteEtape
              etape={ETAPES[etapeActuelle]}
              index={etapeActuelle}
              total={ETAPES.length}
              onNext={() => allerEtape(etapeActuelle + 1)}
              onPrev={() => allerEtape(etapeActuelle - 1)}
              onSkip={() => allerEtape(etapeActuelle + 1)}
            />
          </>
        )}

        {/* Lien "Faire ça plus tard" */}
        {!termine && (
          <div style={{
            textAlign: 'center', paddingBottom: 20,
            marginTop: -8,
          }}>
            <button
              onClick={fermer}
              style={{
                fontSize: 12, color: 'var(--gm-text-3, #9ca3af)',
                background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline', fontFamily: 'inherit',
              }}
            >
              Faire ça plus tard
            </button>
          </div>
        )}
      </div>
    </>
  );
}

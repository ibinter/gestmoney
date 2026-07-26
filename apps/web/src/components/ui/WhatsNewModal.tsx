'use client';
// ============================================================
// COMPOSANT WHATS NEW MODAL — GESTMONEY
// Affiche automatiquement la dernière version non vue
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, Shield, Wrench } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Version {
  id: string;
  version: string;
  titre: string;
  description: string;
  type: 'MAJEURE' | 'MINEURE' | 'CORRECTIF' | 'SECURITE';
  publishedAt: string | null;
}

interface WhatsNewModalProps {
  /** Contrôle externe : ouvert depuis le menu profil */
  ouvert?: boolean;
  onFermer?: () => void;
  /** Si true, charge automatiquement la dernière version non vue */
  auto?: boolean;
}

const TYPE_CONFIG: Record<
  Version['type'],
  { label: string; color: string; Icon: React.ElementType }
> = {
  MAJEURE: { label: 'Majeure', color: 'bg-emerald-100 text-emerald-800', Icon: Sparkles },
  MINEURE: { label: 'Mineure', color: 'bg-blue-100 text-blue-800', Icon: Sparkles },
  CORRECTIF: { label: 'Correctif', color: 'bg-orange-100 text-orange-800', Icon: Wrench },
  SECURITE: { label: 'Sécurité', color: 'bg-red-100 text-red-800', Icon: Shield },
};

/**
 * Sanitisation basique du markdown vers HTML.
 * N'utilise pas de lib externe — compatible CSP stricte.
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Titres
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-5 mb-2">$1</h1>')
    // Gras / italique
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Listes
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Sauts de ligne
    .replace(/\n{2,}/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

export function WhatsNewModal({ ouvert, onFermer, auto = false }: WhatsNewModalProps) {
  const [version, setVersion] = useState<Version | null>(null);
  const [affiche, setAffiche] = useState(false);
  const [chargement, setChargement] = useState(false);

  // Chargement automatique au montage (après login)
  useEffect(() => {
    if (!auto) return;
    let annule = false;
    api
      .get<Version | null>('/versions/latest')
      .then((res) => {
        if (!annule && res.data) {
          setVersion(res.data);
          setAffiche(true);
        }
      })
      .catch(() => {/* silencieux */});
    return () => { annule = true; };
  }, [auto]);

  // Contrôle externe (depuis le menu profil)
  useEffect(() => {
    if (ouvert === true) setAffiche(true);
    if (ouvert === false) setAffiche(false);
  }, [ouvert]);

  const fermer = useCallback(() => {
    setAffiche(false);
    onFermer?.();
  }, [onFermer]);

  // Fermeture Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    if (affiche) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [affiche, fermer]);

  const marquerVu = useCallback(async () => {
    if (!version) return;
    setChargement(true);
    try {
      await api.post(`/versions/${version.id}/vue`);
    } catch {/* silencieux */} finally {
      setChargement(false);
      fermer();
    }
  }, [version, fermer]);

  if (!affiche || !version) return null;

  const cfg = TYPE_CONFIG[version.type] ?? TYPE_CONFIG.MINEURE;
  const Icon = cfg.Icon;
  const dateStr = version.publishedAt
    ? new Date(version.publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                v{version.version}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}
              >
                <Icon size={11} />
                {cfg.label}
              </span>
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-200">
              {version.titre}
            </p>
            {dateStr && (
              <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
            )}
          </div>
          <button
            onClick={fermer}
            className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          <div
            className="prose prose-sm dark:prose-invert text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="mb-2">${markdownToHtml(version.description)}</p>`,
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <Link
            href="/dashboard/changelog"
            onClick={marquerVu}
            className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium underline-offset-2 hover:underline transition-colors"
          >
            Voir tout l&apos;historique →
          </Link>
          <button
            onClick={marquerVu}
            disabled={chargement}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
          >
            {chargement ? 'Enregistrement…' : 'Compris !'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhatsNewModal;

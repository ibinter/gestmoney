'use client';
// ============================================================
// PAGE CHANGELOG — GESTMONEY
// Timeline des versions logiciel publiées
// ============================================================
import React, { useEffect, useState } from 'react';
import { Sparkles, Wrench, Shield, Clock } from 'lucide-react';
import api from '@/lib/api';

interface Version {
  id: string;
  version: string;
  titre: string;
  description: string;
  type: 'MAJEURE' | 'MINEURE' | 'CORRECTIF' | 'SECURITE';
  publishedAt: string | null;
  vue: boolean;
}

const TYPE_CONFIG: Record<
  Version['type'],
  { label: string; bg: string; text: string; border: string; Icon: React.ElementType }
> = {
  MAJEURE: {
    label: 'Majeure',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500',
    Icon: Sparkles,
  },
  MINEURE: {
    label: 'Mineure',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500',
    Icon: Sparkles,
  },
  CORRECTIF: {
    label: 'Correctif',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500',
    Icon: Wrench,
  },
  SECURITE: {
    label: 'Sécurité',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500',
    Icon: Shield,
  },
};

/**
 * Sanitisation basique du markdown vers HTML (sans dépendance externe).
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1 text-gray-800 dark:text-gray-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-4 mb-1 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n{2,}/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

export default function ChangelogPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Version[]>('/versions')
      .then((res) => setVersions(res.data))
      .catch(() => setErreur('Impossible de charger l\'historique des versions.'))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={24} className="text-emerald-600" />
          Historique des versions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Toutes les mises à jour publiées de GESTMONEY.
        </p>
      </div>

      {/* États */}
      {chargement && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-28" />
          ))}
        </div>
      )}

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-red-700 dark:text-red-300 text-sm">
          {erreur}
        </div>
      )}

      {/* Timeline */}
      {!chargement && !erreur && versions.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-12">
          Aucune version publiée pour l&apos;instant.
        </p>
      )}

      {!chargement && !erreur && versions.length > 0 && (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-6">
            {versions.map((v) => {
              const cfg = TYPE_CONFIG[v.type] ?? TYPE_CONFIG.MINEURE;
              const Icon = cfg.Icon;
              const dateStr = v.publishedAt
                ? new Date(v.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '';
              const nonVue = !v.vue;

              return (
                <div key={v.id} className="relative flex gap-4">
                  {/* Puce de timeline */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      nonVue
                        ? `${cfg.border} bg-white dark:bg-gray-900`
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={nonVue ? cfg.text : 'text-gray-400 dark:text-gray-500'}
                    />
                  </div>

                  {/* Carte version */}
                  <div
                    className={`flex-1 rounded-xl border p-4 transition-colors ${
                      nonVue
                        ? `border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900`
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    {/* En-tête de la carte */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`font-bold text-base ${
                          nonVue
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        v{v.version}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                      {nonVue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                          Nouveau
                        </span>
                      )}
                      {dateStr && (
                        <span className="ml-auto text-xs text-gray-400">{dateStr}</span>
                      )}
                    </div>

                    <p
                      className={`font-medium text-sm mb-2 ${
                        nonVue
                          ? 'text-gray-800 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {v.titre}
                    </p>

                    <div
                      className={`text-xs leading-relaxed ${
                        nonVue
                          ? 'text-gray-600 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: `<p class="mb-1">${markdownToHtml(v.description)}</p>`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

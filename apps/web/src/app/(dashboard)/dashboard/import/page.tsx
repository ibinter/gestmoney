'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// ── Types ──────────────────────────────────────────────────────────────────────
type ImportType = 'clients' | 'agents' | 'transactions';

interface ImportRowError {
  ligne: number;
  colonne: string;
  message: string;
}

interface ImportReport {
  type: ImportType;
  total: number;
  importees: number;
  erreurs: number;
  details: ImportRowError[];
  dureeMs: number;
}

const TYPE_LABELS: Record<ImportType, string> = {
  clients: 'Clients',
  agents: 'Agents',
  transactions: 'Transactions',
};

const TYPE_DESCRIPTIONS: Record<ImportType, string> = {
  clients: 'nom, prenom, telephone*, email, typeIdentite, numeroIdentite, adresse',
  agents: 'nom, prenom, telephone*, email, agenceId*, operateurs',
  transactions: 'type*, montant*, devise, clientId*, agentId, reference, dateOperation',
};

// ── Composant principal ────────────────────────────────────────────────────────
export default function ImportPage() {
  const { token } = useAuthStore();
  const [type, setType] = useState<ImportType>('clients');
  const [fichier, setFichier] = useState<File | null>(null);
  const [rapport, setRapport] = useState<ImportReport | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  // ── Téléchargement du modèle ───────────────────────────────────────────────
  const telechargerModele = async () => {
    try {
      const res = await fetch(`${API}/import/${type}/modele`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du téléchargement');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_import_modele.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreurGlobale('Impossible de télécharger le modèle. Vérifiez votre connexion.');
    }
  };

  // ── Drop & sélection ───────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validerEtSetFichier(f);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validerEtSetFichier(f);
  };

  const validerEtSetFichier = (f: File) => {
    setErreurGlobale(null);
    setRapport(null);
    if (f.size > 5 * 1024 * 1024) {
      setErreurGlobale('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    if (!f.name.match(/\.(xlsx|csv)$/i)) {
      setErreurGlobale('Seuls les fichiers .xlsx et .csv sont acceptés');
      return;
    }
    setFichier(f);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const lancerImport = async () => {
    if (!fichier) return;
    setChargement(true);
    setErreurGlobale(null);
    setRapport(null);

    try {
      const form = new FormData();
      form.append('fichier', fichier);

      const res = await fetch(`${API}/import/${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? `Erreur HTTP ${res.status}`);
      }
      setRapport(data as ImportReport);
    } catch (e: any) {
      setErreurGlobale(e.message ?? 'Erreur inconnue lors de l\'import');
    } finally {
      setChargement(false);
    }
  };

  const reinitialiser = () => {
    setFichier(null);
    setRapport(null);
    setErreurGlobale(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="text-[color:var(--gm-primary)]" size={26} />
          Import XLSX / CSV
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Importez en masse vos clients, agents ou transactions depuis un fichier Excel ou CSV.
        </p>
      </div>

      {/* Sélecteur de type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          1. Choisir le type de données
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(TYPE_LABELS) as ImportType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); reinitialiser(); }}
              className={`rounded-lg border-2 p-3 text-left transition-colors ${
                type === t
                  ? 'border-[color:var(--gm-primary)] bg-[color:var(--gm-primary)]/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`text-sm font-semibold ${type === t ? 'text-[color:var(--gm-primary)]' : 'text-gray-800 dark:text-gray-200'}`}>
                {TYPE_LABELS[t]}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 leading-tight">{TYPE_DESCRIPTIONS[t]}</div>
            </button>
          ))}
        </div>

        {/* Lien modèle */}
        <button
          type="button"
          onClick={telechargerModele}
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--gm-primary)] hover:underline"
        >
          <Download size={14} />
          Télécharger le modèle Excel ({TYPE_LABELS[type]})
        </button>
      </div>

      {/* Zone de dépôt */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          2. Déposer le fichier
        </h2>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors py-10 px-4 ${
            dragOver
              ? 'border-[color:var(--gm-primary)] bg-[color:var(--gm-primary)]/5'
              : fichier
              ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-[color:var(--gm-primary)]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {fichier ? (
            <>
              <CheckCircle2 size={36} className="text-green-500 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{fichier.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(fichier.size / 1024).toFixed(1)} Ko — cliquer pour remplacer
              </p>
            </>
          ) : (
            <>
              <Upload size={36} className="text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Glisser-déposer ou cliquer pour sélectionner
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Formats acceptés : .xlsx, .csv — max 5 Mo</p>
            </>
          )}
        </div>

        {/* Erreur globale */}
        {erreurGlobale && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{erreurGlobale}</span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={lancerImport}
            disabled={!fichier || chargement}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[color:var(--gm-primary)] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {chargement ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Import en cours…
              </>
            ) : (
              <>
                <Upload size={14} />
                Lancer l'import
              </>
            )}
          </button>

          {(fichier || rapport) && (
            <button
              type="button"
              onClick={reinitialiser}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={14} />
              Réessayer / Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Rapport */}
      {rapport && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            3. Rapport d'import
          </h2>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total lignes', val: rapport.total, color: 'text-gray-700 dark:text-gray-200' },
              { label: 'Importées', val: rapport.importees, color: 'text-green-600' },
              { label: 'Erreurs', val: rapport.erreurs, color: rapport.erreurs > 0 ? 'text-red-600' : 'text-gray-400' },
              { label: 'Durée', val: `${rapport.dureeMs} ms`, color: 'text-gray-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{val}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Bannière succès */}
          {rapport.importees > 0 && rapport.erreurs === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Import terminé avec succès — {rapport.importees} ligne(s) importée(s).
              </span>
            </div>
          )}

          {/* Détail des erreurs */}
          {rapport.details.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                Voir le détail des {rapport.details.length} erreur(s)
              </summary>
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Ligne</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Colonne</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rapport.details.map((err, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2 text-gray-500">{err.ligne}</td>
                        <td className="px-3 py-2 font-mono text-orange-600 dark:text-orange-400">{err.colonne}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

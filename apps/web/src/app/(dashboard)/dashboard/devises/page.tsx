'use client';
// ============================================================
// PAGE TAUX DE CHANGE — GESTMONEY
// Gestion des taux XOF ↔ EUR/USD/GBP/CNY
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GmPageHeader } from '@/components/gm';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface TauxChange {
  id: string;
  deviseBase: string;
  deviseCible: string;
  taux: number;
  source: string;
  updatedAt: string;
}

const FLAG: Record<string, string> = {
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  CNY: '🇨🇳',
  XOF: '🌍',
};

const NOM: Record<string, string> = {
  EUR: 'Euro',
  USD: 'Dollar US',
  GBP: 'Livre sterling',
  CNY: 'Yuan chinois',
  XOF: 'Franc CFA',
};

function equivalence(taux: TauxChange): string {
  if (taux.taux === 0) return '—';
  const inverse = 1 / taux.taux;
  return `1 ${taux.deviseCible} ≈ ${Math.round(inverse).toLocaleString('fr-FR')} ${taux.deviseBase}`;
}

export default function DevisesPage() {
  const token = useAuthStore((s) => s.token);
  const [taux, setTaux] = useState<TauxChange[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  // Modal modification
  const [modalOuvert, setModalOuvert] = useState(false);
  const [tauxEdite, setTauxEdite] = useState<TauxChange | null>(null);
  const [nouveauTaux, setNouveauTaux] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurModal, setErreurModal] = useState('');

  // Calculatrice
  const [calcMontant, setCalcMontant] = useState('');
  const [calcDevise, setCalcDevise] = useState('EUR');
  const [calcResultat, setCalcResultat] = useState<number | null>(null);
  const [calcSens, setCalcSens] = useState<'XOF_TO' | 'TO_XOF'>('XOF_TO');

  const chargerTaux = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const data = await apiFetch<TauxChange[]>('/devises/taux');
      setTaux(data);
    } catch {
      setErreur('Impossible de charger les taux de change.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { chargerTaux(); }, [chargerTaux]);

  // Calculatrice en temps réel
  useEffect(() => {
    const montant = parseFloat(calcMontant);
    if (!montant || montant <= 0) { setCalcResultat(null); return; }

    const entree = taux.find(
      (t) => t.deviseBase === 'XOF' && t.deviseCible === calcDevise,
    );
    if (!entree || entree.taux === 0) { setCalcResultat(null); return; }

    if (calcSens === 'XOF_TO') {
      setCalcResultat(parseFloat((montant * entree.taux).toFixed(4)));
    } else {
      setCalcResultat(Math.round(montant / entree.taux));
    }
  }, [calcMontant, calcDevise, calcSens, taux]);

  const ouvrirModif = (t: TauxChange) => {
    setTauxEdite(t);
    setNouveauTaux(String(t.taux));
    setErreurModal('');
    setModalOuvert(true);
  };

  const enregistrerTaux = async () => {
    if (!tauxEdite) return;
    const val = parseFloat(nouveauTaux);
    if (!val || val <= 0) { setErreurModal('Taux invalide.'); return; }
    setEnregistrement(true);
    setErreurModal('');
    try {
      await apiFetch('/devises/taux', {
        method: 'PUT',
        body: JSON.stringify({
          deviseBase: tauxEdite.deviseBase,
          deviseCible: tauxEdite.deviseCible,
          taux: val,
          source: 'MANUAL',
        }),
      });
      await chargerTaux();
      setModalOuvert(false);
    } catch {
      setErreurModal("Erreur lors de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  };

  const deviseSensOppose = calcSens === 'XOF_TO' ? calcDevise : 'XOF';
  const deviseSensSource = calcSens === 'XOF_TO' ? 'XOF' : calcDevise;

  return (
    <>
      <GmPageHeader
        titre="Taux de change"
        sousTitre="Gérez les taux XOF ↔ devises étrangères utilisés dans les transactions"
        icone="💱"
      />

      <div className="gm-page-content">

        {/* ── Tableau des taux ─────────────────────────────────────────── */}
        <section className="gm-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="gm-section-title">Taux configurés</h2>
            <Button variante="ghost" onClick={chargerTaux} loading={chargement}>
              Actualiser
            </Button>
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 mb-4">
              {erreur}
            </div>
          )}

          {chargement ? (
            <div className="text-center py-8 text-text-2">Chargement…</div>
          ) : taux.length === 0 ? (
            <div className="text-center py-8 text-text-2">
              Aucun taux configuré — lancez le seed ou ajoutez-en un.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="gm-table w-full">
                <thead>
                  <tr>
                    <th>Devise source</th>
                    <th>Devise cible</th>
                    <th className="text-right">Taux (1 source = X cible)</th>
                    <th>Équivalence</th>
                    <th>Source</th>
                    <th>Mise à jour</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {taux.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="mr-1">{FLAG[t.deviseBase] ?? ''}</span>
                        <strong>{t.deviseBase}</strong>
                        <span className="ml-1 text-text-2 text-xs">{NOM[t.deviseBase]}</span>
                      </td>
                      <td>
                        <span className="mr-1">{FLAG[t.deviseCible] ?? ''}</span>
                        <strong>{t.deviseCible}</strong>
                        <span className="ml-1 text-text-2 text-xs">{NOM[t.deviseCible]}</span>
                      </td>
                      <td className="text-right font-mono font-semibold">
                        {t.taux.toFixed(6)}
                      </td>
                      <td className="text-xs text-text-2">{equivalence(t)}</td>
                      <td>
                        <span className={`gm-badge ${t.source === 'MANUAL' ? 'gm-badge-info' : 'gm-badge-success'}`}>
                          {t.source}
                        </span>
                      </td>
                      <td className="text-xs text-text-2">
                        {formatDate(t.updatedAt)}
                      </td>
                      <td>
                        <Button variante="ghost" taille="sm" onClick={() => ouvrirModif(t)}>
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Calculatrice rapide ──────────────────────────────────────── */}
        <section className="gm-card">
          <h2 className="gm-section-title mb-4">Calculatrice de conversion</h2>
          <div className="flex flex-wrap gap-4 items-end">

            {/* Champ montant */}
            <div className="flex-1 min-w-[160px]">
              <Input
                label={`Montant en ${deviseSensSource}`}
                type="number"
                placeholder="100 000"
                value={calcMontant}
                onChange={(e) => setCalcMontant(e.target.value)}
              />
            </div>

            {/* Sélecteur devise étrangère */}
            <div className="flex-1 min-w-[140px]">
              <label className="gm-label">Devise étrangère</label>
              <select
                className="gm-input"
                value={calcDevise}
                onChange={(e) => setCalcDevise(e.target.value)}
              >
                <option value="EUR">🇪🇺 EUR — Euro</option>
                <option value="USD">🇺🇸 USD — Dollar US</option>
                <option value="GBP">🇬🇧 GBP — Livre sterling</option>
                <option value="CNY">🇨🇳 CNY — Yuan chinois</option>
              </select>
            </div>

            {/* Bouton inversion sens */}
            <div>
              <label className="gm-label opacity-0">sens</label>
              <button
                className="gm-input flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setCalcSens((s) => (s === 'XOF_TO' ? 'TO_XOF' : 'XOF_TO'))}
                title="Inverser le sens de conversion"
              >
                {calcSens === 'XOF_TO'
                  ? `XOF → ${calcDevise}`
                  : `${calcDevise} → XOF`}
                &nbsp;⇄
              </button>
            </div>

            {/* Résultat */}
            <div className="flex-1 min-w-[180px]">
              <label className="gm-label">Résultat en {deviseSensOppose}</label>
              <div className="gm-input bg-surface-2 font-mono font-bold text-lg">
                {calcResultat !== null
                  ? `${calcResultat.toLocaleString('fr-FR')} ${deviseSensOppose}`
                  : '—'}
              </div>
            </div>
          </div>

          {calcResultat !== null && calcMontant && (
            <p className="mt-3 text-sm text-text-2">
              {parseFloat(calcMontant).toLocaleString('fr-FR')} {deviseSensSource}
              &nbsp;=&nbsp;
              <strong>{calcResultat.toLocaleString('fr-FR')} {deviseSensOppose}</strong>
            </p>
          )}
        </section>
      </div>

      {/* ── Modal modification taux ─────────────────────────────────── */}
      <Modal
        ouvert={modalOuvert}
        onFermer={() => setModalOuvert(false)}
        titre={tauxEdite ? `Modifier taux ${tauxEdite.deviseBase} → ${tauxEdite.deviseCible}` : ''}
      >
        {tauxEdite && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-2">
              Taux actuel&nbsp;: <strong>{tauxEdite.taux}</strong>
              &nbsp;(1 {tauxEdite.deviseBase} = {tauxEdite.taux} {tauxEdite.deviseCible})
            </p>
            <p className="text-sm text-text-2">
              Soit&nbsp;: {equivalence(tauxEdite)}
            </p>
            <Input
              label={`Nouveau taux (1 ${tauxEdite.deviseBase} = X ${tauxEdite.deviseCible})`}
              type="number"
              step="0.000001"
              placeholder="0.00152"
              value={nouveauTaux}
              onChange={(e) => setNouveauTaux(e.target.value)}
              autoFocus
            />
            {parseFloat(nouveauTaux) > 0 && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                Aperçu&nbsp;: 1 000 {tauxEdite.deviseBase} ≈&nbsp;
                {(1000 * parseFloat(nouveauTaux)).toFixed(4)} {tauxEdite.deviseCible}
              </p>
            )}
            {erreurModal && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {erreurModal}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variante="primary"
                fullWidth
                loading={enregistrement}
                onClick={enregistrerTaux}
              >
                Enregistrer
              </Button>
              <Button variante="ghost" onClick={() => setModalOuvert(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

'use client';
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Lock, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import { useEcritures, useCaisseStats, useAddEcriture, useOuvrirCaisse, useFermerCaisse } from '@/hooks/useCaisse';
import { GmExportMenu } from '@/components/gm/GmExportMenu';
import { EcritureCaisse } from '@/types';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const CAT_ORDRE = ['depot', 'retrait', 'cash_in', 'cash_out', 'reappro', 'commission', 'approvisionnement', 'frais'] as const;

const catLabels = (t: Translations): Record<string, string> => ({
  depot: t.caisse.categories.depot,
  retrait: t.caisse.categories.retrait,
  cash_in: t.caisse.categories.cash_in,
  cash_out: t.caisse.categories.cash_out,
  reappro: t.caisse.categories.reappro,
  commission: t.caisse.categories.commission,
  approvisionnement: t.caisse.categories.approvisionnement,
  frais: t.caisse.categories.frais,
});

const FORM_ECRITURE_INIT = { type: 'entree' as 'entree' | 'sortie', libelle: '', montant: '', categorie: 'depot' };

export default function CaissePage() {
  const t = useT();
  const CAT_LABELS = catLabels(t);
  const [modalAjout, setModalAjout] = useState(false);
  const [formEcriture, setFormEcriture] = useState(FORM_ECRITURE_INIT);
  const [erreurEcriture, setErreurEcriture] = useState('');
  const [succesEcriture, setSuccesEcriture] = useState('');

  const [modalOuverture, setModalOuverture] = useState(false);
  const [soldeInitial, setSoldeInitial] = useState('');
  const [notesOuverture, setNotesOuverture] = useState('');
  const [erreurOuverture, setErreurOuverture] = useState('');

  const [modalCloture, setModalCloture] = useState(false);
  const [soldeFinal, setSoldeFinal] = useState('');
  const [notesCloture, setNotesCloture] = useState('');
  const [erreurCloture, setErreurCloture] = useState('');

  const { data: ecritures = [], isLoading, refetch } = useEcritures();
  const { data: stats } = useCaisseStats();
  const ajouterEcriture = useAddEcriture();
  const ouvrirCaisse = useOuvrirCaisse();
  const fermerCaisse = useFermerCaisse();

  const apiErrorMessage = (err: unknown, fallback: string): string => {
    const e = err as { response?: { data?: { message?: string | string[] } } };
    const msg = e?.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || fallback;
  };

  const handleOuvrirCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurOuverture('');
    const montant = Number(soldeInitial);
    if (soldeInitial === '' || Number.isNaN(montant) || montant < 0) {
      setErreurOuverture('Solde initial invalide.');
      return;
    }
    try {
      await ouvrirCaisse.mutateAsync({ soldInitial: montant, notes: notesOuverture || undefined });
      setModalOuverture(false);
      setSoldeInitial('');
      setNotesOuverture('');
      refetch();
    } catch (err) {
      setErreurOuverture(apiErrorMessage(err, "Erreur lors de l'ouverture de la caisse."));
    }
  };

  const handleFermerCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurCloture('');
    const montant = Number(soldeFinal);
    if (soldeFinal === '' || Number.isNaN(montant) || montant < 0) {
      setErreurCloture('Solde final invalide.');
      return;
    }
    try {
      await fermerCaisse.mutateAsync({ soldeFinal: montant, notes: notesCloture || undefined });
      setModalCloture(false);
      setSoldeFinal('');
      setNotesCloture('');
      refetch();
    } catch (err) {
      setErreurCloture(apiErrorMessage(err, 'Erreur lors de la clôture de la caisse.'));
    }
  };

  const handleSubmitEcriture = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurEcriture('');
    const montant = Number(formEcriture.montant);
    if (!formEcriture.libelle || !montant || montant <= 0) {
      setErreurEcriture(t.caisse.modal.requiredError);
      return;
    }
    try {
      await ajouterEcriture.mutateAsync({
        type: formEcriture.type,
        libelle: formEcriture.libelle,
        montant,
        categorie: formEcriture.categorie,
      });
      setSuccesEcriture(t.caisse.modal.success);
      setFormEcriture(FORM_ECRITURE_INIT);
      setTimeout(() => { setModalAjout(false); setSuccesEcriture(''); }, 1500);
    } catch {
      setErreurEcriture(t.caisse.modal.saveError);
    }
  };

  const soldeActuel = stats?.soldeActuel ?? 0;
  const entrees = stats?.entreesJour ?? 0;
  const sorties = stats?.sortiesJour ?? 0;
  const ecart = entrees - sorties;

  const colonnes: Colonne<EcritureCaisse>[] = [
    {
      key: 'date',
      titre: t.caisse.columns.date,
      rendu: (v) => <span className="text-xs text-gray-500">{formatDateTime(String(v))}</span>,
    },
    {
      key: 'reference',
      titre: t.caisse.columns.reference,
      rendu: (v) => <span className="font-mono text-xs text-gray-600">{String(v)}</span>,
    },
    {
      key: 'libelle',
      titre: t.caisse.columns.libelle,
      rendu: (v) => <span className="text-sm">{String(v)}</span>,
    },
    {
      key: 'categorie',
      titre: t.caisse.columns.categorie,
      rendu: (v) => <Badge couleur="info">{CAT_LABELS[String(v)] ?? String(v)}</Badge>,
    },
    { key: 'agentNom', titre: t.caisse.columns.agent },
    {
      key: 'type',
      titre: t.caisse.columns.sens,
      rendu: (v) => (
        <div className={clsx('flex items-center gap-1 font-medium text-sm', v === 'entree' ? 'text-success' : 'text-danger')}>
          {v === 'entree' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {v === 'entree' ? t.caisse.sens.entree : t.caisse.sens.sortie}
        </div>
      ),
    },
    {
      key: 'montant',
      titre: t.caisse.columns.montant,
      align: 'right',
      triable: true,
      rendu: (v, ligne) => (
        <span className={clsx('font-bold text-sm', ligne.type === 'entree' ? 'text-success' : 'text-danger')}>
          {ligne.type === 'entree' ? '+' : '-'}{formatMontant(Number(v))}
        </span>
      ),
    },
    {
      key: 'soldeApres',
      titre: t.caisse.columns.soldeApres,
      align: 'right',
      rendu: (v) => <span className="text-sm font-semibold text-text-main">{formatMontant(Number(v))}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t.caisse.title}</h1>
          <p className="text-sm text-gray-500">{t.caisse.subtitle}</p>
        </div>
        <div className="flex gap-2 items-center">
          <GmExportMenu
            titre={t.caisse.title}
            donnees={ecritures}
            colonnes={[
              { titre: t.caisse.columns.date, valeur: (r) => formatDateTime(String(r.date)) },
              { titre: t.caisse.columns.reference, valeur: (r) => r.reference },
              { titre: t.caisse.columns.libelle, valeur: (r) => r.libelle },
              { titre: t.caisse.columns.categorie, valeur: (r) => CAT_LABELS[String(r.categorie)] ?? String(r.categorie) },
              { titre: t.caisse.columns.agent, valeur: (r) => r.agentNom ?? '' },
              { titre: t.caisse.columns.sens, valeur: (r) => (r.type === 'entree' ? t.caisse.sens.entree : t.caisse.sens.sortie) },
              { titre: t.caisse.columns.montant, valeur: (r) => r.montant, align: 'right' },
              { titre: t.caisse.columns.soldeApres, valeur: (r) => r.soldeApres, align: 'right' },
            ]}
            nomFichier="caisse"
            label={t.common.export}
          />
          <Button variante="ghost" taille="sm" icone={<RefreshCw size={15} />} onClick={() => refetch()}>{t.common.refresh}</Button>
          {stats?.statut === 'OUVERTE' ? (
            <Button variante="danger" taille="sm" icone={<Lock size={15} />} onClick={() => { setErreurCloture(''); setSoldeFinal(''); setNotesCloture(''); setModalCloture(true); }}>
              Clôturer la caisse
            </Button>
          ) : (
            <Button variante="secondary" taille="sm" icone={<Unlock size={15} />} onClick={() => { setErreurOuverture(''); setSoldeInitial(''); setNotesOuverture(''); setModalOuverture(true); }}>
              Ouvrir la caisse
            </Button>
          )}
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalAjout(true)}>
            {t.caisse.manualEntry}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre={t.caisse.stats.soldeActuel} valeur={formatMontant(soldeActuel)} icone="💵" couleur="success" />
        <StatCard titre={t.caisse.stats.entreesJour} valeur={formatMontant(entrees)} icone={<TrendingUp size={18} />} couleur="success" />
        <StatCard titre={t.caisse.stats.sortiesJour} valeur={formatMontant(sorties)} icone={<TrendingDown size={18} />} couleur="danger" />
        <StatCard
          titre={t.caisse.stats.ecart}
          valeur={formatMontant(Math.abs(ecart))}
          sousTexte={ecart === 0 ? t.caisse.stats.equilibree : ecart > 0 ? t.caisse.stats.excedent : t.caisse.stats.deficit}
          icone="⚖️"
          couleur={ecart === 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Barre solde visuelle */}
      <div className="bg-white rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-text-main">{t.caisse.flux.title}</h3>
          <span className="text-xs text-gray-400">{ecritures.length} {t.caisse.flux.ecrituresSuffix}</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{t.caisse.flux.entrees}</p>
            <div className="h-3 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${entrees + sorties > 0 ? Math.min((entrees / (entrees + sorties)) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-xs font-semibold text-success mt-1">{formatMontant(entrees)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{t.caisse.flux.sorties}</p>
            <div className="h-3 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: `${entrees + sorties > 0 ? Math.min((sorties / (entrees + sorties)) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-xs font-semibold text-danger mt-1">{formatMontant(sorties)}</p>
          </div>
        </div>
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>{t.caisse.journalTitle}</CardTitle>
        </CardHeader>
        <Table colonnes={colonnes} donnees={ecritures} messageVide={isLoading ? t.common.loading : t.caisse.empty} />
      </Card>

      <Modal ouvert={modalAjout} onFermer={() => { setModalAjout(false); setFormEcriture(FORM_ECRITURE_INIT); setErreurEcriture(''); setSuccesEcriture(''); }} titre={t.caisse.manualEntry} taille="sm">
        <form className="space-y-4" onSubmit={handleSubmitEcriture}>
          <Select
            label={t.caisse.modal.typeLabel}
            value={formEcriture.type}
            onChange={(e) => setFormEcriture((f) => ({ ...f, type: e.target.value as 'entree' | 'sortie' }))}
            options={[{ value: 'entree', label: t.caisse.sens.entree }, { value: 'sortie', label: t.caisse.sens.sortie }]}
          />
          <Input
            label={t.caisse.modal.libelleLabel}
            placeholder={t.caisse.modal.libellePlaceholder}
            value={formEcriture.libelle}
            onChange={(e) => setFormEcriture((f) => ({ ...f, libelle: e.target.value }))}
            required
          />
          <Input
            label={t.caisse.modal.montantLabel}
            type="number"
            placeholder="0"
            value={formEcriture.montant}
            onChange={(e) => setFormEcriture((f) => ({ ...f, montant: e.target.value }))}
            required
          />
          <Select
            label={t.caisse.modal.categorieLabel}
            value={formEcriture.categorie}
            onChange={(e) => setFormEcriture((f) => ({ ...f, categorie: e.target.value }))}
            options={CAT_ORDRE.map((v) => ({ value: v, label: CAT_LABELS[v]! }))}
          />

          {erreurEcriture && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurEcriture}</div>}
          {succesEcriture && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesEcriture}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={ajouterEcriture.isPending}>{t.common.save}</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalAjout(false); setFormEcriture(FORM_ECRITURE_INIT); setErreurEcriture(''); }}>{t.common.cancel}</Button>
          </div>
        </form>
      </Modal>

      {/* Ouverture de caisse */}
      <Modal ouvert={modalOuverture} onFermer={() => { setModalOuverture(false); setErreurOuverture(''); }} titre="Ouvrir la caisse" taille="sm">
        <form className="space-y-4" onSubmit={handleOuvrirCaisse}>
          <p className="text-sm text-gray-500">
            Saisissez le montant en espèces présent dans la caisse à l&apos;ouverture.
          </p>
          <Input
            label="Solde initial (FCFA) *"
            type="number"
            placeholder="0"
            value={soldeInitial}
            onChange={(e) => setSoldeInitial(e.target.value)}
            required
          />
          <Input
            label="Notes"
            placeholder="Remarque (optionnel)"
            value={notesOuverture}
            onChange={(e) => setNotesOuverture(e.target.value)}
          />

          {erreurOuverture && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurOuverture}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={ouvrirCaisse.isPending}>Ouvrir la caisse</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuverture(false); setErreurOuverture(''); }}>{t.common.cancel}</Button>
          </div>
        </form>
      </Modal>

      {/* Clôture de caisse */}
      <Modal ouvert={modalCloture} onFermer={() => { setModalCloture(false); setErreurCloture(''); }} titre="Clôturer la caisse" taille="sm">
        <form className="space-y-4" onSubmit={handleFermerCaisse}>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Solde calculé (théorique)</span>
            <span className="text-sm font-bold text-text-main">{formatMontant(soldeActuel)}</span>
          </div>
          <Input
            label="Solde final compté (FCFA) *"
            type="number"
            placeholder="0"
            value={soldeFinal}
            onChange={(e) => setSoldeFinal(e.target.value)}
            required
          />
          {soldeFinal !== '' && !Number.isNaN(Number(soldeFinal)) && (
            (() => {
              const ecartCloture = Number(soldeFinal) - soldeActuel;
              return (
                <div className={clsx('rounded-xl p-3 flex items-center justify-between text-sm border',
                  ecartCloture === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700')}>
                  <span>Écart {ecartCloture === 0 ? '(équilibrée)' : ecartCloture > 0 ? '(excédent)' : '(déficit)'}</span>
                  <span className="font-bold">{ecartCloture > 0 ? '+' : ''}{formatMontant(ecartCloture)}</span>
                </div>
              );
            })()
          )}
          <Input
            label="Notes"
            placeholder="Remarque (optionnel)"
            value={notesCloture}
            onChange={(e) => setNotesCloture(e.target.value)}
          />

          {erreurCloture && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurCloture}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="danger" fullWidth loading={fermerCaisse.isPending}>Clôturer la caisse</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalCloture(false); setErreurCloture(''); }}>{t.common.cancel}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

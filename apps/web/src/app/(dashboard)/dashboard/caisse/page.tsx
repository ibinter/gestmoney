'use client';
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Download, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import { useEcritures, useCaisseStats, useAddEcriture } from '@/hooks/useCaisse';
import { EcritureCaisse } from '@/types';
import { clsx } from 'clsx';

const CAT_LABELS: Record<string, string> = {
  depot: 'Depot', retrait: 'Retrait', cash_in: 'Cash In', cash_out: 'Cash Out',
  reappro: 'Reapprovisionnement', commission: 'Commission', approvisionnement: 'Approvisionnement', frais: 'Frais',
};

const FORM_ECRITURE_INIT = { type: 'entree' as 'entree' | 'sortie', libelle: '', montant: '', categorie: 'depot' };

export default function CaissePage() {
  const [modalAjout, setModalAjout] = useState(false);
  const [formEcriture, setFormEcriture] = useState(FORM_ECRITURE_INIT);
  const [erreurEcriture, setErreurEcriture] = useState('');
  const [succesEcriture, setSuccesEcriture] = useState('');

  const { data: ecritures = [], isLoading, refetch } = useEcritures();
  const { data: stats } = useCaisseStats();
  const ajouterEcriture = useAddEcriture();

  const handleSubmitEcriture = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurEcriture('');
    const montant = Number(formEcriture.montant);
    if (!formEcriture.libelle || !montant || montant <= 0) {
      setErreurEcriture('Libellé et montant valide sont obligatoires.');
      return;
    }
    try {
      await ajouterEcriture.mutateAsync({
        type: formEcriture.type,
        libelle: formEcriture.libelle,
        montant,
        categorie: formEcriture.categorie,
      });
      setSuccesEcriture('Écriture enregistrée avec succès.');
      setFormEcriture(FORM_ECRITURE_INIT);
      setTimeout(() => { setModalAjout(false); setSuccesEcriture(''); }, 1500);
    } catch {
      setErreurEcriture('Erreur lors de l\'enregistrement.');
    }
  };

  const soldeActuel = stats?.soldeActuel ?? 0;
  const entrees = stats?.entreesJour ?? 0;
  const sorties = stats?.sortiesJour ?? 0;
  const ecart = entrees - sorties;

  const colonnes: Colonne<EcritureCaisse>[] = [
    {
      key: 'date',
      titre: 'Date / Heure',
      rendu: (v) => <span className="text-xs text-gray-500">{formatDateTime(String(v))}</span>,
    },
    {
      key: 'reference',
      titre: 'Reference',
      rendu: (v) => <span className="font-mono text-xs text-gray-600">{String(v)}</span>,
    },
    {
      key: 'libelle',
      titre: 'Libelle',
      rendu: (v) => <span className="text-sm">{String(v)}</span>,
    },
    {
      key: 'categorie',
      titre: 'Categorie',
      rendu: (v) => <Badge couleur="info">{CAT_LABELS[String(v)] ?? String(v)}</Badge>,
    },
    { key: 'agentNom', titre: 'Agent' },
    {
      key: 'type',
      titre: 'Sens',
      rendu: (v) => (
        <div className={clsx('flex items-center gap-1 font-medium text-sm', v === 'entree' ? 'text-success' : 'text-danger')}>
          {v === 'entree' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {v === 'entree' ? 'Entree' : 'Sortie'}
        </div>
      ),
    },
    {
      key: 'montant',
      titre: 'Montant',
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
      titre: 'Solde apres',
      align: 'right',
      rendu: (v) => <span className="text-sm font-semibold text-text-main">{formatMontant(Number(v))}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Caisse</h1>
          <p className="text-sm text-gray-500">Journal de caisse et mouvements du jour</p>
        </div>
        <div className="flex gap-2">
          <Button variante="ghost" taille="sm" icone={<Download size={15} />}>Exporter</Button>
          <Button variante="ghost" taille="sm" icone={<RefreshCw size={15} />} onClick={() => refetch()}>Actualiser</Button>
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalAjout(true)}>
            Ecriture manuelle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre="Solde actuel" valeur={formatMontant(soldeActuel)} icone="💵" couleur="success" />
        <StatCard titre="Entrees du jour" valeur={formatMontant(entrees)} icone={<TrendingUp size={18} />} couleur="success" />
        <StatCard titre="Sorties du jour" valeur={formatMontant(sorties)} icone={<TrendingDown size={18} />} couleur="danger" />
        <StatCard
          titre="Ecart"
          valeur={formatMontant(Math.abs(ecart))}
          sousTexte={ecart === 0 ? 'Caisse equilibree' : ecart > 0 ? 'Excedent' : 'Deficit'}
          icone="⚖️"
          couleur={ecart === 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Barre solde visuelle */}
      <div className="bg-white rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-text-main">Flux du jour</h3>
          <span className="text-xs text-gray-400">{ecritures.length} ecritures</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Entrees</p>
            <div className="h-3 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${entrees + sorties > 0 ? Math.min((entrees / (entrees + sorties)) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-xs font-semibold text-success mt-1">{formatMontant(entrees)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Sorties</p>
            <div className="h-3 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: `${entrees + sorties > 0 ? Math.min((sorties / (entrees + sorties)) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-xs font-semibold text-danger mt-1">{formatMontant(sorties)}</p>
          </div>
        </div>
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>Journal de caisse — Aujourd&apos;hui</CardTitle>
        </CardHeader>
        <Table colonnes={colonnes} donnees={ecritures} messageVide={isLoading ? 'Chargement...' : 'Aucune ecriture'} />
      </Card>

      <Modal ouvert={modalAjout} onFermer={() => { setModalAjout(false); setFormEcriture(FORM_ECRITURE_INIT); setErreurEcriture(''); setSuccesEcriture(''); }} titre="Ecriture manuelle" taille="sm">
        <form className="space-y-4" onSubmit={handleSubmitEcriture}>
          <Select
            label="Type *"
            value={formEcriture.type}
            onChange={(e) => setFormEcriture((f) => ({ ...f, type: e.target.value as 'entree' | 'sortie' }))}
            options={[{ value: 'entree', label: 'Entrée' }, { value: 'sortie', label: 'Sortie' }]}
          />
          <Input
            label="Libellé *"
            placeholder="Description de l'écriture"
            value={formEcriture.libelle}
            onChange={(e) => setFormEcriture((f) => ({ ...f, libelle: e.target.value }))}
            required
          />
          <Input
            label="Montant (FCFA) *"
            type="number"
            placeholder="0"
            value={formEcriture.montant}
            onChange={(e) => setFormEcriture((f) => ({ ...f, montant: e.target.value }))}
            required
          />
          <Select
            label="Catégorie"
            value={formEcriture.categorie}
            onChange={(e) => setFormEcriture((f) => ({ ...f, categorie: e.target.value }))}
            options={Object.entries(CAT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />

          {erreurEcriture && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurEcriture}</div>}
          {succesEcriture && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesEcriture}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={ajouterEcriture.isPending}>Enregistrer</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalAjout(false); setFormEcriture(FORM_ECRITURE_INIT); setErreurEcriture(''); }}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

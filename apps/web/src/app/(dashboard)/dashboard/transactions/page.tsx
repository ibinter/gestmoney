'use client';
// ============================================================
// PAGE TRANSACTIONS — GESTMONEY
// ============================================================
import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { Table, Colonne } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge, badgeStatutTransaction } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { useTransactions, useCreateTransaction, useValiderTransaction } from '@/hooks/useTransactions';
import { Transaction, TypeTransaction, StatutTransaction, Operateur, OPERATEURS } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';

const TYPE_LABELS: Record<TypeTransaction, string> = {
  depot: 'Dépôt',
  retrait: 'Retrait',
  cash_in: 'Cash In',
  cash_out: 'Cash Out',
  transfert: 'Transfert',
  paiement: 'Paiement',
};

const STATUT_LABELS: Record<StatutTransaction, string> = {
  success: 'Succès',
  pending: 'En attente',
  failed: 'Échoué',
  cancelled: 'Annulé',
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreOperateur, setFiltreOperateur] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [selectionnees, setSelectionnees] = useState<string[]>([]);
  const [modalOuvert, setModalOuvert] = useState<TypeTransaction | null>(null);
  const [formTx, setFormTx] = useState({ operateur: 'orange_money', montant: '', clientNom: '', clientTel: '' });
  const [erreurTx, setErreurTx] = useState('');
  const [succesTx, setSuccesTx] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filtreType, filtreOperateur, filtreStatut]);

  const creerTransaction = useCreateTransaction();
  const validerTransaction = useValiderTransaction();

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurTx('');
    const montant = Number(formTx.montant);
    if (!montant || montant <= 0) { setErreurTx('Montant invalide.'); return; }
    if (!modalOuvert) return;
    try {
      await creerTransaction.mutateAsync({
        type: modalOuvert,
        operateur: formTx.operateur as Operateur,
        montant,
        clientNom: formTx.clientNom || undefined,
        clientTel: formTx.clientTel || undefined,
      });
      setSuccesTx('Transaction enregistrée avec succès.');
      setFormTx({ operateur: 'orange_money', montant: '', clientNom: '', clientTel: '' });
      setTimeout(() => { setModalOuvert(null); setSuccesTx(''); }, 1500);
    } catch {
      setErreurTx('Erreur lors de la création. Réessayez.');
    }
  };

  const { data, isLoading } = useTransactions({
    search: search || undefined,
    type: (filtreType as TypeTransaction) || undefined,
    operateur: (filtreOperateur as Operateur) || undefined,
    statut: (filtreStatut as StatutTransaction) || undefined,
    page,
    limit: LIMIT,
  });

  const transactions = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? transactions.length;

  // Stats rapides
  const totalJour = transactions.reduce((s, t) => s + t.montant, 0);
  const enAttente = transactions.filter((t) => t.statut === 'pending').length;
  const success = transactions.filter((t) => t.statut === 'success').length;

  // Colonnes du tableau
  const colonnes: Colonne<Transaction>[] = [
    {
      key: 'date',
      titre: 'Date / Heure',
      triable: true,
      rendu: (v) => <span className="text-xs text-gray-500">{formatDate(String(v))}</span>,
    },
    {
      key: 'reference',
      titre: 'Référence',
      rendu: (v) => <span className="font-mono text-xs text-gray-600">{String(v)}</span>,
    },
    {
      key: 'type',
      titre: 'Type',
      rendu: (v) => (
        <Badge couleur="info">{TYPE_LABELS[v as TypeTransaction] || String(v)}</Badge>
      ),
    },
    {
      key: 'agentNom',
      titre: 'Agent',
      triable: true,
    },
    {
      key: 'operateur',
      titre: 'Opérateur',
      rendu: (v) => (
        <span className="flex items-center gap-1 text-sm">
          {OPERATEURS[v as Operateur]?.logo} {OPERATEURS[v as Operateur]?.label}
        </span>
      ),
    },
    {
      key: 'montant',
      titre: 'Montant',
      triable: true,
      align: 'right',
      rendu: (v) => <span className="font-semibold">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'statut',
      titre: 'Statut',
      rendu: (v) => (
        <Badge couleur={badgeStatutTransaction(String(v))} point>
          {STATUT_LABELS[v as StatutTransaction] || String(v)}
        </Badge>
      ),
    },
    {
      key: 'id',
      titre: 'Actions',
      rendu: (_, ligne) => (
        <div className="flex gap-1">
          <button className="text-xs text-primary hover:underline font-medium" onClick={() => setTransactionSelectionnee(ligne)}>Voir</button>
          {ligne.statut === 'pending' && (
            <button
              className="text-xs text-success hover:underline font-medium ml-2"
              onClick={() => validerTransaction.mutate(ligne.id)}
              disabled={validerTransaction.isPending}
            >
              Valider
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Transactions</h1>
          <p className="text-sm text-gray-500">Gestion de toutes les opérations Mobile Money</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert('depot')}>
            Dépôt
          </Button>
          <Button variante="outline" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert('retrait')}>
            Retrait
          </Button>
          <Button variante="ghost" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert('cash_in')}>
            Cash In
          </Button>
          <Button variante="ghost" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert('cash_out')}>
            Cash Out
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard titre="Total du jour" valeur={transactions.length.toString()} sousTexte="transactions" icone="💳" couleur="primary" />
        <StatCard titre="Montant total" valeur={formatMontant(totalJour)} icone="💵" couleur="success" />
        <StatCard titre="En attente" valeur={enAttente.toString()} sousTexte={`${success} validées`} icone="⏳" couleur={enAttente > 0 ? 'warning' : 'default'} />
      </div>

      {/* Filtres + Recherche */}
      <div className="bg-white rounded-card shadow-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher (référence, agent, client...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icone={<Search size={16} />}
            />
          </div>
          <Button
            variante="ghost"
            taille="md"
            icone={<Filter size={16} />}
            onClick={() => setFiltresOuverts((v) => !v)}
          >
            Filtres {filtresOuverts ? '▲' : '▼'}
          </Button>
          <Button variante="ghost" taille="md" icone={<RefreshCw size={16} />}>
            Actualiser
          </Button>
          <Button
            variante="ghost"
            taille="md"
            icone={<Download size={16} />}
            onClick={() => exporterCsv(transactions, [
              { titre: 'Date', valeur: (t) => formatDate(t.date) },
              { titre: 'Référence', valeur: (t) => t.reference },
              { titre: 'Type', valeur: (t) => TYPE_LABELS[t.type] ?? t.type },
              { titre: 'Agent', valeur: (t) => t.agentNom },
              { titre: 'Agence', valeur: (t) => t.agenceNom },
              { titre: 'Opérateur', valeur: (t) => t.operateur },
              { titre: 'Client', valeur: (t) => t.clientNom ?? '' },
              { titre: 'Téléphone', valeur: (t) => t.clientTel ?? '' },
              { titre: 'Montant (FCFA)', valeur: (t) => t.montant },
              { titre: 'Frais (FCFA)', valeur: (t) => t.frais },
              { titre: 'Commission (FCFA)', valeur: (t) => t.commission },
              { titre: 'Statut', valeur: (t) => STATUT_LABELS[t.statut] ?? t.statut },
            ], 'transactions')}
          >
            Export CSV
          </Button>
        </div>

        {/* Filtres avancés */}
        {filtresOuverts && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            <Select
              placeholder="Tous les types"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Select
              placeholder="Tous opérateurs"
              value={filtreOperateur}
              onChange={(e) => setFiltreOperateur(e.target.value)}
              options={Object.entries(OPERATEURS).map(([v, o]) => ({ value: v, label: o.label }))}
            />
            <Select
              placeholder="Tous statuts"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              options={Object.entries(STATUT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Button
              variante="ghost"
              taille="md"
              onClick={() => { setFiltreType(''); setFiltreOperateur(''); setFiltreStatut(''); setSearch(''); setPage(1); }}
            >
              Effacer filtres
            </Button>
          </div>
        )}
      </div>

      {/* Sélection actions */}
      {selectionnees.length > 0 && (
        <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-main">{selectionnees.length} transaction(s) sélectionnée(s)</span>
          <div className="flex gap-2">
            <Button taille="sm" variante="primary">Valider sélection</Button>
            <Button taille="sm" variante="ghost" onClick={() => setSelectionnees([])}>Désélectionner</Button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <Table
          colonnes={colonnes}
          donnees={transactions}
          loading={isLoading}
          selectionnable
          selectionnees={selectionnees}
          onSelectionChange={setSelectionnees}
          messageVide="Aucune transaction trouvée"
        />

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {totalItems} résultat(s) — Page {page} / {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium ${p === page ? 'bg-primary text-sidebar' : 'border border-gray-200 text-gray-600 hover:bg-surface'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal détail transaction */}
      <Modal
        ouvert={!!transactionSelectionnee}
        onFermer={() => setTransactionSelectionnee(null)}
        titre="Détail de la transaction"
        taille="md"
      >
        {transactionSelectionnee && (
          <div className="space-y-4">
            {/* Badge statut + référence */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-gray-600">{transactionSelectionnee.reference}</span>
              <Badge couleur={badgeStatutTransaction(transactionSelectionnee.statut)} point>
                {STATUT_LABELS[transactionSelectionnee.statut]}
              </Badge>
            </div>
            {/* Grille infos */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <p className="font-semibold">{TYPE_LABELS[transactionSelectionnee.type]}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Opérateur</p>
                <p className="font-semibold">{OPERATEURS[transactionSelectionnee.operateur]?.logo} {OPERATEURS[transactionSelectionnee.operateur]?.label}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Montant</p>
                <p className="font-bold text-lg text-text-main">{formatMontant(transactionSelectionnee.montant)}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Frais</p>
                <p className="font-semibold">{formatMontant(transactionSelectionnee.frais)}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Agent</p>
                <p className="font-semibold">{transactionSelectionnee.agentNom || '—'}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Agence</p>
                <p className="font-semibold">{transactionSelectionnee.agenceNom || '—'}</p>
              </div>
              {transactionSelectionnee.clientNom && (
                <div className="bg-surface rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Client</p>
                  <p className="font-semibold">{transactionSelectionnee.clientNom}</p>
                </div>
              )}
              {transactionSelectionnee.clientTel && (
                <div className="bg-surface rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <p className="font-semibold">{transactionSelectionnee.clientTel}</p>
                </div>
              )}
              <div className="bg-surface rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">Date & heure</p>
                <p className="font-semibold">{formatDate(transactionSelectionnee.date)}</p>
              </div>
            </div>
            {/* Commission */}
            {transactionSelectionnee.commission > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <span className="text-green-700 font-medium">Commission agent : {formatMontant(transactionSelectionnee.commission)}</span>
              </div>
            )}
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {transactionSelectionnee.statut === 'pending' && (
                <Button
                  variante="primary"
                  fullWidth
                  onClick={() => { validerTransaction.mutate(transactionSelectionnee.id); setTransactionSelectionnee(null); }}
                >
                  Valider la transaction
                </Button>
              )}
              <Button variante="ghost" fullWidth onClick={() => setTransactionSelectionnee(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal nouvelle transaction */}
      <Modal
        ouvert={!!modalOuvert}
        onFermer={() => { setModalOuvert(null); setErreurTx(''); setSuccesTx(''); }}
        titre={`Nouvelle transaction — ${modalOuvert ? TYPE_LABELS[modalOuvert] : ''}`}
        taille="md"
      >
        <form className="space-y-4" onSubmit={handleSubmitTx}>
          <Select
            label="Opérateur *"
            value={formTx.operateur}
            onChange={(e) => setFormTx((f) => ({ ...f, operateur: e.target.value }))}
            options={Object.entries(OPERATEURS).map(([v, o]) => ({ value: v, label: `${o.logo} ${o.label}` }))}
          />
          <Input
            label="Montant (FCFA) *"
            type="number"
            placeholder="0"
            value={formTx.montant}
            onChange={(e) => setFormTx((f) => ({ ...f, montant: e.target.value }))}
            icone={<span className="text-xs font-bold">F</span>}
            required
          />
          <Input
            label="Téléphone client"
            type="tel"
            placeholder="+225 07 00 00 00 00"
            value={formTx.clientTel}
            onChange={(e) => setFormTx((f) => ({ ...f, clientTel: e.target.value }))}
          />
          <Input
            label="Nom client"
            placeholder="Nom et prénom"
            value={formTx.clientNom}
            onChange={(e) => setFormTx((f) => ({ ...f, clientNom: e.target.value }))}
          />
          {erreurTx && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurTx}</div>}
          {succesTx && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesTx}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerTransaction.isPending}>
              Valider la transaction
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(null); setErreurTx(''); }}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';
// ============================================================
// PAGE COMMISSIONS — GESTMONEY
// ============================================================
import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { useCommissions, useValiderCommissions, usePayerCommissions } from '@/hooks/useCommissions';
import { Commission } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';

const STATUT_LABELS: Record<string, string> = {
  calculee: 'Calculee',
  validee: 'Validee',
  payee: 'Payee',
};

const STATUT_COULEURS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  calculee: 'warning',
  validee: 'info',
  payee: 'success',
};

export default function CommissionsPage() {
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [selectionnees, setSelectionnees] = useState<string[]>([]);
  const [succes, setSucces] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data: commissions = [], isLoading } = useCommissions(filtrePeriode || undefined);

  const totalPages = Math.ceil(commissions.length / LIMIT);
  const commissionsPage = commissions.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => setPage(1), [filtrePeriode]);
  const valider = useValiderCommissions();
  const payer = usePayerCommissions();

  const handleValider = async (ids: string[]) => {
    await valider.mutateAsync(ids);
    setSelectionnees([]);
    setSucces(`${ids.length} commission(s) validée(s).`);
    setTimeout(() => setSucces(''), 3000);
  };

  const handlePayer = async (ids: string[]) => {
    await payer.mutateAsync(ids);
    setSelectionnees([]);
    setSucces(`${ids.length} commission(s) marquée(s) comme payée(s).`);
    setTimeout(() => setSucces(''), 3000);
  };

  const totalCalculees = commissions.filter((c) => c.statut === 'calculee').reduce((s, c) => s + c.montantCommission, 0);
  const totalValidees = commissions.filter((c) => c.statut === 'validee').reduce((s, c) => s + c.montantCommission, 0);
  const totalPayees = commissions.filter((c) => c.statut === 'payee').reduce((s, c) => s + c.montantCommission, 0);
  const nbCalculees = commissions.filter((c) => c.statut === 'calculee').length;

  const colonnes: Colonne<Commission>[] = [
    {
      key: 'periode',
      titre: 'Periode',
      rendu: (v) => <span className="text-xs font-mono text-gray-600">{String(v)}</span>,
    },
    {
      key: 'agentNom',
      titre: 'Agent',
      triable: true,
    },
    {
      key: 'agenceNom',
      titre: 'Agence',
    },
    {
      key: 'nbTransactions',
      titre: 'Nb transactions',
      align: 'right',
      rendu: (v) => <span className="font-mono text-sm">{Number(v).toLocaleString('fr-FR')}</span>,
    },
    {
      key: 'montantTransactions',
      titre: 'Vol. transactions',
      align: 'right',
      rendu: (v) => <span className="text-sm text-gray-600">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'tauxCommission',
      titre: 'Taux',
      align: 'right',
      rendu: (v) => <span className="text-sm">{Number(v)} %</span>,
    },
    {
      key: 'montantCommission',
      titre: 'Commission',
      triable: true,
      align: 'right',
      rendu: (v) => <span className="font-bold text-text-main">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'statut',
      titre: 'Statut',
      rendu: (v) => (
        <Badge couleur={STATUT_COULEURS[String(v)] || 'neutral'} point>
          {STATUT_LABELS[String(v)] || String(v)}
        </Badge>
      ),
    },
    {
      key: 'datePaiement',
      titre: 'Date paiement',
      rendu: (v) =>
        v ? (
          <span className="text-xs text-gray-500">{formatDate(String(v))}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'id',
      titre: 'Actions',
      rendu: (_, ligne) => (
        <div className="flex gap-1">
          {ligne.statut === 'calculee' && (
            <button
              className="text-xs text-success hover:underline font-medium"
              onClick={() => handleValider([ligne.id])}
              disabled={valider.isPending}
            >
              Valider
            </button>
          )}
          {ligne.statut === 'validee' && (
            <button
              className="text-xs text-primary hover:underline font-medium"
              onClick={() => handlePayer([ligne.id])}
              disabled={payer.isPending}
            >
              Payer
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Commissions</h1>
          <p className="text-sm text-gray-500">Suivi et validation des commissions agents</p>
        </div>
        <div className="flex gap-2">
          <Button
            variante="ghost"
            taille="sm"
            icone={<Download size={15} />}
            onClick={() => exporterCsv(commissions, [
              { titre: 'Agent', valeur: (c) => c.agentNom },
              { titre: 'Agence', valeur: (c) => c.agenceNom },
              { titre: 'Période', valeur: (c) => c.periode },
              { titre: 'Transactions', valeur: (c) => c.nbTransactions },
              { titre: 'Montant transactions (FCFA)', valeur: (c) => c.montantTransactions },
              { titre: 'Taux (%)', valeur: (c) => c.tauxCommission },
              { titre: 'Commission (FCFA)', valeur: (c) => c.montantCommission },
              { titre: 'Statut', valeur: (c) => STATUT_LABELS[c.statut] ?? c.statut },
              { titre: 'Date paiement', valeur: (c) => c.datePaiement ? formatDate(c.datePaiement) : '' },
            ], 'commissions')}
          >
            Exporter CSV
          </Button>
          {selectionnees.length > 0 && (
            <Button
              variante="primary"
              taille="sm"
              icone={<CheckCircle size={15} />}
              loading={valider.isPending || payer.isPending}
              onClick={() => {
                const aValider = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'calculee').map((c) => c.id);
                const aPayer = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'validee').map((c) => c.id);
                if (aValider.length) handleValider(aValider);
                if (aPayer.length) handlePayer(aPayer);
              }}
            >
              Valider {selectionnees.length} paiement(s)
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          titre="A calculer"
          valeur={formatMontant(totalCalculees)}
          sousTexte={`${nbCalculees} commission(s)`}
          icone={<Clock size={18} />}
          couleur="warning"
        />
        <StatCard
          titre="Validees"
          valeur={formatMontant(totalValidees)}
          icone={<TrendingUp size={18} />}
          couleur="primary"
        />
        <StatCard
          titre="Payees"
          valeur={formatMontant(totalPayees)}
          icone={<CheckCircle size={18} />}
          couleur="success"
        />
        <StatCard
          titre="Total commissions"
          valeur={commissions.length.toString()}
          sousTexte="toutes periodes"
          icone="💰"
          couleur="default"
        />
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commissions</CardTitle>
          <div className="flex gap-2 items-center">
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
              value={filtrePeriode}
              onChange={(e) => setFiltrePeriode(e.target.value)}
            >
              <option value="">Toutes periodes</option>
              <option value="2024-01">Janvier 2024</option>
              <option value="2024-02">Fevrier 2024</option>
              <option value="2024-03">Mars 2024</option>
            </select>
          </div>
        </CardHeader>

        {succes && (
          <div className="mx-4 mb-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succes}</div>
        )}
        {selectionnees.length > 0 && (
          <div className="mx-4 mb-3 bg-primary/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-text-main">
              {selectionnees.length} commission(s) selectionnee(s)
            </span>
            <div className="flex gap-2">
              <Button
                taille="sm"
                variante="primary"
                icone={<CheckCircle size={14} />}
                loading={valider.isPending || payer.isPending}
                onClick={() => {
                  const aValider = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'calculee').map((c) => c.id);
                  const aPayer = commissions.filter((c) => selectionnees.includes(c.id) && c.statut === 'validee').map((c) => c.id);
                  if (aValider.length) handleValider(aValider);
                  if (aPayer.length) handlePayer(aPayer);
                }}
              >
                Valider paiement
              </Button>
              <Button taille="sm" variante="ghost" onClick={() => setSelectionnees([])}>
                Deselectionner
              </Button>
            </div>
          </div>
        )}

        <Table
          colonnes={colonnes}
          donnees={commissionsPage}
          loading={isLoading}
          selectionnable
          selectionnees={selectionnees}
          onSelectionChange={setSelectionnees}
          messageVide="Aucune commission trouvee pour cette periode"
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{commissions.length} commission(s) — Page {page} / {totalPages || 1}</p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${p === page ? 'bg-primary text-sidebar' : 'border border-gray-200 text-gray-600 hover:bg-surface'}`}>{p}</button>
            ))}
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

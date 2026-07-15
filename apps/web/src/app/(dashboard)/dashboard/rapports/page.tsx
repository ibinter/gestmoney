'use client';
import React, { useState } from 'react';
import { Download, BarChart2, FileText, FileDown } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Input';
import { formatMontant, formatDate } from '@/lib/formatters';
import { useRapports, useGenererRapport, RapportHistorique } from '@/hooks/useRapports';
import { exporterCsv } from '@/lib/exportCsv';
import { exporterXlsx } from '@/lib/exportPdf';
import { exportToPdf, ColumnType } from '@/lib/pdf';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';

const PERIODES = [
  { value: 'janvier_2024',    label: 'Janvier 2024'    },
  { value: 'decembre_2023',   label: 'Décembre 2023'   },
  { value: 'trimestre_4_2023',label: 'T4 2023'         },
];

export default function RapportsPage() {
  const [periode, setPeriode] = useState('janvier_2024');
  const { data, isLoading } = useRapports(periode);
  const genererRapport = useGenererRapport();
  const t = useT();

  const [succesGen, setSuccesGen] = useState('');
  const [rapport_courant, setRapportCourant] = useState<RapportHistorique | null>(null);

  const COLONNES_OPERATEURS = [
    { titre: 'Rapport',         valeur: () => rapport_courant?.titre ?? '' },
    { titre: 'Opérateur',      valeur: (op: Record<string, unknown>) => String(op.label ?? '') },
    { titre: 'Montant (FCFA)', valeur: (op: Record<string, unknown>) => Number(op.montant ?? 0), align: 'right' as const },
    { titre: '% du total',     valeur: (op: Record<string, unknown>) => Number(op.pct ?? 0),     align: 'right' as const },
  ];

  const handleTelecharger = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    exporterCsv(
      parOperateur.map((op) => ({ ...op, periode: rapport.titre })),
      [
        { titre: 'Rapport',         valeur: () => rapport.titre },
        { titre: 'Opérateur',       valeur: (op) => op.label },
        { titre: 'Montant (FCFA)',  valeur: (op) => op.montant },
        { titre: '% du total',      valeur: (op) => op.pct },
      ],
      rapport.titre.toLowerCase().replace(/\s+/g, '_')
    );
  };

  const handleTelechargerPdf = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    // Si le backend a généré un fichier, on le télécharge directement
    if (rapport.fileUrl) {
      window.open(rapport.fileUrl, '_blank');
      return;
    }
    const kpis = [
      { label: "Chiffre d'affaires", valeur: formatMontant(ca) },
      { label: 'Transactions',       valeur: nbTransactions.toLocaleString('fr-FR') },
      { label: 'Nouveaux clients',   valeur: nouveauxClients.toString() },
      { label: 'Ticket moyen',       valeur: formatMontant(ticketMoyen) },
    ];
    exportToPdf({
      title: rapport.titre,
      columns: [
        { key: 'label',   label: 'Opérateur',      type: ColumnType.NAME },
        { key: 'montant', label: 'Montant (FCFA)',  type: ColumnType.AMOUNT, align: 'right' },
        { key: 'pct',     label: '% du total',     type: ColumnType.AMOUNT, align: 'right' },
      ],
      rows: parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
      options: {
        subtitle: 'Rapport mensuel',
        period: rapport.titre,
        filename: rapport.titre.toLowerCase().replace(/\s+/g, '_'),
        kpis: kpis.map((k) => ({ label: k.label, value: k.valeur })),
      },
    });
  };

  const handleTelechargerXlsx = (rapport: RapportHistorique) => {
    setRapportCourant(rapport);
    exporterXlsx(
      parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
      COLONNES_OPERATEURS,
      { titre: rapport.titre, sousTitre: 'Rapport mensuel', periode: rapport.titre, nomFichier: rapport.titre.toLowerCase().replace(/\s+/g,'_') }
    );
  };

  const handleGenerer = async () => {
    await genererRapport.mutateAsync({ periode });
    setSuccesGen('Rapport en cours de génération. Disponible dans quelques instants.');
    setTimeout(() => setSuccesGen(''), 4000);
  };

  const ca              = data?.ca              ?? 0;
  const nbTransactions  = data?.nbTransactions  ?? 0;
  const nouveauxClients = data?.nouveauxClients ?? 0;
  const ticketMoyen     = data?.ticketMoyen     ?? 0;
  const objectif        = data?.objectif        ?? 200_000_000;
  const progression     = data?.progression     ?? 0;
  const parOperateur    = data?.parOperateur    ?? [];
  const topAgents       = data?.topAgents       ?? [];
  const alertes         = data?.alertes         ?? [];
  const historique      = data?.historique      ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t.rapports.title}</h1>
          <p className="text-sm text-gray-500">{t.rapports.subtitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="Période"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            options={PERIODES}
          />
          <Button
            variante="secondary"
            taille="sm"
            icone={<FileText size={15} />}
            onClick={() => {
              const kpis = [
                { label: "Chiffre d'affaires", valeur: formatMontant(ca) },
                { label: 'Transactions',       valeur: nbTransactions.toLocaleString('fr-FR') },
                { label: 'Nouveaux clients',   valeur: nouveauxClients.toString() },
                { label: 'Ticket moyen',       valeur: formatMontant(ticketMoyen) },
              ];
              exportToPdf({
                title: `Rapport ${PERIODES.find(p => p.value === periode)?.label ?? periode}`,
                columns: [
                  { key: 'label',   label: 'Opérateur',     type: ColumnType.NAME },
                  { key: 'montant', label: 'Montant (FCFA)', type: ColumnType.AMOUNT, align: 'right' },
                  { key: 'pct',     label: '% du total',    type: ColumnType.AMOUNT, align: 'right' },
                ],
                rows: parOperateur.map((op) => ({ ...op }) as Record<string, unknown>),
                options: {
                  subtitle: 'Business Intelligence',
                  period: PERIODES.find(p => p.value === periode)?.label,
                  kpis: kpis.map((k) => ({ label: k.label, value: k.valeur })),
                },
              });
            }}
          >
            {t.rapports.exportPdf}
          </Button>
          <Button
            variante="primary"
            taille="sm"
            icone={<BarChart2 size={15} />}
            onClick={handleGenerer}
            loading={genererRapport.isPending}
          >
            {t.rapports.generate}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre="Chiffre d'affaires" valeur={formatMontant(ca)} variation={data?.variationCa} icone="📈" couleur="success" />
        <StatCard titre="Nb transactions" valeur={nbTransactions.toLocaleString('fr-FR')} variation={data?.variationTx} icone="💳" couleur="primary" />
        <StatCard titre="Nouveaux clients" valeur={nouveauxClients.toString()} variation={data?.variationClients} icone="👥" couleur="default" />
        <StatCard titre="Ticket moyen" valeur={formatMontant(ticketMoyen)} icone="🎫" couleur="default" />
      </div>

      {/* Message génération */}
      {succesGen && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesGen}</div>
      )}

      {/* Alertes BI */}
      {alertes.length > 0 && (
        <div className="space-y-2">
          {alertes.map((a) => (
            <div key={a.id} className={clsx('flex items-start gap-3 rounded-xl p-3 text-sm', {
              'bg-red-50 border border-red-200':    a.type === 'danger',
              'bg-yellow-50 border border-yellow-200': a.type === 'warning',
              'bg-blue-50 border border-blue-200':  a.type === 'info',
            })}>
              <span>{a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : 'ℹ️'}</span>
              <p className={clsx({ 'text-red-700': a.type === 'danger', 'text-yellow-700': a.type === 'warning', 'text-blue-700': a.type === 'info' })}>
                {a.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par opérateur */}
        <Card>
          <CardHeader>
            <CardTitle>Volume par opérateur</CardTitle>
            <span className="text-xs text-gray-400">{formatMontant(ca)} total</span>
          </CardHeader>
          <div className="space-y-3">
            {parOperateur.map((op) => (
              <div key={op.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{op.logo}</span>
                    <span className="font-medium">{op.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text-main">{formatMontant(op.montant)}</span>
                    <span className="text-xs text-gray-400 ml-2">{op.pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${op.pct}%`, backgroundColor: op.couleur }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 agents du mois</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {topAgents.map((agent, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {agent.badge || (i + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">{agent.nom}</p>
                  <p className="text-xs text-gray-400">{agent.agence} — {agent.nbTx} tx</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-text-main">{formatMontant(agent.montant)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Progression objectif */}
      <Card>
        <CardHeader>
          <CardTitle>Progression vers l&apos;objectif mensuel</CardTitle>
          <span className="text-sm font-bold text-text-main">{progression}%</span>
        </CardHeader>
        <div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-400 transition-all duration-1000"
              style={{ width: `${Math.min(progression, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="text-text-main font-semibold">{formatMontant(ca)} {t.rapports.achieved}</span>
            <span>{t.rapports.objective} : {formatMontant(objectif)}</span>
          </div>
        </div>
      </Card>

      {/* Historique des rapports */}
      <Card>
        <CardHeader>
          <CardTitle>{t.rapports.history}</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {historique.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">{r.titre}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.date)} — {r.taille}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge couleur={r.statut === 'disponible' ? 'success' : 'warning'}>
                  {r.statut === 'disponible' ? 'Disponible' : 'En cours'}
                </Badge>
                {r.statut === 'disponible' && (
                  <>
                    <Button variante="ghost" taille="sm" icone={<Download size={13} />} onClick={() => handleTelecharger(r)}>
                      CSV
                    </Button>
                    <Button variante="ghost" taille="sm" icone={<FileDown size={13} />} onClick={() => handleTelechargerXlsx(r)}>
                      XLSX
                    </Button>
                    <Button variante="ghost" taille="sm" icone={<FileText size={13} />} onClick={() => handleTelechargerPdf(r)}>
                      PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

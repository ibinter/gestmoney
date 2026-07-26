'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgenceDashboard } from '@/hooks/useAgences';
import { GmPageHeader } from '@/components/gm';
import { formatDate } from '@/lib/formatters';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formaterMontant(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function badgeStatut(statut: string) {
  const palette: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING:   'bg-yellow-100 text-yellow-800',
    FAILED:    'bg-red-100 text-red-800',
    REVERSED:  'bg-purple-100 text-purple-800',
  };
  const label: Record<string, string> = {
    COMPLETED: 'Complété',
    PENDING:   'En cours',
    FAILED:    'Échoué',
    REVERSED:  'Reversé',
  };
  const cls = palette[statut] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label[statut] ?? statut}
    </span>
  );
}

function badgeAgentStatut(statut: string) {
  return statut === 'ACTIVE'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Actif</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Inactif</span>;
}

// ─── Graphique barres CSS 7 jours ─────────────────────────────────────────────

function GraphiqueBarres({ jours }: { jours: { date: string; count: number; volume: number }[] }) {
  const max = Math.max(...jours.map((j) => j.count), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {jours.map((j) => {
        const pct = Math.round((j.count / max) * 100);
        const label = new Date(j.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        return (
          <div key={j.date} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs text-gray-500 font-medium">{j.count}</span>
            <div
              className="w-full bg-emerald-500 rounded-t transition-all"
              style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}
              title={`${j.count} tx — ${formaterMontant(j.volume)}`}
            />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color,
}: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Squelette de chargement ──────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AgenceDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { data, isLoading, isError } = useAgenceDashboard(id as string);

  if (isLoading) return <Skeleton />;

  if (isError || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium mb-4">Impossible de charger le tableau de bord de cette agence.</p>
        <button onClick={() => router.back()} className="text-sm text-emerald-700 underline">
          Retour
        </button>
      </div>
    );
  }

  const { agence, kpis, evolution7Jours, agents, derniereTransactions } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* ── Header agence ────────────────────────────────────────────────── */}
      <GmPageHeader
        fil={['Accueil', 'Agences', agence?.name ?? id]}
        titre={agence?.name ?? 'Agence'}
        sousTitre={[agence?.address, agence?.city].filter(Boolean).join(', ') || 'Tableau de bord'}
        actions={
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
              ${agence?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {agence?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
            <Link
              href={`/dashboard/agences?edit=${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Modifier l&apos;agence
            </Link>
          </div>
        }
      />

      {/* ── 4 KPI Cards ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Indicateurs du mois en cours
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Transactions"
            value={kpis.nbTransactions.toLocaleString('fr-FR')}
            sub="ce mois"
            color="bg-green-50 border-green-200"
          />
          <KpiCard
            label="Volume"
            value={formaterMontant(kpis.volume)}
            sub="ce mois"
            color="bg-blue-50 border-blue-200"
          />
          <KpiCard
            label="Commissions"
            value={formaterMontant(kpis.commissions)}
            sub="générées"
            color="bg-amber-50 border-amber-200"
          />
          <KpiCard
            label="Agents actifs"
            value={kpis.agentsActifs}
            sub={`/ ${agents.length} agents`}
            color="bg-purple-50 border-purple-200"
          />
        </div>
      </section>

      {/* ── Graphique 7 jours ─────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
          Transactions — 7 derniers jours
        </h2>
        {evolution7Jours?.length > 0 ? (
          <GraphiqueBarres jours={evolution7Jours} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        )}
      </section>

      {/* ── Tableau agents ────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Agents ({agents.length})
          </h2>
        </div>
        {agents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun agent dans cette agence</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3 text-right">Float</th>
                  <th className="px-4 py-3 text-right">Tx / mois</th>
                  <th className="px-4 py-3 text-right">Volume mois</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.nom}</p>
                      <p className="text-xs text-gray-400">{a.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      <span className={a.float < 100_000 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {formaterMontant(a.float)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{a.nbTxMois}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formaterMontant(a.volumeMois)}</td>
                    <td className="px-4 py-3">{badgeAgentStatut(a.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 10 dernières transactions ─────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            10 dernières transactions
          </h2>
        </div>
        {!derniereTransactions?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune transaction</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {derniereTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{tx.reference ?? tx.id.slice(0, 12)}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.type}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formaterMontant(Number(tx.amount ?? 0))}</td>
                    <td className="px-4 py-3">{badgeStatut(tx.status)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

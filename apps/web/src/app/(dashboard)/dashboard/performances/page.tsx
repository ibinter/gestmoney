'use client';
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Award, Target, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Input';
import { formatMontant } from '@/lib/formatters';
import { usePerformances } from '@/hooks/usePerformances';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';

export default function PerformancesPage() {
  const t = useT();
  const PERIODES = [
    { value: 'semaine', label: t.performances.periods.semaine },
    { value: 'mois', label: t.performances.periods.mois },
    { value: 'trimestre', label: t.performances.periods.trimestre },
  ];
  const [periode, setPeriode] = useState('mois');
  const { data, isLoading } = usePerformances(periode);

  const totalVol = data?.totalVolume ?? 0;
  const totalTx = data?.totalTransactions ?? 0;
  const tauxSucces = data?.tauxSucces ?? 0;
  const ticketMoyen = data?.ticketMoyen ?? 0;
  const parOperateur = data?.parOperateur ?? [];
  const topAgents = data?.topAgents ?? [];
  const evolutionHebdo = data?.evolutionHebdo ?? [];
  const objectifs = data?.objectifs;

  const maxVol = Math.max(...evolutionHebdo.map((d) => d.volume), 1);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
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
          <h1 className="text-2xl font-bold text-text-main">{t.performances.title}</h1>
          <p className="text-sm text-gray-500">{t.performances.subtitle}</p>
        </div>
        <Select
          placeholder={t.performances.periodPlaceholder}
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          options={PERIODES}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre={t.performances.kpi.volumeTotal} valeur={formatMontant(totalVol)} variation={data?.evolutionVolume} icone={<Activity size={18} />} couleur="success" />
        <StatCard titre={t.performances.kpi.nbTransactions} valeur={totalTx.toLocaleString('fr-FR')} variation={data?.evolutionTransactions} icone="💳" couleur="primary" />
        <StatCard titre={t.performances.kpi.tauxSucces} valeur={`${tauxSucces}%`} sousTexte={t.performances.kpi.objectif95} icone="✅" couleur="success" />
        <StatCard titre={t.performances.kpi.ticketMoyen} valeur={formatMontant(ticketMoyen)} icone="🎫" couleur="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution hebdomadaire */}
        <Card>
          <CardHeader>
            <CardTitle>{t.performances.evolution.title}</CardTitle>
            <span className="text-xs text-gray-400">{t.performances.evolution.sub}</span>
          </CardHeader>
          <div className="space-y-2">
            {evolutionHebdo.map((d) => {
              const pct = Math.round((d.volume / maxVol) * 100);
              return (
                <div key={d.jour} className="flex items-center gap-3">
                  <span className="w-8 text-xs text-gray-400 text-center font-medium">{d.jour}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right w-24 flex-shrink-0">
                    <p className="text-xs font-semibold text-text-main">{formatMontant(d.volume)}</p>
                    <p className="text-[10px] text-gray-400">{d.nbTransactions} {t.performances.evolution.txSuffix}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Performance par opérateur */}
        <Card>
          <CardHeader>
            <CardTitle>{t.performances.operatorTitle}</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {parOperateur.map((op) => {
              const pct = totalVol > 0 ? Math.round((op.volume / totalVol) * 100) : 0;
              return (
                <div key={op.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{op.logo}</span>
                      <div>
                        <span className="text-sm font-medium text-text-main">{op.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{op.nbTransactions.toLocaleString('fr-FR')} {t.performances.evolution.txSuffix}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-main">{pct}%</span>
                      <span className={clsx('text-xs font-medium flex items-center gap-0.5', op.variation >= 0 ? 'text-success' : 'text-danger')}>
                        {op.variation >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {Math.abs(op.variation)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: op.couleur }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Classement agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award size={18} className="text-primary" /> {t.performances.ranking.title}
          </CardTitle>
          <Badge couleur="info">{periode === 'semaine' ? t.performances.periodBadges.semaine : periode === 'mois' ? t.performances.periodBadges.mois : t.performances.periodBadges.trimestre}</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colRang}</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colAgent}</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colVolume}</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colTransactions}</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colTauxSucces}</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.performances.ranking.colEvolution}</th>
              </tr>
            </thead>
            <tbody>
              {topAgents.map((a) => (
                <tr key={a.rang} className="border-b border-gray-50 hover:bg-surface transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {a.badge || a.rang}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-text-main">{a.nom}</p>
                    <p className="text-xs text-gray-400">{a.agence}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-text-main">{formatMontant(a.volume)}</td>
                  <td className="py-3 px-4 text-right font-mono">{a.nbTransactions}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={clsx('font-semibold', a.tauxSucces >= 95 ? 'text-success' : 'text-warning')}>
                      {a.tauxSucces}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={clsx('flex items-center justify-end gap-0.5 text-xs font-medium', a.evolution >= 0 ? 'text-success' : 'text-danger')}>
                      {a.evolution >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(a.evolution)} {t.performances.ranking.ranksSuffix}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Objectifs réseau */}
      {objectifs && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.performances.objectifs.volume, actuel: objectifs.volume.actuel, cible: objectifs.volume.cible, couleur: '#6C5CE7' },
            { label: t.performances.objectifs.transactions, actuel: objectifs.transactions.actuel, cible: objectifs.transactions.cible, couleur: '#00B894', format: 'nombre' as const },
            { label: t.performances.objectifs.tauxSucces, actuel: objectifs.tauxSucces.actuel, cible: objectifs.tauxSucces.cible, couleur: '#FDCB6E', format: 'pct' as const },
          ].map((obj) => {
            const pct = Math.min(Math.round((obj.actuel / obj.cible) * 100), 100);
            const valStr = obj.format === 'nombre'
              ? obj.actuel.toLocaleString('fr-FR')
              : obj.format === 'pct'
              ? `${obj.actuel}%`
              : formatMontant(obj.actuel);
            const cibleStr = obj.format === 'nombre'
              ? obj.cible.toLocaleString('fr-FR')
              : obj.format === 'pct'
              ? `${obj.cible}%`
              : formatMontant(obj.cible);
            return (
              <div key={obj.label} className="bg-white rounded-card shadow-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-text-main">{obj.label}</p>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-xl font-bold text-text-main">{pct}%</span>
                  <span className="text-xs text-gray-400">{valStr} / {cibleStr}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: obj.couleur }}
                  />
                </div>
                <p className={clsx('text-xs mt-2', pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger')}>
                  {pct >= 100 ? t.performances.objectifs.reached : pct >= 80 ? t.performances.objectifs.onTrack : pct >= 50 ? t.performances.objectifs.attention : t.performances.objectifs.late}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

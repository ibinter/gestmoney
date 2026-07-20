'use client';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const PERIODES = ['7j', '30j', '90j', '12m'];

// Données simulées
const generateSeries = (points: number, base: number, variance: number) =>
  Array.from({ length: points }, (_, i) => Math.max(0, base + Math.sin(i * 0.5) * variance + (Math.random() - 0.5) * variance * 0.5));

const TRAFFIC_DATA = {
  '7j': generateSeries(7, 1200, 300),
  '30j': generateSeries(30, 1200, 400),
  '90j': generateSeries(90, 1100, 500),
  '12m': generateSeries(12, 1500, 600),
};

const topPages = (t: Translations) => [
  { page: '/', label: t.superadmin.analytics.pages.landing, vues: 4_821, duree: '1m 45s', rebond: '62%' },
  { page: '/login', label: t.superadmin.analytics.pages.login, vues: 2_340, duree: '0m 55s', rebond: '35%' },
  { page: '/dashboard', label: t.superadmin.analytics.pages.dashboard, vues: 1_982, duree: '4m 12s', rebond: '15%' },
  { page: '/#tarifs', label: t.superadmin.analytics.pages.tarifs, vues: 1_456, duree: '1m 20s', rebond: '48%' },
  { page: '/legal/cgu', label: t.superadmin.analytics.pages.cgu, vues: 342, duree: '2m 30s', rebond: '72%' },
];

const topEvents = (t: Translations) => [
  { event: 'cta_click', label: t.superadmin.analytics.events.ctaClick, count: 892, taux: '18.5%' },
  { event: 'demo_request', label: t.superadmin.analytics.events.demoRequest, count: 143, taux: '3.0%' },
  { event: 'login_success', label: t.superadmin.analytics.events.loginSuccess, count: 2_210, taux: '—' },
  { event: 'pwa_install_prompt', label: t.superadmin.analytics.events.pwaPrompt, count: 521, taux: '10.8%' },
  { event: 'sara_open', label: t.superadmin.analytics.events.saraOpen, count: 768, taux: '15.9%' },
];

const sourcesList = (t: Translations) => [
  { source: t.superadmin.analytics.sources.organique, sessions: 2_134, pct: 44 },
  { source: t.superadmin.analytics.sources.direct, sessions: 1_243, pct: 26 },
  { source: t.superadmin.analytics.sources.social, sessions: 768, pct: 16 },
  { source: t.superadmin.analytics.sources.partenaires, sessions: 482, pct: 10 },
  { source: t.superadmin.analytics.sources.emails, sessions: 192, pct: 4 },
];

const paysTop = (t: Translations) => [
  { pays: t.superadmin.analytics.pays.ci, flag: '🇨🇮', sessions: 1_821 },
  { pays: t.superadmin.analytics.pays.sn, flag: '🇸🇳', sessions: 934 },
  { pays: t.superadmin.analytics.pays.gh, flag: '🇬🇭', sessions: 712 },
  { pays: t.superadmin.analytics.pays.ml, flag: '🇲🇱', sessions: 489 },
  { pays: t.superadmin.analytics.pays.bj, flag: '🇧🇯', sessions: 367 },
];

function MiniSparkline({ data, couleur = '#009E00' }: { data: number[]; couleur?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const area = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 48 }}>
      <defs>
        <linearGradient id={`grad-${couleur.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={couleur} stopOpacity="0.3" />
          <stop offset="100%" stopColor={couleur} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${couleur.replace('#','')})`} />
      <path d={path} stroke={couleur} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="3" fill={couleur} />
    </svg>
  );
}

export default function AnalyticsPage() {
  const t = useT();
  const TOP_PAGES = topPages(t);
  const TOP_EVENTS = topEvents(t);
  const SOURCES = sourcesList(t);
  const PAYS_TOP = paysTop(t);
  const [periode, setPeriode] = useState<keyof typeof TRAFFIC_DATA>('30j');

  const trafficData = TRAFFIC_DATA[periode];
  const totalSessions = Math.round(trafficData.reduce((a, b) => a + b, 0));
  const moyJour = Math.round(totalSessions / trafficData.length);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">{t.superadmin.analytics.title}</h1>
          <p className="text-sm text-text-muted">{t.superadmin.analytics.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {PERIODES.map(p => (
            <button key={p} onClick={() => setPeriode(p as keyof typeof TRAFFIC_DATA)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${periode === p ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.superadmin.analytics.kpi.sessions, val: totalSessions.toLocaleString(), delta: '+12%', c: '#009E00' },
          { label: t.superadmin.analytics.kpi.moyJour, val: moyJour.toLocaleString(), delta: '+8%', c: '#0ea5e9' },
          { label: t.superadmin.analytics.kpi.rebond, val: '54%', delta: '-3%', c: '#f59e0b', inversed: true },
          { label: t.superadmin.analytics.kpi.conversions, val: '143', delta: '+22%', c: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: k.c }}>{k.val}</p>
            <p className={`text-xs font-bold mt-1 ${k.delta.startsWith('+') !== k.inversed ? 'text-green-600' : 'text-red-500'}`}>{k.delta} {t.superadmin.analytics.vsPrevious}</p>
          </div>
        ))}
      </div>

      {/* Graphe trafic */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-text-main">{t.superadmin.analytics.trafficTitle}</h2>
          <p className="text-sm text-text-muted">{t.superadmin.analytics.lastN} {periode}</p>
        </div>
        <MiniSparkline data={trafficData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top pages */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.topPagesTitle}</h2>
          <div className="space-y-3">
            {TOP_PAGES.map((p, i) => (
              <div key={p.page} className="flex items-center gap-3">
                <span className="text-xs font-black text-text-muted w-5 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{p.label}</p>
                  <p className="text-xs font-mono text-text-muted truncate">{p.page}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black tabular-nums text-text-main">{p.vues.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">{p.duree}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top événements */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.topEventsTitle}</h2>
          <div className="space-y-3">
            {TOP_EVENTS.map(e => (
              <div key={e.event} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main">{e.label}</p>
                  <p className="text-xs font-mono text-text-muted">{e.event}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black tabular-nums text-text-main">{e.count.toLocaleString()}</p>
                  <p className="text-xs text-brand-green font-bold">{e.taux}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sources */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.sourcesTitle}</h2>
          <div className="space-y-3">
            {SOURCES.map(s => (
              <div key={s.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-text-main">{s.source}</span>
                  <span className="tabular-nums text-text-muted">{s.sessions.toLocaleString()} · <strong>{s.pct}%</strong></span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top pays */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.countriesTitle}</h2>
          <div className="space-y-3">
            {PAYS_TOP.map((p, i) => (
              <div key={p.pays} className="flex items-center gap-3">
                <span className="text-2xl">{p.flag}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-text-main">{p.pays}</span>
                    <span className="tabular-nums font-bold text-text-main">{p.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.sessions / PAYS_TOP[0].sessions * 100}%`, background: ['#009E00','#FFD000','#0ea5e9','#8b5cf6','#f59e0b'][i] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

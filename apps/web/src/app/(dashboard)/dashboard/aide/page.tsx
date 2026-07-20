'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, HelpCircle, LifeBuoy, Bot, Zap,
  ArrowRight, ChevronRight, Activity, Bell, ArrowLeftRight,
  Wallet, Users, BarChart3, Shield, ExternalLink, Star,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Données (structure ; les libellés viennent du dictionnaire i18n) ──────

type CleCategorie = keyof Translations['aide']['centre']['categories'];
type CleArticle = keyof Translations['aide']['centre']['articles'];
type CleFaqRapide = keyof Translations['aide']['centre']['faqRapide'];
type CleIndexFaq = keyof Translations['aide']['centre']['indexFaq'];
type CleLienRapide = keyof Translations['aide']['centre']['quickLinks'];
type CleService = keyof Translations['aide']['centre']['services'];
type CleStatut = keyof Translations['aide']['centre']['servicesStatus'];

const CATEGORIES: { id: CleCategorie; icone: typeof BookOpen; couleur: string; bg: string; lien: string }[] = [
  { id: 'guide',   icone: BookOpen,   couleur: '#009E00', bg: '#009E0015', lien: '/dashboard/guide' },
  { id: 'faq',     icone: HelpCircle, couleur: '#3B82F6', bg: '#3B82F615', lien: '/dashboard/faq' },
  { id: 'support', icone: LifeBuoy,   couleur: '#F59E0B', bg: '#F59E0B15', lien: '/dashboard/support' },
  { id: 'sara',    icone: Bot,        couleur: '#8B5CF6', bg: '#8B5CF615', lien: '#sara' },
];

const LIENS_RAPIDES: { id: CleLienRapide; icone: typeof BookOpen; lien: string; couleur: string }[] = [
  { id: 'transaction', icone: ArrowLeftRight, lien: '/dashboard/transactions', couleur: '#009E00' },
  { id: 'agent',       icone: Users,          lien: '/dashboard/agents',       couleur: '#3B82F6' },
  { id: 'float',       icone: Wallet,         lien: '/dashboard/float',        couleur: '#F59E0B' },
  { id: 'rapport',     icone: BarChart3,      lien: '/dashboard/rapports',     couleur: '#EC4899' },
  { id: 'deuxFa',      icone: Shield,         lien: '/dashboard/settings',     couleur: '#E60000' },
  { id: 'ticket',      icone: LifeBuoy,       lien: '/dashboard/support',      couleur: '#8B5CF6' },
];

const ARTICLES_POPULAIRES: { id: CleArticle; lien: string }[] = [
  { id: 'a1', lien: '/dashboard/guide' },
  { id: 'a2', lien: '/dashboard/guide' },
  { id: 'a3', lien: '/dashboard/guide' },
  { id: 'a4', lien: '/dashboard/guide' },
  { id: 'a5', lien: '/dashboard/guide' },
  { id: 'a6', lien: '/dashboard/guide' },
  { id: 'a7', lien: '/dashboard/guide' },
  { id: 'a8', lien: '/dashboard/guide' },
];

const FAQ_RAPIDE: { id: CleFaqRapide; lien: string }[] = [
  { id: 'f1', lien: '/dashboard/faq' },
  { id: 'f2', lien: '/dashboard/faq' },
  { id: 'f3', lien: '/dashboard/faq' },
  { id: 'f4', lien: '/dashboard/faq' },
  { id: 'f5', lien: '/dashboard/faq' },
];

const STATUT_SERVICES: { id: CleService; statut: CleStatut }[] = [
  { id: 'web',    statut: 'operationnel' },
  { id: 'api',    statut: 'operationnel' },
  { id: 'orange', statut: 'operationnel' },
  { id: 'wave',   statut: 'degradation' },
  { id: 'mtn',    statut: 'operationnel' },
  { id: 'sara',   statut: 'operationnel' },
];

const STATUT_COLOR: Record<CleStatut, { dot: string; text: string }> = {
  operationnel: { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  degradation:  { dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-600 dark:text-yellow-400' },
  incident:     { dot: 'bg-red-500 animate-pulse',    text: 'text-red-600 dark:text-red-400' },
};

// ─── Recherche globale simple ──────────────────────────────────────────────
const INDEX_FAQ: { id: CleIndexFaq; type: 'guide' | 'faq' | 'ticket'; lien: string }[] = [
  { id: 'i1', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i2', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i3', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i4', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i5', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i6', type: 'faq',    lien: '/dashboard/faq' },
  { id: 'i7', type: 'guide',  lien: '/dashboard/guide' },
  { id: 'i8', type: 'guide',  lien: '/dashboard/guide' },
  { id: 'i9', type: 'ticket', lien: '/dashboard/support' },
];

// ─── Page principale ───────────────────────────────────────────────────────
export default function AidePage() {
  const t = useT();
  const c = t.aide.centre;
  const [recherche, setRecherche] = useState('');

  /** Index de recherche construit dans la langue active. */
  const indexRecherche = useMemo(() => [
    ...ARTICLES_POPULAIRES.map((a) => ({
      type: 'guide' as const, titre: c.articles[a.id].titre, sous: c.articles[a.id].section, lien: a.lien,
    })),
    ...INDEX_FAQ.map((f) => ({
      type: f.type, titre: c.indexFaq[f.id].titre, sous: c.indexFaq[f.id].sous, lien: f.lien,
    })),
  ], [c]);

  const resultats = useMemo(() => {
    if (!recherche.trim() || recherche.length < 2) return [];
    const q = recherche.toLowerCase();
    return indexRecherche.filter((r) =>
      r.titre.toLowerCase().includes(q) || r.sous.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [recherche, indexRecherche]);

  return (
    <div className="space-y-10 max-w-5xl mx-auto">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#009E00] via-[#007a00] to-[#005700] px-8 py-10 text-white">
        {/* Cercles déco */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/05 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#FFD000]/10 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-[#FFD000]" />
            <span className="text-sm font-semibold text-white/80">{c.badge}</span>
          </div>
          <h1 className="text-3xl font-black mb-2">{c.heroTitle}</h1>
          <p className="text-white/75 text-sm mb-6 max-w-lg">
            {c.heroSubtitle}
          </p>

          {/* Barre de recherche */}
          <div className="relative max-w-xl">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            <input
              type="text"
              placeholder={c.searchPlaceholder}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/15 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFD000]/50 focus:bg-white/20 transition-all text-sm backdrop-blur-sm"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs"
              >
                {c.clear}
              </button>
            )}
          </div>

          {/* Résultats de recherche */}
          {resultats.length > 0 && (
            <div className="absolute z-20 top-full mt-2 w-full max-w-xl bg-white dark:bg-[hsl(0_0%_12%)] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {resultats.map((r, i) => (
                <Link
                  key={i}
                  href={r.lien}
                  onClick={() => setRecherche('')}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/05 transition-colors border-b border-gray-100 dark:border-white/05 last:border-0"
                >
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', r.type === 'guide' ? 'bg-[#009E00]/10' : r.type === 'faq' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20')}>
                    {r.type === 'guide' ? <BookOpen size={13} className="text-[#009E00]" /> : r.type === 'faq' ? <HelpCircle size={13} className="text-blue-500" /> : <LifeBuoy size={13} className="text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{r.titre}</p>
                    <p className="text-xs text-gray-400">{r.sous}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
          {recherche.trim().length >= 2 && resultats.length === 0 && (
            <div className="absolute z-20 top-full mt-2 w-full max-w-xl bg-white dark:bg-[hsl(0_0%_12%)] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.noResultFor.replace('{q}', recherche)}</p>
              <Link href="/dashboard/support" className="text-[#009E00] text-sm font-semibold mt-2 inline-block hover:underline">
                {c.openTicketLink}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Catégories principales ───────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-text-main mb-4">{c.resourcesTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.lien}
              className="group bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 hover:border-[#009E00]/30 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: cat.bg }}>
                <cat.icone size={22} style={{ color: cat.couleur }} />
              </div>
              <h3 className="font-bold text-text-main text-sm mb-1 group-hover:text-[#009E00] transition-colors">{c.categories[cat.id].titre}</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-3">{c.categories[cat.id].description}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.couleur }}>
                {c.categories[cat.id].badge}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Articles populaires ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main">{c.popularTitle}</h2>
            <Link href="/dashboard/guide" className="text-xs text-[#009E00] font-semibold hover:underline flex items-center gap-1">
              {c.seeFullGuide} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 divide-y divide-gray-50 dark:divide-white/05">
            {ARTICLES_POPULAIRES.map((a) => (
              <Link
                key={a.id}
                href={a.lien}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/03 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#009E00]/08 flex items-center justify-center flex-shrink-0">
                  <Star size={13} className="text-[#009E00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main group-hover:text-[#009E00] transition-colors truncate">{c.articles[a.id].titre}</p>
                  <p className="text-xs text-text-muted">{c.articles[a.id].section}</p>
                </div>
                <ChevronRight size={14} className="text-text-muted group-hover:text-[#009E00] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* FAQ rapide */}
          <div className="flex items-center justify-between mt-6">
            <h2 className="text-lg font-bold text-text-main">{c.faqTitle}</h2>
            <Link href="/dashboard/faq" className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1">
              {c.faqAll} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 divide-y divide-gray-50 dark:divide-white/05">
            {FAQ_RAPIDE.map((f) => (
              <Link
                key={f.id}
                href={f.lien}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/03 transition-colors group"
              >
                <HelpCircle size={15} className="text-blue-400 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium text-text-main group-hover:text-blue-500 transition-colors">{c.faqRapide[f.id]}</p>
                <ChevronRight size={14} className="text-text-muted group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Liens rapides */}
          <div>
            <h2 className="text-lg font-bold text-text-main mb-3">{c.quickAccessTitle}</h2>
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 divide-y divide-gray-50 dark:divide-white/05">
              {LIENS_RAPIDES.map((l) => (
                <Link
                  key={l.id}
                  href={l.lien}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/03 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: l.couleur + '15' }}>
                    <l.icone size={14} style={{ color: l.couleur }} />
                  </div>
                  <span className="text-sm font-medium text-text-main group-hover:text-[#009E00] transition-colors">{c.quickLinks[l.id]}</span>
                  <ArrowRight size={12} className="ml-auto text-text-muted group-hover:text-[#009E00] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* État des services */}
          <div>
            <h2 className="text-base font-bold text-text-main mb-3 flex items-center gap-2">
              <Activity size={16} className="text-[#009E00]" />
              {c.servicesTitle}
            </h2>
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 divide-y divide-gray-50 dark:divide-white/05">
              {STATUT_SERVICES.map((s) => {
                const cfg = STATUT_COLOR[s.statut];
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-text-main font-medium">{c.services[s.id]}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
                      <span className={clsx('text-[10px] font-semibold', cfg.text)}>{c.servicesStatus[s.statut]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-[#009E00]/08 to-[#FFD000]/08 rounded-2xl border border-[#009E00]/15 p-5">
            <h3 className="font-bold text-text-main text-sm mb-1">{c.contactTitle}</h3>
            <p className="text-xs text-text-muted mb-4">{c.contactSub}</p>
            <div className="space-y-2">
              <a
                href="mailto:support@ibigsoft.com"
                className="flex items-center gap-2 w-full bg-white dark:bg-white/08 border border-gray-200 dark:border-white/10 text-text-main text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/12 transition-colors"
              >
                <ExternalLink size={13} />
                support@ibigsoft.com
              </a>
              <Link
                href="/dashboard/support"
                className="flex items-center gap-2 w-full bg-[#009E00] text-white text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-[#007a00] transition-colors"
              >
                <LifeBuoy size={13} />
                {c.openTicket}
              </Link>
            </div>
          </div>

          {/* Nouveautés */}
          <div className="bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={15} className="text-[#b8960a] dark:text-[#FFD000]" />
              <span className="text-xs font-bold text-[#b8960a] dark:text-[#FFD000]">{c.newsTitle}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-text-muted">
              {(['n1', 'n2', 'n3', 'n4'] as const).map((n) => (
                <li key={n} className="flex items-start gap-1.5">
                  <span className="text-[#009E00] mt-0.5">+</span>
                  {c.news[n]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

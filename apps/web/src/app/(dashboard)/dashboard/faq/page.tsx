'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HelpCircle, Search, ChevronDown, ChevronRight, Tag, BookOpen, LifeBuoy } from 'lucide-react';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Types ──────────────────────────────────────────────────────────────────

type Centre = Translations['faq'];
type CleFaq = keyof Centre['items'];
type CleCategorie = keyof Centre['categories'];
type CleModule = keyof Centre['modules'];

/**
 * Structure d'une FAQ : seules les clés sont ici, le contenu rédactionnel
 * (question, réponse, mots-clés) vit dans les dictionnaires i18n.
 */
interface FAQ {
  id: CleFaq;
  categorie: CleCategorie;
  module: CleModule;
  roles: string[];
}

// ─── 100 FAQ (contenu dans t.faq.items) ─────────────────────────────────────

const FAQS: FAQ[] = [
  { id: 'g1', categorie: 'general', module: 'general', roles: ['Tous'] },
  { id: 'g2', categorie: 'general', module: 'general', roles: ['Tous'] },
  { id: 'g3', categorie: 'general', module: 'parametres', roles: ['Tous'] },
  { id: 'g4', categorie: 'general', module: 'general', roles: ['Tous'] },
  { id: 'g5', categorie: 'general', module: 'general', roles: ['Tous'] },
  { id: 'g6', categorie: 'general', module: 'support', roles: ['Tous'] },
  { id: 'g7', categorie: 'general', module: 'securite', roles: ['Tous'] },
  { id: 'g8', categorie: 'general', module: 'general', roles: ['Tous'] },
  { id: 'g9', categorie: 'general', module: 'general', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'g10', categorie: 'general', module: 'transactions', roles: ['Tous'] },
  { id: 'cs1', categorie: 'connexionSecurite', module: 'authentification', roles: ['Tous'] },
  { id: 'cs2', categorie: 'connexionSecurite', module: 'securite', roles: ['Tous'] },
  { id: 'cs3', categorie: 'connexionSecurite', module: 'authentification', roles: ['Tous'] },
  { id: 'cs4', categorie: 'connexionSecurite', module: 'profil', roles: ['Tous'] },
  { id: 'cs5', categorie: 'connexionSecurite', module: 'authentification', roles: ['Tous'] },
  { id: 'cs6', categorie: 'connexionSecurite', module: 'securite', roles: ['Tous'] },
  { id: 'cs7', categorie: 'connexionSecurite', module: 'securite', roles: ['Tous'] },
  { id: 'cs8', categorie: 'connexionSecurite', module: 'securite', roles: ['Tous'] },
  { id: 'cs9', categorie: 'connexionSecurite', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'cs10', categorie: 'connexionSecurite', module: 'securite', roles: ['ADMIN', 'AUDITOR'] },
  { id: 'up1', categorie: 'utilisateursPermissions', module: 'permissions', roles: ['ADMIN', 'MANAGER'] },
  { id: 'up2', categorie: 'utilisateursPermissions', module: 'agents', roles: ['ADMIN', 'MANAGER'] },
  { id: 'up3', categorie: 'utilisateursPermissions', module: 'parametres', roles: ['ADMIN'] },
  { id: 'up4', categorie: 'utilisateursPermissions', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'up5', categorie: 'utilisateursPermissions', module: 'permissions', roles: ['Tous'] },
  { id: 'up6', categorie: 'utilisateursPermissions', module: 'permissions', roles: ['ADMIN'] },
  { id: 'up7', categorie: 'utilisateursPermissions', module: 'agents', roles: ['ADMIN', 'MANAGER'] },
  { id: 'up8', categorie: 'utilisateursPermissions', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'up9', categorie: 'utilisateursPermissions', module: 'permissions', roles: ['ADMIN', 'MANAGER'] },
  { id: 'up10', categorie: 'utilisateursPermissions', module: 'parametres', roles: ['ADMIN', 'MANAGER'] },
  { id: 'p1', categorie: 'parametres', module: 'operateurs', roles: ['ADMIN'] },
  { id: 'p2', categorie: 'parametres', module: 'parametresSociete', roles: ['ADMIN'] },
  { id: 'p3', categorie: 'parametres', module: 'parametresSociete', roles: ['ADMIN'] },
  { id: 'p4', categorie: 'parametres', module: 'notifications', roles: ['ADMIN', 'MANAGER'] },
  { id: 'p5', categorie: 'parametres', module: 'parametresSociete', roles: ['ADMIN'] },
  { id: 'p6', categorie: 'parametres', module: 'operateurs', roles: ['ADMIN'] },
  { id: 'p7', categorie: 'parametres', module: 'commissions', roles: ['ADMIN'] },
  { id: 'p8', categorie: 'parametres', module: 'parametres', roles: ['ADMIN'] },
  { id: 'p9', categorie: 'parametres', module: 'api', roles: ['ADMIN'] },
  { id: 'p10', categorie: 'parametres', module: 'transactions', roles: ['ADMIN'] },
  { id: 't1', categorie: 'transactions', module: 'transactions', roles: ['AGENT', 'MANAGER', 'ADMIN'] },
  { id: 't2', categorie: 'transactions', module: 'transactions', roles: ['Tous'] },
  { id: 't3', categorie: 'transactions', module: 'transactions', roles: ['MANAGER', 'ADMIN'] },
  { id: 't4', categorie: 'transactions', module: 'transactions', roles: ['Tous'] },
  { id: 't5', categorie: 'transactions', module: 'transactions', roles: ['AGENT', 'MANAGER'] },
  { id: 't6', categorie: 'transactions', module: 'transactions', roles: ['Tous'] },
  { id: 't7', categorie: 'transactions', module: 'transactions', roles: ['MANAGER', 'ADMIN'] },
  { id: 't8', categorie: 'transactions', module: 'transactions', roles: ['ADMIN', 'MANAGER'] },
  { id: 't9', categorie: 'transactions', module: 'transactions', roles: ['MANAGER', 'ADMIN', 'AUDITOR'] },
  { id: 't10', categorie: 'transactions', module: 'transactions', roles: ['Tous'] },
  { id: 'aa1', categorie: 'agentsAgences', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'aa2', categorie: 'agentsAgences', module: 'agents', roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'] },
  { id: 'aa3', categorie: 'agentsAgences', module: 'agents', roles: ['ADMIN'] },
  { id: 'aa4', categorie: 'agentsAgences', module: 'agences', roles: ['ADMIN', 'MANAGER'] },
  { id: 'aa5', categorie: 'agentsAgences', module: 'performances', roles: ['MANAGER', 'ADMIN'] },
  { id: 'aa6', categorie: 'agentsAgences', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'aa7', categorie: 'agentsAgences', module: 'agences', roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'] },
  { id: 'aa8', categorie: 'agentsAgences', module: 'agents', roles: ['MANAGER', 'ADMIN'] },
  { id: 'aa9', categorie: 'agentsAgences', module: 'agences', roles: ['ADMIN'] },
  { id: 'aa10', categorie: 'agentsAgences', module: 'agences', roles: ['MANAGER', 'ADMIN'] },
  { id: 'fc1', categorie: 'floatCommissions', module: 'float', roles: ['Tous'] },
  { id: 'fc2', categorie: 'floatCommissions', module: 'float', roles: ['ADMIN', 'MANAGER'] },
  { id: 'fc3', categorie: 'floatCommissions', module: 'float', roles: ['MANAGER', 'ADMIN'] },
  { id: 'fc4', categorie: 'floatCommissions', module: 'float', roles: ['MANAGER', 'ADMIN', 'AUDITOR'] },
  { id: 'fc5', categorie: 'floatCommissions', module: 'commissions', roles: ['Tous'] },
  { id: 'fc6', categorie: 'floatCommissions', module: 'commissions', roles: ['MANAGER', 'ADMIN'] },
  { id: 'fc7', categorie: 'floatCommissions', module: 'float', roles: ['MANAGER', 'ADMIN'] },
  { id: 'fc8', categorie: 'floatCommissions', module: 'float', roles: ['MANAGER', 'ADMIN'] },
  { id: 'fc9', categorie: 'floatCommissions', module: 'commissions', roles: ['ADMIN'] },
  { id: 'fc10', categorie: 'floatCommissions', module: 'commissions', roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'] },
  { id: 're1', categorie: 'rapportsExports', module: 'exports', roles: ['MANAGER', 'ADMIN', 'AUDITOR'] },
  { id: 're2', categorie: 'rapportsExports', module: 'rapports', roles: ['MANAGER', 'ADMIN'] },
  { id: 're3', categorie: 'rapportsExports', module: 'rapports', roles: ['ADMIN'] },
  { id: 're4', categorie: 'rapportsExports', module: 'exports', roles: ['Tous'] },
  { id: 're5', categorie: 'rapportsExports', module: 'rapports', roles: ['MANAGER', 'ADMIN'] },
  { id: 're6', categorie: 'rapportsExports', module: 'rapports', roles: ['Tous'] },
  { id: 're7', categorie: 'rapportsExports', module: 'exports', roles: ['ADMIN'] },
  { id: 're8', categorie: 'rapportsExports', module: 'rapports', roles: ['MANAGER', 'ADMIN'] },
  { id: 're9', categorie: 'rapportsExports', module: 'rapports', roles: ['Tous'] },
  { id: 're10', categorie: 'rapportsExports', module: 'rapports', roles: ['MANAGER', 'ADMIN'] },
  { id: 'al1', categorie: 'abonnementsLicences', module: 'abonnements', roles: ['ADMIN'] },
  { id: 'al2', categorie: 'abonnementsLicences', module: 'abonnements', roles: ['ADMIN'] },
  { id: 'al3', categorie: 'abonnementsLicences', module: 'abonnements', roles: ['ADMIN'] },
  { id: 'al4', categorie: 'abonnementsLicences', module: 'abonnements', roles: ['ADMIN'] },
  { id: 'al5', categorie: 'abonnementsLicences', module: 'abonnements', roles: ['ADMIN'] },
  { id: 'st1', categorie: 'supportTickets', module: 'support', roles: ['Tous'] },
  { id: 'st2', categorie: 'supportTickets', module: 'support', roles: ['Tous'] },
  { id: 'st3', categorie: 'supportTickets', module: 'support', roles: ['Tous'] },
  { id: 'st4', categorie: 'supportTickets', module: 'support', roles: ['Tous'] },
  { id: 'st5', categorie: 'supportTickets', module: 'support', roles: ['Tous'] },
  { id: 'si1', categorie: 'saraIa', module: 'saraIa', roles: ['Tous'] },
  { id: 'si2', categorie: 'saraIa', module: 'saraIa', roles: ['Tous'] },
  { id: 'si3', categorie: 'saraIa', module: 'saraIa', roles: ['Tous'] },
  { id: 'si4', categorie: 'saraIa', module: 'saraIa', roles: ['Tous'] },
  { id: 'si5', categorie: 'saraIa', module: 'saraIa', roles: ['Tous'] },
  { id: 'sb1', categorie: 'sauvegarde', module: 'securite', roles: ['ADMIN'] },
  { id: 'sb2', categorie: 'sauvegarde', module: 'securite', roles: ['ADMIN'] },
  { id: 'sb3', categorie: 'sauvegarde', module: 'securite', roles: ['Tous'] },
  { id: 'sb4', categorie: 'sauvegarde', module: 'exports', roles: ['ADMIN'] },
  { id: 'sb5', categorie: 'sauvegarde', module: 'securite', roles: ['ADMIN'] },
];

// ─── Catégories avec comptages ───────────────────────────────────────────────

const CATEGORIES_UNIQUES = Array.from(new Set(FAQS.map((f) => f.categorie)));

// ─── Composant FAQ Item ──────────────────────────────────────────────────────

function FaqItem({ faq }: { faq: FAQ }) {
  const t = useT();
  const contenu = t.faq.items[faq.id];
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className={clsx('border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all', ouvert && 'shadow-sm ring-1 ring-[#009E00]/15')}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <HelpCircle size={15} className={clsx('flex-shrink-0 mt-0.5 transition-colors', ouvert ? 'text-[#009E00]' : 'text-text-muted')} />
        <span className="flex-1 text-sm font-semibold text-text-main leading-snug">{contenu.question}</span>
        {ouvert
          ? <ChevronDown size={15} className="text-[#009E00] flex-shrink-0 mt-0.5" />
          : <ChevronRight size={15} className="text-text-muted flex-shrink-0 mt-0.5" />}
      </button>
      {ouvert && (
        <div className="border-t border-gray-100 dark:border-white/08 px-4 py-4">
          <p className="text-sm text-text-muted leading-relaxed pl-6">{contenu.reponse}</p>
          <div className="flex flex-wrap items-center gap-3 mt-4 pl-6">
            <div className="flex flex-wrap gap-1">
              {faq.roles.map((r) => (
                <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#009E00]/10 text-[#007a00] dark:text-[#4ade80]">
                  {r === 'Tous' ? t.faq.rolesAll : r}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">{t.faq.modules[faq.module]}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2 pl-6">
            {contenu.motsCles.slice(0, 4).map((m) => (
              <span key={m} className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-gray-50 dark:bg-white/05"># {m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function FaqPage() {
  const t = useT();
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState<CleCategorie | 'all'>('all');

  const faqFiltrees = useMemo(() => {
    let result = FAQS;
    if (categorie !== 'all') {
      result = result.filter((f) => f.categorie === categorie);
    }
    if (recherche.trim().length >= 2) {
      const q = recherche.toLowerCase();
      result = result.filter((f) => {
        const c = t.faq.items[f.id];
        return c.question.toLowerCase().includes(q) ||
          c.reponse.toLowerCase().includes(q) ||
          c.motsCles.some((m) => m.includes(q)) ||
          t.faq.modules[f.module].toLowerCase().includes(q);
      });
    }
    return result;
  }, [recherche, categorie, t]);

  const comptesParCategorie = useMemo(() => {
    const acc: Record<string, number> = { all: FAQS.length };
    CATEGORIES_UNIQUES.forEach((c) => {
      acc[c] = FAQS.filter((f) => f.categorie === c).length;
    });
    return acc;
  }, []);

  /** Libellé « N résultat(s) », pluriel selon la langue active. */
  const libelleResultats = (n: number) =>
    (n === 1 ? t.faq.resultOne : t.faq.resultMany).replace('{n}', String(n));

  /** Libellé « N question(s) », pluriel selon la langue active. */
  const libelleQuestions = (n: number) =>
    (n === 1 ? t.faq.questionOne : t.faq.questionMany).replace('{n}', String(n));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <HelpCircle size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{t.faq.title}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {t.faq.subtitle
                .replace('{n}', String(FAQS.length))
                .replace('{c}', String(CATEGORIES_UNIQUES.length))}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aide" className="text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors">
            ← {t.faq.backToHelp}
          </Link>
          <Link href="/dashboard/guide" className="flex items-center gap-1.5 text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors">
            <BookOpen size={14} /> {t.faq.fullGuide}
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder={t.faq.searchPlaceholder}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
        {recherche && (
          <button onClick={() => setRecherche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs">
            {t.faq.clear}
          </button>
        )}
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {(['all' as const, ...CATEGORIES_UNIQUES]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategorie(cat)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              categorie === cat
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-blue-400 hover:text-blue-500'
            )}
          >
            <Tag size={11} />
            {cat === 'all' ? t.faq.all : t.faq.categories[cat]}
            <span className={clsx('text-[10px] px-1 py-0.5 rounded-full', categorie === cat ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10')}>
              {comptesParCategorie[cat] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div>
        {recherche.trim().length >= 2 || categorie !== 'all' ? (
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {libelleResultats(faqFiltrees.length)}
            {categorie !== 'all' && ` ${t.faq.inCategory.replace('{cat}', t.faq.categories[categorie])}`}
            {recherche.trim().length >= 2 && ` ${t.faq.forQuery.replace('{q}', recherche)}`}
          </p>
        ) : null}

        {faqFiltrees.length === 0 ? (
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
            <HelpCircle size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm">{t.faq.empty}</p>
            <Link href="/dashboard/support" className="text-blue-500 text-sm font-semibold mt-3 inline-block hover:underline">
              {t.faq.openTicketLink}
            </Link>
          </div>
        ) : categorie !== 'all' || recherche.trim().length >= 2 ? (
          <div className="space-y-1.5">
            {faqFiltrees.map((faq) => (
              <FaqItem key={faq.id} faq={faq} />
            ))}
          </div>
        ) : (
          /* Vue par catégories si pas de filtre actif */
          <div className="space-y-8">
            {CATEGORIES_UNIQUES.map((cat) => {
              const faqsCat = FAQS.filter((f) => f.categorie === cat);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-base font-bold text-text-main">{t.faq.categories[cat]}</h2>
                    <span className="text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">
                      {libelleQuestions(faqsCat.length)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {faqsCat.map((faq) => (
                      <FaqItem key={faq.id} faq={faq} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA bas de page */}
      <div className="bg-gradient-to-r from-blue-50 to-[#009E00]/05 dark:from-blue-900/10 dark:to-[#009E00]/05 rounded-2xl border border-blue-100 dark:border-blue-900/20 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-text-main">{t.faq.ctaTitle}</h3>
          <p className="text-sm text-text-muted mt-1">{t.faq.ctaSubtitle}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/dashboard/guide"
            className="flex items-center gap-2 bg-white dark:bg-white/08 text-text-main text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/12 transition-colors"
          >
            <BookOpen size={14} /> {t.faq.fullGuide}
          </Link>
          <Link
            href="/dashboard/support"
            className="flex items-center gap-2 bg-[#009E00] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#007a00] transition-colors"
          >
            <LifeBuoy size={14} /> {t.faq.ctaTicket}
          </Link>
        </div>
      </div>
    </div>
  );
}

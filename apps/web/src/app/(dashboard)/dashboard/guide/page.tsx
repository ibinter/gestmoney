'use client';
// =============================================================================
// GUIDE UTILISATEUR — GESTMONEY
//
// RÈGLE DE RÉDACTION DE CE FICHIER : on ne documente que ce qui existe et
// fonctionne réellement dans l'application. Chaque bouton, chaque champ et
// chaque onglet cité ici a été vérifié dans le code de la page concernée.
// Ce qui n'est pas disponible est signalé explicitement plutôt que passé sous
// silence — un guide qui décrit un bouton inexistant fait perdre du temps.
// =============================================================================
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, ChevronDown, ChevronRight, Download, PlayCircle,
  Rocket, Compass, ArrowLeftRight, Wallet, Vault, Building2, Users,
  UserRound, Package, Coins, TrendingUp, BarChart3, BookText,
  SlidersHorizontal, ShieldAlert, CreditCard, Bell, Settings, User,
  LifeBuoy, HelpCircle, CheckCircle2, AlertTriangle, Info, Ban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { exporterPdf } from '@/lib/exportPdf';
import { GmPageHeader, GmButton } from '@/components/gm';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  titre: string;
  objectif: string;
  roles: string[];
  contenu: string;
  conseils?: string[];
  avertissements?: string[];
  /** Ce qui n'existe pas encore dans le module — dit franchement. */
  nonDisponible?: string[];
  liensConnexes?: { label: string; href: string }[];
  tags: string[];
}

interface Section {
  id: string;
  titre: string;
  icone: React.ElementType;
  couleur: string;
  description: string;
  articles: Article[];
}

// ─── Contenu ─────────────────────────────────────────────────────────────────
//
// Les textes vivent dans le dictionnaire (t.guide.sections / t.guide.articles).
// Ne restent ici que la structure : ordre des modules, icônes, couleurs, et les
// adresses des liens connexes — rien qui se traduise.

type CleSection = keyof Translations['guide']['sections'];
type CleArticle = keyof Translations['guide']['articles'];

/** Forme d'une fiche telle que stockée dans le dictionnaire. */
interface ArticleTexte {
  titre: string;
  objectif: string;
  roles: readonly string[];
  tags: readonly string[];
  contenu: string;
  conseils?: readonly string[];
  avertissements?: readonly string[];
  nonDisponible?: readonly string[];
  liens?: readonly string[];
}

/** Adresses des liens connexes, dans l'ordre des libellés du dictionnaire. */
const HREFS_LIENS: Partial<Record<CleArticle, string[]>> = {
  ordreDeConfiguration: ['/dashboard/agences', '/dashboard/agents'],
  enregistrerTransaction: ['/dashboard/transactions'],
  ouChercher: ['/dashboard/faq', '/dashboard/aide', '/dashboard/support'],
};

/** Plan du guide : ordre des modules et des fiches. L'ancre reste stable. */
const PLAN: { cle: CleSection; ancre: string; icone: React.ElementType; couleur: string; articles: CleArticle[] }[] = [
  { cle: 'demarrage', ancre: 'demarrage', icone: Rocket, couleur: '#009E00',
    articles: ['aQuoiSertGestmoney', 'ordreDeConfiguration', 'rolesEtAcces'] },
  { cle: 'navigation', ancre: 'navigation', icone: Compass, couleur: '#3B82F6',
    articles: ['menuGauche', 'mobile', 'barreDuHaut'] },
  { cle: 'tableauDeBord', ancre: 'tableau-de-bord', icone: BookOpen, couleur: '#009E00',
    articles: ['lireLeTableauDeBord'] },
  { cle: 'transactions', ancre: 'transactions', icone: ArrowLeftRight, couleur: '#009E00',
    articles: ['enregistrerTransaction', 'statutsTransaction', 'filtrerExporterTransactions'] },
  { cle: 'float', ancre: 'float', icone: Wallet, couleur: '#F59E0B',
    articles: ['comprendreFloat', 'demanderReapprovisionnement'] },
  { cle: 'caisse', ancre: 'caisse', icone: Vault, couleur: '#10B981',
    articles: ['controleCaisse', 'ecritureManuelleCaisse'] },
  { cle: 'agences', ancre: 'agences', icone: Building2, couleur: '#EC4899',
    articles: ['creerAgence', 'desactiverAgence'] },
  { cle: 'agents', ancre: 'agents', icone: Users, couleur: '#3B82F6',
    articles: ['creerAgent', 'suivreAgents'] },
  { cle: 'clients', ancre: 'clients', icone: UserRound, couleur: '#6366F1',
    articles: ['gererClients'] },
  { cle: 'stock', ancre: 'stock', icone: Package, couleur: '#F97316',
    articles: ['mouvementsStock'] },
  { cle: 'commissions', ancre: 'commissions', icone: Coins, couleur: '#10B981',
    articles: ['validerPayerCommissions'] },
  { cle: 'performances', ancre: 'performances', icone: TrendingUp, couleur: '#8B5CF6',
    articles: ['lirePerformances'] },
  { cle: 'rapports', ancre: 'rapports', icone: BarChart3, couleur: '#EC4899',
    articles: ['genererRapport', 'exporterRapport'] },
  { cle: 'comptabilite', ancre: 'comptabilite', icone: BookText, couleur: '#6366F1',
    articles: ['lireComptabilite'] },
  { cle: 'administration', ancre: 'administration', icone: SlidersHorizontal, couleur: '#64748B',
    articles: ['administrationUtilisateurs'] },
  { cle: 'audit', ancre: 'audit', icone: ShieldAlert, couleur: '#EF4444',
    articles: ['comprendreAlertesAudit'] },
  { cle: 'abonnement', ancre: 'abonnement', icone: CreditCard, couleur: '#F59E0B',
    articles: ['payerAbonnement'] },
  { cle: 'notifications', ancre: 'notifications', icone: Bell, couleur: '#EF4444',
    articles: ['gererNotifications'] },
  { cle: 'parametres', ancre: 'parametres', icone: Settings, couleur: '#64748B',
    articles: ['ongletsParametres'] },
  { cle: 'profil', ancre: 'profil', icone: User, couleur: '#111111',
    articles: ['monProfil'] },
  { cle: 'aide', ancre: 'aide', icone: LifeBuoy, couleur: '#009E00',
    articles: ['ouChercher', 'sara', 'ecransSuperadmin'] },
];

/** Construit les sections du guide dans la langue active. */
function construireSections(t: Translations): Section[] {
  return PLAN.map((bloc) => ({
    id: bloc.ancre,
    titre: t.guide.sections[bloc.cle].titre,
    icone: bloc.icone,
    couleur: bloc.couleur,
    description: t.guide.sections[bloc.cle].description,
    articles: bloc.articles.map((cle) => {
      const txt = t.guide.articles[cle] as ArticleTexte;
      const hrefs = HREFS_LIENS[cle];
      return {
        id: cle,
        titre: txt.titre,
        objectif: txt.objectif,
        roles: [...txt.roles],
        contenu: txt.contenu,
        tags: [...txt.tags],
        conseils: txt.conseils ? [...txt.conseils] : undefined,
        avertissements: txt.avertissements ? [...txt.avertissements] : undefined,
        nonDisponible: txt.nonDisponible ? [...txt.nonDisponible] : undefined,
        liensConnexes: txt.liens && hrefs
          ? txt.liens.map((label, i) => ({ label, href: hrefs[i] }))
          : undefined,
      };
    }),
  }));
}

// ─── Carte d'article ─────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const t = useT();
  const [ouvert, setOuvert] = useState(false);
  return (
    <div
      className={clsx(
        'border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all',
        ouvert && 'shadow-sm',
      )}
    >
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-text-main">{article.titre}</p>
          <p className="text-xs text-text-muted mt-0.5">{article.objectif}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {article.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/08 text-text-muted"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        {ouvert ? (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>

      {ouvert && (
        <div className="border-t border-gray-100 dark:border-white/08 px-4 py-4 space-y-4">
          <div
            className="prose-guide text-sm text-text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.contenu }}
          />

          {article.conseils && article.conseils.length > 0 && (
            <div className="bg-[#009E00]/08 border border-[#009E00]/20 rounded-xl p-3 space-y-1.5">
              {article.conseils.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Info size={13} className="text-[#009E00] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#007a00] dark:text-[#4ade80]">{c}</p>
                </div>
              ))}
            </div>
          )}

          {article.avertissements && article.avertissements.length > 0 && (
            <div className="bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-xl p-3 space-y-1.5">
              {article.avertissements.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle
                    size={13}
                    className="text-[#b8960a] dark:text-[#FFD000] flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-[#92740a] dark:text-[#FFD000]">{a}</p>
                </div>
              ))}
            </div>
          )}

          {article.nonDisponible && article.nonDisponible.length > 0 && (
            <div className="bg-gray-100/70 dark:bg-white/05 border border-gray-200 dark:border-white/10 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                {t.guide.pasEncoreDisponible}
              </p>
              {article.nonDisponible.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Ban size={13} className="text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted">{n}</p>
                </div>
              ))}
            </div>
          )}

          {article.liensConnexes && article.liensConnexes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {article.liensConnexes.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#009E00] hover:underline"
                >
                  {l.label} <ChevronRight size={11} />
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/05 text-text-muted rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const t = useT();
  const SECTIONS = useMemo(() => construireSections(t), [t]);
  const [recherche, setRecherche] = useState('');
  const [sectionActive, setSectionActive] = useState<string | null>(null);
  const [visiteOuverte, setVisiteOuverte] = useState(false);

  const resultatsRecherche = useMemo(() => {
    if (!recherche.trim()) return [];
    const q = recherche.toLowerCase();
    const res: { section: Section; article: Article }[] = [];
    SECTIONS.forEach((section) => {
      section.articles.forEach((article) => {
        if (
          article.titre.toLowerCase().includes(q) ||
          article.tags.some((t) => t.includes(q)) ||
          article.contenu.toLowerCase().includes(q) ||
          article.objectif.toLowerCase().includes(q)
        ) {
          res.push({ section, article });
        }
      });
    });
    return res;
  }, [recherche, SECTIONS]);

  const sectionsFiltrees = sectionActive
    ? SECTIONS.filter((s) => s.id === sectionActive)
    : SECTIONS;
  const totalArticles = SECTIONS.reduce((n, s) => n + s.articles.length, 0);

  const handleExportPdf = () => {
    const lignes = SECTIONS.flatMap((s) =>
      s.articles.map(
        (a) =>
          ({
            section: s.titre,
            article: a.titre,
            objectif: a.objectif,
            roles: a.roles.join(', '),
          }) as Record<string, unknown>,
      ),
    );
    exporterPdf(
      lignes,
      [
        { titre: t.guide.pdf.colModule, valeur: (r) => String(r.section) },
        { titre: t.guide.pdf.colFiche, valeur: (r) => String(r.article) },
        { titre: t.guide.pdf.colObjectif, valeur: (r) => String(r.objectif) },
        { titre: t.guide.pdf.colRoles, valeur: (r) => String(r.roles) },
      ],
      {
        titre: t.guide.pdf.titre,
        sousTitre: `${totalArticles} ${t.guide.pdf.fiches} — ${SECTIONS.length} ${t.guide.pdf.modules}`,
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* La visite guidée est montée à la demande, en mode forcé. */}
      {visiteOuverte && (
        <OnboardingTour forceStart onClose={() => setVisiteOuverte(false)} />
      )}

      <GmPageHeader
        fil={[t.guide.fil.accueil, t.guide.fil.aide, t.guide.fil.guide]}
        titre={t.guide.titre}
        sousTitre={`${totalArticles} ${t.guide.sousTitreA} ${SECTIONS.length} ${t.guide.sousTitreB}`}
        actions={
          <>
            <GmButton onClick={() => setVisiteOuverte(true)}>
              <PlayCircle size={15} /> {t.guide.relancerVisite}
            </GmButton>
            <GmButton variante="outline" onClick={handleExportPdf}>
              <Download size={15} /> {t.guide.exporterPdf}
            </GmButton>
            <Link href="/dashboard/aide" className="gm-btn gm-btn-ghost">
              {t.guide.retourAide}
            </Link>
          </>
        }
      />

      {/* Bandeau visite guidée */}
      <div className="bg-gradient-to-r from-[#009E00]/10 to-[#FFD000]/10 rounded-2xl border border-[#009E00]/20 p-4 sm:p-5 flex items-start gap-3">
        <PlayCircle size={20} className="text-[#009E00] flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="font-bold text-text-main text-sm">
            {t.guide.banniereTitre}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t.guide.banniereTexte}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="gm-search-wrap">
        <Search size={16} className="gm-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="gm-search-input"
          placeholder={t.guide.recherchePlaceholder}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label={t.guide.rechercheAria}
        />
      </div>

      {/* Résultats de recherche */}
      {recherche.trim() && (
        <div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {resultatsRecherche.length}{' '}
            {resultatsRecherche.length === 1 ? t.guide.resultatUn : t.guide.resultatPlusieurs}{' '}
            &ldquo;{recherche}&rdquo;
          </p>
          {resultatsRecherche.length === 0 ? (
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-10 text-center">
              <p className="text-text-muted text-sm">
                {t.guide.aucuneFiche}
              </p>
              <Link
                href="/dashboard/faq"
                className="text-[#009E00] text-sm font-semibold mt-3 inline-flex items-center gap-1"
              >
                {t.guide.voirFaq} <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {resultatsRecherche.map(({ section, article }) => (
                <div
                  key={`${section.id}-${article.id}`}
                  className="bg-white dark:bg-white/03 rounded-xl border border-gray-100 dark:border-white/08 overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <section.icone size={13} style={{ color: section.couleur }} />
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                      {section.titre}
                    </span>
                  </div>
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!recherche.trim() && (
        <>
          {/* Filtres par module */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSectionActive(null)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                !sectionActive
                  ? 'bg-[#009E00] text-white'
                  : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-[#009E00] hover:text-[#009E00]',
              )}
            >
              {t.guide.tousModules}
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionActive(sectionActive === s.id ? null : s.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                  sectionActive === s.id
                    ? 'text-white'
                    : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:text-text-main',
                )}
                style={sectionActive === s.id ? { backgroundColor: s.couleur } : {}}
              >
                <s.icone size={12} />
                {s.titre}
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sectionsFiltrees.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden"
              >
                <div
                  className="px-4 sm:px-6 py-5 flex items-center gap-3 sm:gap-4 border-b border-gray-100 dark:border-white/08"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: section.couleur,
                    borderLeftStyle: 'solid',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: section.couleur + '18' }}
                  >
                    <section.icone size={19} style={{ color: section.couleur }} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-text-main">{section.titre}</h2>
                    <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-1 rounded-full flex-shrink-0 hidden sm:inline">
                    {section.articles.length}
                  </span>
                </div>
                <div className="px-3 sm:px-4 py-3 space-y-1.5">
                  {section.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Bas de page */}
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-text-main">{t.guide.bloqueTitre}</h3>
              <p className="text-sm text-text-muted mt-1">
                {t.guide.bloqueTexte}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/dashboard/faq" className="gm-btn gm-btn-outline">
                <HelpCircle size={14} /> {t.guide.faq}
              </Link>
              <Link href="/dashboard/support" className="gm-btn gm-btn-primary">
                <CheckCircle2 size={14} /> {t.guide.ouvrirTicket}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

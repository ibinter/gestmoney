'use client';
// ============================================================
// GESTMONEY — Académie / Guide utilisateur (index)
// Route : /dashboard/guide
// Page principale avec barre de recherche, 6 catégories en grid
// et liste des articles par catégorie.
// ============================================================
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Clock, ChevronRight, BookOpen } from 'lucide-react';
import {
  GUIDE_ARTICLES,
  CATEGORIES,
  articlesByCategorie,
  type Categorie,
  type GuideArticle,
} from './content';

// ── Couleurs badge par catégorie ──────────────────────────────────────────────
const BADGE_COLORS: Record<Categorie, string> = {
  demarrage:     'bg-blue-100   text-blue-800   dark:bg-blue-900/40  dark:text-blue-300',
  transactions:  'bg-green-100  text-green-800  dark:bg-green-900/40 dark:text-green-300',
  agents:        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  rapports:      'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  configuration: 'bg-gray-100   text-gray-700   dark:bg-gray-700/50  dark:text-gray-300',
  securite:      'bg-red-100    text-red-800    dark:bg-red-900/40   dark:text-red-300',
};

// ── Composant carte article ────────────────────────────────────────────────────
function ArticleCard({ article }: { article: GuideArticle }) {
  const cat = CATEGORIES.find((c) => c.id === article.categorie);
  return (
    <Link
      href={`/dashboard/guide/${article.slug}`}
      className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all group"
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{cat?.icone ?? '📄'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 truncate">
          {article.titre}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {article.resume}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Clock size={11} className="text-gray-400" />
          <span className="text-[11px] text-gray-400">{article.tempsLecture} min</span>
        </div>
      </div>
      <ChevronRight size={14} className="flex-shrink-0 text-gray-300 group-hover:text-green-500 mt-1 transition-colors" />
    </Link>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [query, setQuery] = useState('');
  const [categorieActive, setCategorieActive] = useState<Categorie | null>(null);

  // Filtrage local
  const articlesFiltrés: GuideArticle[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    return GUIDE_ARTICLES.filter((a) => {
      const matchCat = !categorieActive || a.categorie === categorieActive;
      const matchQ =
        !q ||
        a.titre.toLowerCase().includes(q) ||
        a.resume.toLowerCase().includes(q) ||
        a.contenu.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, categorieActive]);

  const enRecherche = query.trim().length > 0 || categorieActive !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={22} className="text-green-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-green-600">
            Académie GESTMONEY
          </p>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
          Guide utilisateur
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Tout ce qu'il faut savoir pour maîtriser GESTMONEY, article par article.
        </p>
      </div>

      {/* ── Barre de recherche ─────────────────────────────────── */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un article… (ex : float, commission, OHADA)"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Grille de catégories ───────────────────────────────── */}
      {!query && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {CATEGORIES.map((cat) => {
            const count = articlesByCategorie(cat.id).length;
            const isActive = categorieActive === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  setCategorieActive(isActive ? null : cat.id)
                }
                className={[
                  'flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left',
                  isActive
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                    : 'border-transparent hover:border-green-200 dark:hover:border-green-800',
                  cat.couleur,
                ].join(' ')}
              >
                <span className="text-2xl mb-2">{cat.icone}</span>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {cat.titre}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {count} article{count > 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Résultats de recherche ou liste par catégorie ─────── */}
      {enRecherche ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {articlesFiltrés.length} résultat{articlesFiltrés.length > 1 ? 's' : ''}
              {categorieActive && (
                <span>
                  {' '}dans{' '}
                  <span className="text-green-600">
                    {CATEGORIES.find((c) => c.id === categorieActive)?.titre}
                  </span>
                </span>
              )}
            </h2>
            <button
              onClick={() => { setQuery(''); setCategorieActive(null); }}
              className="text-xs text-green-600 hover:underline"
            >
              Tout afficher
            </button>
          </div>
          {articlesFiltrés.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">Aucun article trouvé</p>
              <p className="text-sm mt-1">Essayez d'autres mots-clés</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {articlesFiltrés.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Liste par catégorie */
        <div className="space-y-10">
          {CATEGORIES.map((cat) => {
            const articles = articlesByCategorie(cat.id);
            return (
              <section key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cat.icone}</span>
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                    {cat.titre}
                  </h2>
                  <span
                    className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${BADGE_COLORS[cat.id]}`}
                  >
                    {articles.length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {articles.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Lien vers le guide complet (public) ───────────────── */}
      <div className="mt-12 p-5 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            Guide technique complet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Documentation module par module avec cas pratiques et lexique.
          </p>
        </div>
        <Link
          href="/guide"
          target="_blank"
          className="flex-shrink-0 text-sm font-semibold text-green-700 dark:text-green-400 hover:underline"
        >
          Ouvrir →
        </Link>
      </div>
    </div>
  );
}

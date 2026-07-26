'use client';
// ============================================================
// GESTMONEY — Académie : page d'un article
// Route : /dashboard/guide/[slug]
// Breadcrumb + TOC latérale + contenu rendu + nav précédent/suivant
// ============================================================
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Clock, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import {
  articleBySlug,
  adjacentArticles,
  extractToc,
  renderMarkdown,
  CATEGORIES,
  ACAD_CSS,
  type GuideArticle,
} from '../content';

// ── Table des matières ────────────────────────────────────────────────────────
function TableOfContents({ article }: { article: GuideArticle }) {
  const toc = extractToc(article.contenu);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('.acad-h2'));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [article.slug]);

  if (toc.length === 0) return null;

  return (
    <nav className="hidden xl:block w-52 flex-shrink-0">
      <div className="sticky top-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
          Dans cet article
        </p>
        <ul className="space-y-1">
          {toc.map(({ id, titre }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={[
                  'block text-xs py-1 px-2 rounded-md transition-colors',
                  activeId === id
                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {titre}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// ── Page article ──────────────────────────────────────────────────────────────
export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const article = articleBySlug(slug);
  const [prev, next] = adjacentArticles(slug);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Article introuvable
        </h1>
        <p className="text-gray-500 mb-6">
          L'article « {slug} » n'existe pas ou a été déplacé.
        </p>
        <Link
          href="/dashboard/guide"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:underline"
        >
          <ArrowLeft size={14} />
          Retour au guide
        </Link>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === article.categorie);
  const htmlContent = renderMarkdown(article.contenu);

  return (
    <>
      {/* CSS du rendu markdown */}
      <style>{ACAD_CSS}</style>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Breadcrumb ───────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard/guide" className="hover:text-green-600 flex items-center gap-1">
            <BookOpen size={12} />
            Guide
          </Link>
          <ChevronRight size={12} />
          <button
            onClick={() => window.history.back()}
            className="hover:text-green-600"
          >
            {cat?.titre ?? article.categorie}
          </button>
          <ChevronRight size={12} />
          <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[200px]">
            {article.titre}
          </span>
        </nav>

        <div className="flex gap-10">
          {/* ── Contenu principal ──────────────────────────────── */}
          <article className="flex-1 min-w-0">
            {/* En-tête article */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{cat?.icone}</span>
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  {cat?.titre}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                {article.titre}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {article.resume}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={13} />
                <span>Lecture : {article.tempsLecture} min</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-700 mt-5" />
            </div>

            {/* Corps de l'article */}
            <div
              className="acad-body"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* ── Navigation précédent / suivant ─────────────── */}
            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
              {prev ? (
                <Link
                  href={`/dashboard/guide/${prev.slug}`}
                  className="group flex flex-col gap-1 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
                >
                  <span className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-green-600">
                    <ArrowLeft size={12} />
                    Précédent
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                    {prev.titre}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  href={`/dashboard/guide/${next.slug}`}
                  className="group flex flex-col gap-1 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors text-right ml-auto w-full"
                >
                  <span className="flex items-center gap-1 justify-end text-xs text-gray-400 group-hover:text-green-600">
                    Suivant
                    <ArrowRight size={12} />
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                    {next.titre}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>

            {/* Retour à l'index */}
            <div className="mt-6 text-center">
              <Link
                href="/dashboard/guide"
                className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline"
              >
                <BookOpen size={14} />
                Voir tous les articles
              </Link>
            </div>
          </article>

          {/* ── Table des matières (desktop uniquement) ────────── */}
          <TableOfContents article={article} />
        </div>
      </div>
    </>
  );
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LEGAL_CONTENT, LEGAL_SLUGS } from '../content';
import { LegalArticle } from '../LegalArticle';

interface Props {
  params: { slug: string };
}

// Pré-génère les 18 pages → aucune ne peut tomber en 404.
export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const entry = LEGAL_CONTENT[params.slug];
  // Titre FR par défaut (langue par défaut du site) ; la bascule FR/EN
  // du contenu se fait côté client via le contexte i18n.
  return { title: entry ? entry.fr.titre : 'Document légal' };
}

export default function LegalPage({ params }: Props) {
  const entry = LEGAL_CONTENT[params.slug];
  if (!entry) notFound();

  return <LegalArticle entry={entry} />;
}

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gestmoney.ibigsoft.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publiques = [
    { url: BASE_URL, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${BASE_URL}/login`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/legal`, changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  const pagesLegales = [
    'mentions-legales', 'cgu', 'conditions-commerciales', 'licence',
    'confidentialite', 'cookies', 'donnees', 'propriete-intellectuelle',
    'support', 'sauvegarde', 'resiliation', 'remboursement',
    'essai', 'sara', 'suppression-compte', 'reclamations',
    'protection-marque', 'responsabilite-ia',
  ].map(slug => ({
    url: `${BASE_URL}/legal/${slug}`,
    changeFrequency: 'yearly' as const,
    priority: 0.2,
  }));

  return [...publiques, ...pagesLegales].map(p => ({ ...p, lastModified: now }));
}

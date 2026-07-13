import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pages légales',
};

const PAGES_LEGALES = [
  { slug: 'mentions-legales', titre: 'Mentions légales' },
  { slug: 'cgu', titre: "Conditions générales d'utilisation" },
  { slug: 'conditions-commerciales', titre: 'Conditions commerciales' },
  { slug: 'licence', titre: 'Contrat de licence logiciel' },
  { slug: 'confidentialite', titre: 'Politique de confidentialité' },
  { slug: 'cookies', titre: 'Politique de cookies' },
  { slug: 'donnees', titre: 'Traitement des données personnelles' },
  { slug: 'propriete-intellectuelle', titre: 'Propriété intellectuelle' },
  { slug: 'support', titre: 'Conditions de support' },
  { slug: 'sauvegarde', titre: 'Politique de sauvegarde' },
  { slug: 'resiliation', titre: 'Conditions de résiliation' },
  { slug: 'remboursement', titre: 'Politique de remboursement' },
  { slug: 'essai', titre: "Conditions de l'essai gratuit" },
  { slug: 'sara', titre: 'Conditions d\'utilisation de SARA (IA)' },
  { slug: 'suppression-compte', titre: 'Suppression du compte' },
  { slug: 'reclamations', titre: 'Procédure de réclamations' },
];

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="text-sm text-green-600 hover:underline">← Retour à l'accueil</Link>
          <h1 className="text-3xl font-black mt-4 text-gray-900 dark:text-white">Documents légaux</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            GESTMONEY — Édité par IBIG Soft, une marque de IBIG SARL – Intermark Business International Group.
          </p>
        </div>
        <ul className="space-y-2">
          {PAGES_LEGALES.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/legal/${p.slug}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors group"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400">
                  {p.titre}
                </span>
                <span className="text-gray-400 group-hover:text-green-500">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} GESTMONEY. Tous droits réservés.<br />
          <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
        </p>
      </div>
    </main>
  );
}

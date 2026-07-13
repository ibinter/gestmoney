import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

// Contenu statique initial — sera remplacé par des données administrables (table PageLegale)
const CONTENUS: Record<string, { titre: string; contenu: string }> = {
  'mentions-legales': {
    titre: 'Mentions légales',
    contenu: `
## Éditeur

**GESTMONEY** est un logiciel édité par **IBIG Soft**, une marque de **IBIG SARL – Intermark Business International Group**.

- **Raison sociale :** IBIG SARL
- **Siège social :** [Adresse à compléter]
- **Email :** contact@ibigsoft.com
- **Site :** https://ibigsoft.com
- **Programme partenaire :** https://ibigpartners.com/

## Hébergement

Le logiciel GESTMONEY est hébergé sur des serveurs dédiés sécurisés.

## Propriété intellectuelle

Le logiciel GESTMONEY, son interface, son logo, ses textes, sa documentation et son identité visuelle sont la propriété exclusive d'IBIG Soft. Toute reproduction, imitation, copie, adaptation, extraction ou utilisation non autorisée est interdite et constitue une contrefaçon passible de poursuites.

## Responsabilité

IBIG Soft s'efforce de maintenir le logiciel disponible 24h/24. Des interruptions ponctuelles peuvent survenir pour maintenance. IBIG Soft ne saurait être tenu responsable de dommages indirects liés à l'utilisation du logiciel.

## Droit applicable

Le présent logiciel est soumis au droit applicable dans l'espace OHADA et aux lois nationales du pays d'implantation du client.
    `,
  },
  'confidentialite': {
    titre: 'Politique de confidentialité',
    contenu: `
## Données collectées

GESTMONEY collecte uniquement les données nécessaires au fonctionnement du service :
- Informations d'identification (nom, prénom, email, téléphone)
- Données d'utilisation (transactions, agents, float)
- Données techniques (logs, IP, navigateur)

## Finalités

Les données sont utilisées pour :
- Fournir le service contractuel
- Améliorer le logiciel
- Assurer la sécurité
- Envoyer des communications contractuelles

## Durée de conservation

Les données sont conservées pendant la durée du contrat et 5 ans après résiliation, conformément aux obligations légales OHADA.

## Droits des utilisateurs

Conformément à la réglementation applicable, vous disposez des droits d'accès, rectification, suppression, portabilité et opposition. Exercice : contact@ibigsoft.com

## Sécurité

Les données sont chiffrées en transit (HTTPS/TLS) et au repos. L'accès est contrôlé par authentification renforcée et journaux d'audit.

## Cookies

Voir notre politique de cookies.

## Contact DPO

Pour toute question : contact@ibigsoft.com
    `,
  },
  'cgu': {
    titre: "Conditions générales d'utilisation",
    contenu: `
## Objet

Les présentes conditions régissent l'utilisation du logiciel GESTMONEY, plateforme SaaS de gestion des réseaux Mobile Money, éditée par IBIG Soft.

## Accès au service

L'accès est conditionné à la création d'un compte et à la souscription d'un abonnement ou d'un essai gratuit. Chaque utilisateur est responsable de la confidentialité de ses identifiants.

## Utilisation autorisée

GESTMONEY est destiné à un usage professionnel. L'utilisation à des fins illicites, frauduleuses ou contraires à la déontologie financière est strictement interdite.

## Obligations de l'utilisateur

- Fournir des informations exactes
- Ne pas tenter de contourner les mécanismes de sécurité
- Respecter les droits de propriété intellectuelle
- Signaler toute anomalie ou fraude détectée

## Responsabilité de l'éditeur

IBIG Soft s'engage à maintenir le service disponible et sécurisé. La responsabilité de l'éditeur est limitée au montant de l'abonnement en cours.

## Résiliation

L'abonnement peut être résilié à tout moment selon les conditions commerciales. Les données sont conservées 30 jours après résiliation, puis supprimées.

## Modification des CGU

IBIG Soft se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email au moins 30 jours avant toute modification substantielle.
    `,
  },
  'cookies': {
    titre: 'Politique de cookies',
    contenu: `
## Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier stocké sur votre appareil lors de la visite d'un site web.

## Cookies utilisés

### Cookies nécessaires (toujours actifs)
- **Session** : maintien de votre connexion
- **Sécurité** : protection CSRF
- **Préférences** : langue, thème

### Cookies de statistiques (consentement requis)
- Mesure d'audience anonymisée
- Analyse des fonctionnalités utilisées

### Cookies marketing (consentement requis)
- Personnalisation de la landing page
- Campagnes IBIG Partners

## Gestion des cookies

Vous pouvez à tout moment modifier vos préférences via le bandeau de consentement accessible depuis le pied de page.

## Durée

Les cookies nécessaires expirent à la fin de la session ou après 7 jours (connexion mémorisée). Les cookies analytiques expirent après 13 mois.

## Contact

contact@ibigsoft.com
    `,
  },
  'essai': {
    titre: "Conditions de l'essai gratuit",
    contenu: `
## Durée

L'essai gratuit est valable **14 jours** à compter de la création du compte.

## Fonctionnalités incluses

L'essai donne accès à toutes les fonctionnalités de la formule PROFESSIONAL, avec une limite de données.

## Sans engagement

Aucune carte bancaire n'est requise pour démarrer l'essai. À l'issue de la période, le compte passe en lecture seule jusqu'à souscription d'un abonnement ou résiliation.

## Données d'essai

Les données créées pendant l'essai sont conservées en cas de conversion en abonnement payant.

## Conversion

La conversion en abonnement payant peut être effectuée à tout moment depuis l'espace SuperAdmin ou en contactant IBIG Soft.
    `,
  },
  'sara': {
    titre: "Conditions d'utilisation de SARA (IA)",
    contenu: `
## Présentation

SARA est l'assistante intelligente de GESTMONEY, alimentée par des modèles d'intelligence artificielle de tiers (Groq, OpenAI, Anthropic ou autres).

## Limitations

SARA peut commettre des erreurs. Ses réponses ne constituent pas un conseil juridique, financier ou comptable professionnel. Vérifiez toujours les informations importantes auprès d'un professionnel qualifié.

## Données transmises

Les messages envoyés à SARA sont transmis au fournisseur IA configuré. Ne transmettez jamais de données sensibles (mots de passe, numéros de carte, secrets d'affaires).

## Absence d'engagement

SARA présente les fonctionnalités et offres officielles de GESTMONEY. Elle ne peut pas s'engager contractuellement au nom d'IBIG Soft.

## Amélioration continue

Les conversations peuvent être utilisées de façon anonymisée pour améliorer SARA.

## Disponibilité

SARA est soumise à la disponibilité des fournisseurs IA tiers. Des interruptions ponctuelles peuvent survenir.
    `,
  },
};

// Pages avec contenu par défaut générique
const DEFAULT_CONTENT = (titre: string) => ({
  titre,
  contenu: `
## ${titre}

Ce document est en cours de finalisation par l'équipe juridique d'IBIG Soft.

Pour toute question, contactez-nous à : **contact@ibigsoft.com**

**IBIG Soft — IBIG SARL – Intermark Business International Group**
  `,
});

const TITRES: Record<string, string> = {
  'licence': 'Contrat de licence logiciel',
  'conditions-commerciales': 'Conditions commerciales',
  'donnees': 'Traitement des données personnelles',
  'propriete-intellectuelle': 'Propriété intellectuelle',
  'support': 'Conditions de support',
  'sauvegarde': 'Politique de sauvegarde',
  'resiliation': 'Conditions de résiliation',
  'remboursement': 'Politique de remboursement',
  'suppression-compte': 'Suppression du compte',
  'reclamations': 'Procédure de réclamations',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = CONTENUS[params.slug] || DEFAULT_CONTENT(TITRES[params.slug] || 'Document légal');
  return { title: page.titre };
}

function renderMarkdown(content: string) {
  // Simple markdown → HTML (h2, strong, listes, paragraphes)
  const lines = content.trim().split('\n');
  const html: string[] = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      html.push(`<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">${line.slice(3)}</h2>`);
    } else if (line.startsWith('- ')) {
      html.push(`<li class="ml-4 text-gray-600 dark:text-gray-300">${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`);
    } else if (line.trim() === '') {
      html.push('<br />');
    } else {
      html.push(`<p class="text-gray-600 dark:text-gray-300 leading-relaxed">${line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800 dark:text-gray-100">$1</strong>')}</p>`);
    }
  }
  return html.join('\n');
}

export default function LegalPage({ params }: Props) {
  const allSlugs = [...Object.keys(CONTENUS), ...Object.keys(TITRES)];
  if (!allSlugs.includes(params.slug)) notFound();

  const page = CONTENUS[params.slug] || DEFAULT_CONTENT(TITRES[params.slug] || 'Document légal');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/legal" className="text-sm text-green-600 hover:underline">← Documents légaux</Link>
          <Link href="/" className="text-sm text-gray-400 hover:underline ml-4">Accueil</Link>
        </div>

        <article>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{page.titre}</h1>
          <p className="text-xs text-gray-400 mb-8">
            GESTMONEY — IBIG Soft · Dernière mise à jour : juillet 2026
          </p>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.contenu) }}
          />
        </article>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} GESTMONEY. Tous droits réservés.<br />
            IBIG Soft — IBIG SARL – Intermark Business International Group<br />
            <a href="https://ibigsoft.com" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigsoft.com</a>
            {' · '}
            <a href="https://ibigpartners.com/" className="hover:underline" target="_blank" rel="noopener noreferrer">ibigpartners.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}

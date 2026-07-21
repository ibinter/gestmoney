// ============================================================
// GESTMONEY — Contenu des pages légales (FR + EN)
// Module de DONNÉES pur (aucun 'use client', aucune dépendance React)
// → importable à la fois par les composants serveur et client.
//
// Chaque document existe dans les deux langues. Les slugs déjà
// utilisés en production sont CONSERVÉS pour ne casser aucun lien
// (footer, sitemap, bandeau cookies, liens externes).
//
// IMPORTANT — Honnêteté juridique : ces textes sont des MODÈLES.
// Ils ne comportent aucune certification, garantie chiffrée ou
// mention non vérifiée. Les informations à confirmer sont laissées
// en placeholder « [ … à compléter ] ». Chaque page affiche un
// avertissement invitant à une relecture par un juriste (rendu par
// le composant LegalArticle, donc présent sur les 18 pages).
// ============================================================

export interface LegalDoc {
  /** Titre affiché (h1) et utilisé pour les métadonnées. */
  titre: string;
  /** Contenu en markdown simplifié (## titres, - listes, **gras**). */
  contenu: string;
}

export interface LegalEntry {
  fr: LegalDoc;
  en: LegalDoc;
}

// ── Bloc éditeur réutilisé (cohérence des mentions) ───────────────────────
const EDITEUR_FR = `**GESTMONEY** est un logiciel édité par **IBIG Soft**, une marque de **IBIG SARL – Intermark Business International Group**.

- **Raison sociale :** IBIG SARL – Intermark Business International Group
- **Marque produit :** IBIG Soft
- **Siège social :** [Adresse du siège à compléter]
- **RCCM :** [Numéro RCCM à compléter]
- **IFU / Identifiant fiscal :** [Numéro IFU à compléter]
- **Email :** contact@ibigsoft.com
- **Site :** https://ibigsoft.com
- **Programme partenaire :** https://ibigpartners.com/`;

const EDITEUR_EN = `**GESTMONEY** is a software product published by **IBIG Soft**, a brand of **IBIG SARL – Intermark Business International Group**.

- **Legal entity:** IBIG SARL – Intermark Business International Group
- **Product brand:** IBIG Soft
- **Registered office:** [Head office address to be completed]
- **Trade register (RCCM):** [RCCM number to be completed]
- **Tax ID (IFU):** [Tax ID to be completed]
- **Email:** contact@ibigsoft.com
- **Website:** https://ibigsoft.com
- **Partner programme:** https://ibigpartners.com/`;

// ── 18 documents légaux ───────────────────────────────────────────────────
export const LEGAL_CONTENT: Record<string, LegalEntry> = {
  // 1 ──────────────────────────────────────────────────────────────────────
  'mentions-legales': {
    fr: {
      titre: 'Mentions légales',
      contenu: `## Éditeur

${EDITEUR_FR}

## Directeur de la publication

Le représentant légal d'IBIG SARL – Intermark Business International Group. [Nom à compléter].

## Hébergement

Le logiciel GESTMONEY est hébergé sur des serveurs dédiés sécurisés. Les coordonnées de l'hébergeur peuvent être communiquées sur demande à contact@ibigsoft.com.

## Propriété intellectuelle

Le logiciel GESTMONEY, son interface, son logo, ses textes, sa documentation, sa base de données et son identité visuelle sont la propriété exclusive d'IBIG Soft. Toute reproduction, imitation, copie, adaptation, extraction ou utilisation non autorisée est interdite et peut constituer une contrefaçon.

## Responsabilité

IBIG Soft s'efforce de maintenir le logiciel disponible et à jour. Des interruptions ponctuelles peuvent survenir, notamment pour maintenance. IBIG Soft ne saurait être tenu responsable de dommages indirects liés à l'utilisation du logiciel, dans les limites permises par le droit applicable.

## Droit applicable

Le présent logiciel est soumis au droit applicable dans l'espace OHADA et aux lois nationales du pays d'implantation du client.`,
    },
    en: {
      titre: 'Legal notice',
      contenu: `## Publisher

${EDITEUR_EN}

## Publication director

The legal representative of IBIG SARL – Intermark Business International Group. [Name to be completed].

## Hosting

The GESTMONEY software is hosted on secure dedicated servers. The hosting provider's details can be provided on request at contact@ibigsoft.com.

## Intellectual property

The GESTMONEY software, its interface, logo, texts, documentation, database and visual identity are the exclusive property of IBIG Soft. Any unauthorised reproduction, imitation, copy, adaptation, extraction or use is prohibited and may constitute infringement.

## Liability

IBIG Soft strives to keep the software available and up to date. Occasional interruptions may occur, in particular for maintenance. IBIG Soft cannot be held liable for indirect damages arising from use of the software, to the extent permitted by applicable law.

## Governing law

This software is governed by the law applicable in the OHADA area and by the national laws of the customer's country of operation.`,
    },
  },

  // 2 ──────────────────────────────────────────────────────────────────────
  'cgu': {
    fr: {
      titre: "Conditions générales d'utilisation",
      contenu: `## Objet

Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation du logiciel GESTMONEY, plateforme SaaS de gestion des réseaux Mobile Money éditée par IBIG Soft.

## Acceptation

L'utilisation du service implique l'acceptation pleine et entière des présentes CGU. En cas de désaccord, l'utilisateur doit renoncer à l'usage du service.

## Accès au service

L'accès est conditionné à la création d'un compte et à la souscription d'un abonnement ou d'un essai gratuit de 14 jours. Chaque utilisateur est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte.

## Utilisation autorisée

GESTMONEY est destiné à un usage professionnel. Toute utilisation à des fins illicites, frauduleuses ou contraires à la déontologie financière est strictement interdite.

## Obligations de l'utilisateur

- Fournir des informations exactes et à jour
- Ne pas tenter de contourner les mécanismes de sécurité
- Respecter les droits de propriété intellectuelle
- Signaler toute anomalie ou fraude détectée

## Disponibilité

IBIG Soft s'efforce d'assurer la continuité du service mais ne garantit pas une disponibilité ininterrompue. Des maintenances programmées ou d'urgence peuvent survenir.

## Responsabilité

La responsabilité d'IBIG Soft est limitée, dans les conditions permises par la loi, au montant de l'abonnement effectivement réglé sur la période concernée.

## Résiliation

L'abonnement peut être résilié dans les conditions prévues par la politique de résiliation. À l'issue de l'essai ou en cas de non-paiement, une période de grâce de 7 jours s'applique avant restriction de l'accès.

## Modification des CGU

IBIG Soft se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par un moyen approprié avant l'entrée en vigueur de toute modification substantielle.`,
    },
    en: {
      titre: 'Terms of use',
      contenu: `## Purpose

These terms of use govern access to and use of the GESTMONEY software, a SaaS platform for managing Mobile Money networks published by IBIG Soft.

## Acceptance

Use of the service implies full acceptance of these terms. If you disagree, you must refrain from using the service.

## Access to the service

Access requires creating an account and subscribing to a plan or a 14-day free trial. Each user is responsible for keeping their credentials confidential and for all activity carried out from their account.

## Permitted use

GESTMONEY is intended for professional use. Any use for unlawful, fraudulent purposes or contrary to financial ethics is strictly prohibited.

## User obligations

- Provide accurate and up-to-date information
- Not attempt to circumvent security mechanisms
- Respect intellectual property rights
- Report any anomaly or fraud detected

## Availability

IBIG Soft strives to ensure service continuity but does not guarantee uninterrupted availability. Scheduled or emergency maintenance may occur.

## Liability

IBIG Soft's liability is limited, to the extent permitted by law, to the amount of the subscription actually paid for the period concerned.

## Termination

The subscription may be terminated under the conditions set out in the termination policy. After the trial or in the event of non-payment, a 7-day grace period applies before access is restricted.

## Changes to the terms

IBIG Soft reserves the right to amend these terms. Users will be informed by an appropriate means before any substantial change takes effect.`,
    },
  },

  // 3 ──────────────────────────────────────────────────────────────────────
  'conditions-commerciales': {
    fr: {
      titre: 'Conditions commerciales',
      contenu: `## Objet

Les présentes conditions commerciales encadrent la souscription et le paiement des abonnements au logiciel GESTMONEY.

## Formules d'abonnement

GESTMONEY est proposé selon plusieurs formules : **Starter**, **Essentiel**, **Professional** et **Enterprise**. Le détail des fonctionnalités et des tarifs de chaque formule est présenté sur le site et dans l'espace de souscription.

## Essai gratuit

Un essai gratuit de 14 jours est proposé, sans carte bancaire requise pour démarrer. Voir la page « Conditions du programme d'essai ».

## Prix et facturation

Les prix sont indiqués dans la devise applicable (FCFA ou autre selon le pays). La facturation intervient selon la périodicité choisie (mensuelle ou annuelle). Toute taxe applicable est ajoutée conformément à la réglementation en vigueur.

## Moyens de paiement

Les moyens de paiement acceptés incluent notamment le Mobile Money et les autres moyens présentés au moment de la souscription. La disponibilité des moyens de paiement peut varier selon le pays.

## Période de grâce

En cas de défaut de paiement à l'échéance, une période de grâce de 7 jours s'applique avant restriction de l'accès, afin de permettre la régularisation.

## Renouvellement

Sauf résiliation dans les conditions prévues, l'abonnement se renouvelle automatiquement pour une période identique. Voir la politique de résiliation.

## Révision des tarifs

IBIG Soft peut faire évoluer ses tarifs. Toute évolution est communiquée à l'avance et s'applique au renouvellement suivant.`,
    },
    en: {
      titre: 'Commercial terms',
      contenu: `## Purpose

These commercial terms govern the subscription to and payment for GESTMONEY software plans.

## Subscription plans

GESTMONEY is offered under several plans: **Starter**, **Essentiel**, **Professional** and **Enterprise**. The features and pricing of each plan are presented on the website and in the subscription area.

## Free trial

A 14-day free trial is offered, with no bank card required to start. See the "Trial programme terms" page.

## Pricing and billing

Prices are stated in the applicable currency (FCFA or other depending on the country). Billing occurs according to the chosen frequency (monthly or annual). Any applicable tax is added in accordance with current regulations.

## Payment methods

Accepted payment methods include Mobile Money and the other methods presented at subscription time. Payment method availability may vary by country.

## Grace period

In the event of non-payment at the due date, a 7-day grace period applies before access is restricted, to allow the situation to be regularised.

## Renewal

Unless terminated under the applicable conditions, the subscription renews automatically for an identical period. See the termination policy.

## Price changes

IBIG Soft may adjust its prices. Any change is communicated in advance and applies at the next renewal.`,
    },
  },

  // 4 ──────────────────────────────────────────────────────────────────────
  'licence': {
    fr: {
      titre: "Contrat de licence utilisateur",
      contenu: `## Objet

Le présent contrat de licence définit les conditions dans lesquelles IBIG Soft concède à l'utilisateur un droit d'usage du logiciel GESTMONEY.

## Nature de la licence

GESTMONEY est fourni sous forme de service (SaaS). La licence est **non exclusive, non cessible et non transférable**, concédée pour la durée de l'abonnement en cours.

## Étendue du droit d'usage

L'utilisateur est autorisé à utiliser le logiciel pour ses besoins professionnels internes, dans la limite des droits associés à sa formule. La licence ne confère aucun droit de propriété sur le logiciel.

## Restrictions

Sont notamment interdits :

- La copie, la décompilation ou l'ingénierie inverse du logiciel, sauf dans les limites permises par la loi
- La revente, la sous-licence ou la mise à disposition du logiciel à des tiers non autorisés
- Le contournement des mesures techniques de protection
- L'extraction non autorisée de la base de données

## Propriété

Le logiciel, son code, ses interfaces, sa documentation, sa base de données et ses marques restent la propriété exclusive d'IBIG Soft.

## Durée et fin

La licence prend fin de plein droit à l'expiration ou à la résiliation de l'abonnement. À la fin de la licence, l'utilisateur cesse tout usage du logiciel.

## Garantie

Le logiciel est fourni « en l'état ». IBIG Soft s'efforce d'en assurer le bon fonctionnement mais ne garantit pas l'absence totale d'erreurs, dans les limites permises par le droit applicable.`,
    },
    en: {
      titre: 'End-user licence agreement',
      contenu: `## Purpose

This licence agreement sets out the conditions under which IBIG Soft grants the user a right to use the GESTMONEY software.

## Nature of the licence

GESTMONEY is provided as a service (SaaS). The licence is **non-exclusive, non-assignable and non-transferable**, granted for the duration of the current subscription.

## Scope of use

The user is authorised to use the software for its internal professional needs, within the limits of the rights attached to its plan. The licence confers no ownership right over the software.

## Restrictions

The following are prohibited, in particular:

- Copying, decompiling or reverse-engineering the software, except within the limits permitted by law
- Reselling, sub-licensing or making the software available to unauthorised third parties
- Circumventing technical protection measures
- Unauthorised extraction of the database

## Ownership

The software, its code, interfaces, documentation, database and trademarks remain the exclusive property of IBIG Soft.

## Term and termination

The licence ends automatically upon expiry or termination of the subscription. When the licence ends, the user must cease all use of the software.

## Warranty

The software is provided "as is". IBIG Soft strives to ensure its proper operation but does not warrant that it is entirely free of errors, to the extent permitted by applicable law.`,
    },
  },

  // 5 ──────────────────────────────────────────────────────────────────────
  'confidentialite': {
    fr: {
      titre: 'Politique de confidentialité',
      contenu: `## Données collectées

GESTMONEY collecte uniquement les données nécessaires au fonctionnement du service :

- Informations d'identification (nom, prénom, email, téléphone)
- Données d'utilisation (transactions, agents, float)
- Données techniques (journaux, adresse IP, navigateur)

## Finalités

Les données sont utilisées pour :

- Fournir le service contractuel
- Améliorer et sécuriser le logiciel
- Assurer le support et le suivi
- Envoyer des communications contractuelles

## Base légale

Le traitement repose selon les cas sur l'exécution du contrat, le respect d'obligations légales, l'intérêt légitime de l'éditeur ou le consentement de l'utilisateur.

## Durée de conservation

Les données sont conservées pendant la durée du contrat, puis pour la durée nécessaire au respect des obligations légales et comptables applicables dans l'espace OHADA.

## Droits des utilisateurs

Sous réserve du droit applicable, vous disposez de droits d'accès, de rectification, de suppression, de portabilité et d'opposition. Exercice : contact@ibigsoft.com.

## Sécurité

Les données sont chiffrées en transit (HTTPS/TLS). L'accès est contrôlé par authentification et journalisé. IBIG Soft met en œuvre des mesures raisonnables de protection, sans pouvoir garantir une sécurité absolue.

## Sous-traitants

Certaines fonctions (hébergement, envoi d'emails, assistant IA) peuvent faire appel à des prestataires tiers, tenus à des obligations de confidentialité.

## Cookies

Voir la « Politique relative aux cookies ».

## Contact

Pour toute question relative à vos données : contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Privacy policy',
      contenu: `## Data collected

GESTMONEY only collects the data necessary to operate the service:

- Identification information (last name, first name, email, phone)
- Usage data (transactions, agents, float)
- Technical data (logs, IP address, browser)

## Purposes

Data is used to:

- Provide the contractual service
- Improve and secure the software
- Provide support and follow-up
- Send contractual communications

## Legal basis

Processing relies, depending on the case, on performance of the contract, compliance with legal obligations, the publisher's legitimate interest or the user's consent.

## Retention period

Data is kept for the duration of the contract, then for the period necessary to comply with the applicable legal and accounting obligations in the OHADA area.

## User rights

Subject to applicable law, you have rights of access, rectification, erasure, portability and objection. To exercise them: contact@ibigsoft.com.

## Security

Data is encrypted in transit (HTTPS/TLS). Access is controlled by authentication and logged. IBIG Soft implements reasonable protection measures but cannot guarantee absolute security.

## Sub-processors

Certain functions (hosting, email sending, AI assistant) may rely on third-party providers, bound by confidentiality obligations.

## Cookies

See the "Cookie policy".

## Contact

For any question regarding your data: contact@ibigsoft.com.`,
    },
  },

  // 6 ──────────────────────────────────────────────────────────────────────
  'cookies': {
    fr: {
      titre: 'Politique relative aux cookies',
      contenu: `## Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier stocké sur votre appareil lors de la visite d'un site ou de l'utilisation d'une application web.

## Cookies utilisés

### Cookies nécessaires (toujours actifs)

- **Session :** maintien de votre connexion
- **Sécurité :** protection contre les attaques (CSRF)
- **Préférences :** langue, thème

### Cookies de statistiques (consentement requis)

- Mesure d'audience anonymisée
- Analyse des fonctionnalités utilisées

### Cookies marketing (consentement requis)

- Personnalisation de la page de présentation
- Campagnes IBIG Partners

## Gestion des cookies

Vous pouvez à tout moment modifier vos préférences via le bandeau de consentement accessible depuis le service. Vous pouvez également configurer votre navigateur pour refuser les cookies.

## Durée

Les cookies nécessaires expirent à la fin de la session ou après une durée limitée (connexion mémorisée). Les cookies de statistiques et marketing ne sont déposés qu'après votre consentement.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Cookie policy',
      contenu: `## What is a cookie?

A cookie is a small file stored on your device when you visit a site or use a web application.

## Cookies used

### Necessary cookies (always active)

- **Session:** keeping you signed in
- **Security:** protection against attacks (CSRF)
- **Preferences:** language, theme

### Statistics cookies (consent required)

- Anonymised audience measurement
- Analysis of features used

### Marketing cookies (consent required)

- Personalisation of the presentation page
- IBIG Partners campaigns

## Managing cookies

You can change your preferences at any time via the consent banner available from the service. You can also configure your browser to refuse cookies.

## Duration

Necessary cookies expire at the end of the session or after a limited period (remembered login). Statistics and marketing cookies are only set after your consent.

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 7 ──────────────────────────────────────────────────────────────────────
  'sauvegarde': {
    fr: {
      titre: 'Politique de sauvegarde',
      contenu: `## Objectif

IBIG Soft met en place des mesures visant à préserver l'intégrité et la disponibilité des données confiées par les clients de GESTMONEY.

## Sauvegardes régulières

Les données de production font l'objet de sauvegardes régulières. La fréquence et la rétention exactes sont définies par les procédures internes d'exploitation et peuvent évoluer pour renforcer la protection.

## Stockage

Les sauvegardes sont conservées sur une infrastructure sécurisée. Des mesures de chiffrement et de contrôle d'accès sont appliquées.

## Restauration

En cas d'incident, IBIG Soft s'efforce de restaurer les données à partir de la sauvegarde la plus récente disponible, dans les meilleurs délais raisonnables.

## Limites

Aucune solution de sauvegarde ne peut garantir une protection absolue. Nous recommandons aux clients d'exporter régulièrement leurs données importantes lorsque cette fonction est disponible.

## Responsabilité du client

Le client reste responsable de la qualité et de l'exactitude des données saisies, ainsi que de la conservation de tout export réalisé de son côté.

## Contact

Pour toute demande relative aux sauvegardes : contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Backup policy',
      contenu: `## Purpose

IBIG Soft implements measures aimed at preserving the integrity and availability of the data entrusted by GESTMONEY customers.

## Regular backups

Production data is backed up regularly. The exact frequency and retention are defined by internal operating procedures and may evolve to strengthen protection.

## Storage

Backups are kept on secure infrastructure. Encryption and access-control measures are applied.

## Restoration

In the event of an incident, IBIG Soft strives to restore data from the most recent available backup, within the shortest reasonable time.

## Limitations

No backup solution can guarantee absolute protection. We recommend that customers regularly export their important data where this feature is available.

## Customer responsibility

The customer remains responsible for the quality and accuracy of the data entered, as well as for keeping any export it performs on its side.

## Contact

For any request regarding backups: contact@ibigsoft.com.`,
    },
  },

  // 8 ──────────────────────────────────────────────────────────────────────
  'support': {
    fr: {
      titre: 'Politique de support',
      contenu: `## Périmètre

Le support GESTMONEY accompagne les clients dans l'utilisation du logiciel : questions fonctionnelles, incidents techniques et signalements d'anomalies.

## Canaux

- **Email :** contact@ibigsoft.com
- **Assistant IA SARA :** aide intégrée pour les questions courantes (réponses indicatives, voir « Conditions d'utilisation de SARA »)

## Horaires

Le support est assuré aux jours et heures ouvrables. Les délais de réponse peuvent varier selon la nature de la demande et la formule souscrite.

## Priorisation

Les incidents sont traités selon leur gravité (blocage total, dégradation, question simple). IBIG Soft s'efforce de traiter en priorité les incidents critiques.

## Ce qui n'est pas couvert

Le support ne couvre pas :

- Les développements spécifiques non prévus au contrat
- Les problèmes liés à l'environnement du client (réseau, matériel, navigateur non pris en charge)
- La formation approfondie, qui peut faire l'objet d'une prestation dédiée

## Amélioration

Les demandes d'évolution sont enregistrées et étudiées, sans garantie d'implémentation.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Support policy',
      contenu: `## Scope

GESTMONEY support helps customers use the software: functional questions, technical incidents and anomaly reports.

## Channels

- **Email:** contact@ibigsoft.com
- **SARA AI assistant:** built-in help for common questions (indicative answers, see "SARA terms of use")

## Hours

Support is provided on business days and hours. Response times may vary depending on the nature of the request and the plan subscribed to.

## Prioritisation

Incidents are handled according to their severity (total blockage, degradation, simple question). IBIG Soft strives to prioritise critical incidents.

## What is not covered

Support does not cover:

- Custom developments not provided for in the contract
- Issues related to the customer's environment (network, hardware, unsupported browser)
- In-depth training, which may be the subject of a dedicated service

## Improvement

Feature requests are recorded and reviewed, with no guarantee of implementation.

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 9 ──────────────────────────────────────────────────────────────────────
  'resiliation': {
    fr: {
      titre: 'Politique de résiliation',
      contenu: `## Résiliation par le client

Le client peut résilier son abonnement à tout moment depuis son espace ou en contactant IBIG Soft. La résiliation prend effet à la fin de la période déjà réglée, sauf disposition contraire.

## Effet de la résiliation

À l'issue de la résiliation, l'accès au service est interrompu. Les données peuvent être conservées pendant une durée limitée avant suppression, afin de permettre une éventuelle réactivation (voir « Gestion et suppression du compte »).

## Période de grâce

En cas de non-paiement, une période de grâce de 7 jours s'applique avant la restriction de l'accès. Passé ce délai, le compte peut être suspendu.

## Résiliation par l'éditeur

IBIG Soft peut suspendre ou résilier l'accès en cas de manquement grave aux conditions d'utilisation (fraude, usage illicite, non-paiement persistant), après information du client lorsque cela est possible.

## Export des données

Avant la suppression définitive, le client est invité à exporter ses données lorsque cette fonction est disponible.

## Remboursement

Les conditions de remboursement éventuelles sont décrites dans la « Politique de remboursement ».

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Termination policy',
      contenu: `## Termination by the customer

The customer may terminate its subscription at any time from its area or by contacting IBIG Soft. Termination takes effect at the end of the period already paid for, unless otherwise stated.

## Effect of termination

Upon termination, access to the service is interrupted. Data may be kept for a limited period before deletion, to allow possible reactivation (see "Account management and deletion").

## Grace period

In the event of non-payment, a 7-day grace period applies before access is restricted. After this period, the account may be suspended.

## Termination by the publisher

IBIG Soft may suspend or terminate access in the event of a serious breach of the terms of use (fraud, unlawful use, persistent non-payment), after informing the customer where possible.

## Data export

Before final deletion, the customer is invited to export its data where this feature is available.

## Refund

Any applicable refund conditions are described in the "Refund policy".

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 10 ─────────────────────────────────────────────────────────────────────
  'remboursement': {
    fr: {
      titre: 'Politique de remboursement',
      contenu: `## Principe

Les abonnements à GESTMONEY donnent accès à un service numérique fourni en continu. Les conditions de remboursement décrites ci-dessous s'appliquent sous réserve du droit applicable.

## Essai gratuit

L'essai gratuit de 14 jours permet d'évaluer le service sans engagement et sans paiement. Aucune somme n'est prélevée pendant l'essai.

## Demande de remboursement

Toute demande de remboursement doit être adressée à contact@ibigsoft.com en précisant le motif. Chaque demande est étudiée au cas par cas.

## Sommes non remboursables

Sauf disposition légale contraire, ne sont pas remboursées :

- Les périodes déjà consommées
- Les prestations spécifiques déjà réalisées

## Modalités

En cas d'accord, le remboursement est effectué par le moyen de paiement d'origine ou par un autre moyen convenu, dans un délai raisonnable.

## Absence de garantie chiffrée

IBIG Soft n'affiche aucune garantie de remboursement chiffrée automatique. Les conditions définitives sont celles convenues au contrat et précisées lors de la souscription.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Refund policy',
      contenu: `## Principle

Subscriptions to GESTMONEY give access to a digital service provided continuously. The refund conditions described below apply subject to applicable law.

## Free trial

The 14-day free trial lets you evaluate the service without commitment and without payment. No amount is charged during the trial.

## Refund request

Any refund request must be sent to contact@ibigsoft.com stating the reason. Each request is reviewed on a case-by-case basis.

## Non-refundable amounts

Unless otherwise required by law, the following are not refunded:

- Periods already used
- Specific services already delivered

## Terms

If agreed, the refund is made using the original payment method or another agreed method, within a reasonable time.

## No fixed guarantee

IBIG Soft does not display any automatic fixed refund guarantee. The final conditions are those agreed in the contract and specified at subscription time.

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 11 ─────────────────────────────────────────────────────────────────────
  'donnees': {
    fr: {
      titre: 'Politique de traitement des données',
      contenu: `## Objet

La présente politique décrit la manière dont IBIG Soft traite les données à caractère personnel dans le cadre de GESTMONEY, en complément de la « Politique de confidentialité ».

## Rôles

Pour les données de ses propres utilisateurs, le client agit généralement comme responsable de traitement, et IBIG Soft comme sous-traitant agissant sur instructions du client, dans les limites du service.

## Catégories de données

- Données d'identification des utilisateurs et des agents
- Données transactionnelles et financières saisies dans l'outil
- Données techniques et journaux d'audit

## Instructions du client

IBIG Soft traite les données pour les seules finalités de fourniture du service et selon les instructions raisonnables du client, sauf obligation légale.

## Sécurité et confidentialité

Des mesures techniques et organisationnelles raisonnables sont mises en œuvre : chiffrement en transit, contrôle d'accès, journalisation. Le personnel est tenu à la confidentialité.

## Sous-traitants ultérieurs

Le recours à des prestataires (hébergement, email, IA) se fait dans le respect d'obligations de confidentialité et de sécurité équivalentes.

## Transferts

Tout transfert de données hors du pays d'origine est encadré par des garanties appropriées, conformément au droit applicable.

## Violation de données

En cas de violation susceptible d'engendrer un risque, IBIG Soft s'efforce d'informer le client sans retard injustifié.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Data processing policy',
      contenu: `## Purpose

This policy describes how IBIG Soft processes personal data in the context of GESTMONEY, supplementing the "Privacy policy".

## Roles

For its own users' data, the customer generally acts as the data controller, and IBIG Soft as the processor acting on the customer's instructions, within the limits of the service.

## Categories of data

- Identification data of users and agents
- Transactional and financial data entered into the tool
- Technical data and audit logs

## Customer instructions

IBIG Soft processes data solely for the purposes of providing the service and according to the customer's reasonable instructions, unless required by law.

## Security and confidentiality

Reasonable technical and organisational measures are implemented: encryption in transit, access control, logging. Staff are bound by confidentiality.

## Sub-processors

The use of providers (hosting, email, AI) is carried out in compliance with equivalent confidentiality and security obligations.

## Transfers

Any transfer of data outside the country of origin is governed by appropriate safeguards, in accordance with applicable law.

## Data breach

In the event of a breach likely to create a risk, IBIG Soft strives to inform the customer without undue delay.

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 12 ─────────────────────────────────────────────────────────────────────
  'propriete-intellectuelle': {
    fr: {
      titre: 'Propriété intellectuelle',
      contenu: `## Titularité des droits

L'ensemble des éléments composant GESTMONEY est la propriété exclusive d'IBIG Soft, marque de IBIG SARL – Intermark Business International Group.

## Éléments protégés

Sont notamment protégés :

- Le nom et le logo GESTMONEY
- Le code source et les interfaces du logiciel
- La base de données et sa structure
- Les contenus, textes et la documentation
- L'assistant IA SARA et ses éléments distinctifs
- Les marques et signes distinctifs d'IBIG

## Droits concédés à l'utilisateur

L'utilisateur bénéficie d'un simple droit d'usage dans le cadre de sa licence. Aucun droit de propriété n'est cédé.

## Interdictions

Sont interdites la reproduction, l'imitation, l'adaptation, l'extraction, la traduction ou l'exploitation non autorisée de tout ou partie de ces éléments.

## Signalement de contrefaçon

Toute utilisation non autorisée ou toute contrefaçon présumée peut être signalée à **contact@ibigsoft.com**. IBIG Soft se réserve le droit d'engager toute action utile pour défendre ses droits.

## Contributions et retours

Les suggestions transmises par les utilisateurs peuvent être utilisées librement par IBIG Soft pour améliorer le service, sans que cela ne confère de droit à l'utilisateur.`,
    },
    en: {
      titre: 'Intellectual property',
      contenu: `## Ownership of rights

All elements making up GESTMONEY are the exclusive property of IBIG Soft, a brand of IBIG SARL – Intermark Business International Group.

## Protected elements

The following are protected, in particular:

- The GESTMONEY name and logo
- The software source code and interfaces
- The database and its structure
- The contents, texts and documentation
- The SARA AI assistant and its distinctive elements
- IBIG's trademarks and distinctive signs

## Rights granted to the user

The user benefits from a mere right of use under its licence. No ownership right is transferred.

## Prohibitions

The reproduction, imitation, adaptation, extraction, translation or unauthorised exploitation of all or part of these elements is prohibited.

## Reporting infringement

Any unauthorised use or suspected infringement can be reported to **contact@ibigsoft.com**. IBIG Soft reserves the right to take any useful action to defend its rights.

## Contributions and feedback

Suggestions submitted by users may be used freely by IBIG Soft to improve the service, without conferring any right on the user.`,
    },
  },

  // 13 ─────────────────────────────────────────────────────────────────────
  'protection-marque': {
    fr: {
      titre: 'Protection de la marque',
      contenu: `## Marques concernées

Les dénominations **GESTMONEY**, **IBIG Soft**, **IBIG**, **SARA** ainsi que les logos et signes associés sont des marques et signes distinctifs de IBIG SARL – Intermark Business International Group.

## Usage autorisé

Toute référence aux marques doit respecter leur intégrité (orthographe, casse, logo) et ne pas laisser entendre un partenariat, un parrainage ou une affiliation non existants.

## Usages interdits

Sont notamment interdits :

- L'utilisation des marques dans un nom de domaine, une raison sociale ou un produit concurrent
- La modification, l'imitation ou la déformation du logo
- L'utilisation susceptible de créer une confusion dans l'esprit du public
- L'usage à des fins trompeuses ou dénigrantes

## Partenaires

Les partenaires du programme IBIG Partners (https://ibigpartners.com/) peuvent bénéficier de conditions d'usage spécifiques définies dans leur contrat de partenariat.

## Signalement

Tout usage abusif, contrefaçon ou détournement présumé des marques peut être signalé à **contact@ibigsoft.com**. IBIG Soft se réserve le droit d'agir pour protéger ses marques.

## Réserve de droits

L'absence de réaction d'IBIG Soft face à un usage non autorisé ne vaut pas renonciation à ses droits.`,
    },
    en: {
      titre: 'Trademark protection',
      contenu: `## Trademarks concerned

The names **GESTMONEY**, **IBIG Soft**, **IBIG**, **SARA** and the associated logos and signs are trademarks and distinctive signs of IBIG SARL – Intermark Business International Group.

## Permitted use

Any reference to the trademarks must respect their integrity (spelling, case, logo) and must not imply a non-existent partnership, sponsorship or affiliation.

## Prohibited uses

The following are prohibited, in particular:

- Using the trademarks in a domain name, company name or competing product
- Modifying, imitating or distorting the logo
- Any use likely to create confusion in the public's mind
- Any misleading or disparaging use

## Partners

Partners of the IBIG Partners programme (https://ibigpartners.com/) may benefit from specific usage conditions defined in their partnership agreement.

## Reporting

Any misuse, infringement or suspected misappropriation of the trademarks can be reported to **contact@ibigsoft.com**. IBIG Soft reserves the right to act to protect its trademarks.

## Reservation of rights

IBIG Soft's failure to react to unauthorised use does not amount to a waiver of its rights.`,
    },
  },

  // 14 ─────────────────────────────────────────────────────────────────────
  'essai': {
    fr: {
      titre: "Conditions du programme d'essai",
      contenu: `## Durée

L'essai gratuit est valable **14 jours** à compter de la création du compte.

## Fonctionnalités incluses

L'essai donne accès à un large périmètre des fonctionnalités de GESTMONEY afin d'évaluer le service, dans la limite éventuelle de certains volumes de données.

## Sans engagement

Aucune carte bancaire n'est requise pour démarrer l'essai. À l'issue de la période, le compte peut passer en accès restreint jusqu'à la souscription d'un abonnement ou la résiliation.

## Période de grâce

À la fin de l'essai, une période de grâce de 7 jours peut s'appliquer avant restriction complète de l'accès, afin de permettre la conversion.

## Données d'essai

Les données créées pendant l'essai sont conservées en cas de conversion en abonnement payant, dans les limites de la politique de conservation.

## Conversion

La conversion en abonnement payant peut être effectuée à tout moment depuis l'espace d'administration ou en contactant IBIG Soft.

## Usage loyal

L'essai est destiné à une évaluation de bonne foi. IBIG Soft se réserve le droit de limiter les créations répétées de comptes d'essai visant à contourner les conditions commerciales.`,
    },
    en: {
      titre: 'Trial programme terms',
      contenu: `## Duration

The free trial is valid for **14 days** from account creation.

## Included features

The trial gives access to a broad range of GESTMONEY features so you can evaluate the service, subject to possible limits on certain data volumes.

## No commitment

No bank card is required to start the trial. At the end of the period, the account may switch to restricted access until a subscription is taken out or the account is terminated.

## Grace period

At the end of the trial, a 7-day grace period may apply before full access restriction, to allow conversion.

## Trial data

Data created during the trial is kept in the event of conversion to a paid subscription, within the limits of the retention policy.

## Conversion

Conversion to a paid subscription can be carried out at any time from the administration area or by contacting IBIG Soft.

## Fair use

The trial is intended for good-faith evaluation. IBIG Soft reserves the right to limit repeated trial account creations aimed at circumventing the commercial terms.`,
    },
  },

  // 15 ─────────────────────────────────────────────────────────────────────
  'sara': {
    fr: {
      titre: "Conditions d'utilisation de SARA",
      contenu: `## Présentation

SARA est l'assistante intelligente intégrée à GESTMONEY. Elle s'appuie sur des modèles d'intelligence artificielle, y compris de fournisseurs tiers, pour répondre aux questions des utilisateurs.

## Nature des réponses

Les réponses de SARA sont **automatiques, indicatives et non contractuelles**. Elles peuvent comporter des erreurs, des imprécisions ou des informations obsolètes. Elles ne remplacent pas un conseil professionnel (juridique, financier, comptable ou fiscal).

## Vérification

L'utilisateur doit vérifier toute information importante auprès des sources officielles ou d'un professionnel qualifié avant toute décision.

## Absence d'engagement

SARA présente les fonctionnalités et offres de GESTMONEY à titre informatif. Elle ne peut engager contractuellement IBIG Soft ni créer de droits au bénéfice de l'utilisateur.

## Données transmises

Les messages envoyés à SARA peuvent être transmis au fournisseur d'IA configuré pour produire une réponse. **Ne transmettez jamais de données sensibles** (mots de passe, numéros de carte, secrets d'affaires, données personnelles non nécessaires).

## Amélioration

Les échanges peuvent être utilisés de façon anonymisée pour améliorer le service, dans le respect de la politique de confidentialité.

## Disponibilité

SARA dépend de la disponibilité de fournisseurs d'IA tiers. Des interruptions ou limitations peuvent survenir sans préavis.

## Usage responsable

Il est interdit d'utiliser SARA à des fins illicites, trompeuses ou pour tenter d'extraire des informations confidentielles.`,
    },
    en: {
      titre: 'SARA terms of use',
      contenu: `## Overview

SARA is the intelligent assistant built into GESTMONEY. It relies on artificial intelligence models, including from third-party providers, to answer users' questions.

## Nature of the answers

SARA's answers are **automatic, indicative and non-contractual**. They may contain errors, inaccuracies or outdated information. They do not replace professional advice (legal, financial, accounting or tax).

## Verification

The user must verify any important information with official sources or a qualified professional before making any decision.

## No commitment

SARA presents GESTMONEY features and offers for information only. It cannot contractually bind IBIG Soft or create rights for the user.

## Data transmitted

Messages sent to SARA may be transmitted to the configured AI provider to produce an answer. **Never transmit sensitive data** (passwords, card numbers, business secrets, unnecessary personal data).

## Improvement

Exchanges may be used in anonymised form to improve the service, in compliance with the privacy policy.

## Availability

SARA depends on the availability of third-party AI providers. Interruptions or limitations may occur without notice.

## Responsible use

It is prohibited to use SARA for unlawful or misleading purposes, or to attempt to extract confidential information.`,
    },
  },

  // 16 ─────────────────────────────────────────────────────────────────────
  'responsabilite-ia': {
    fr: {
      titre: "Limitation de responsabilité de l'IA",
      contenu: `## Objet

La présente clause précise les limites de responsabilité applicables aux fonctionnalités d'intelligence artificielle de GESTMONEY, notamment l'assistante SARA.

## Caractère indicatif

Les contenus générés par l'IA sont fournis à titre **purement informatif et indicatif**. Ils sont produits automatiquement et peuvent être inexacts, incomplets ou inadaptés à une situation particulière.

## Non-substitution à un conseil professionnel

Les réponses de l'IA ne constituent pas et ne remplacent pas un conseil professionnel qualifié. Toute décision d'ordre juridique, financier, comptable ou fiscal relève de la seule responsabilité de l'utilisateur.

## Décisions de l'utilisateur

L'utilisateur reste seul responsable des décisions prises et des actions réalisées sur la base des réponses de l'IA. Il lui appartient de les vérifier avant toute mise en œuvre.

## Limitation de responsabilité

Dans les limites permises par le droit applicable, IBIG Soft ne saurait être tenu responsable des conséquences directes ou indirectes de l'utilisation des réponses générées par l'IA.

## Dépendance à des tiers

Les fonctionnalités d'IA reposent en partie sur des fournisseurs tiers. IBIG Soft ne garantit ni leur disponibilité continue, ni l'exactitude de leurs modèles.

## Signalement

Toute réponse manifestement erronée ou inappropriée peut être signalée à contact@ibigsoft.com afin d'améliorer le service.`,
    },
    en: {
      titre: 'AI limitation of liability',
      contenu: `## Purpose

This clause sets out the liability limits applicable to GESTMONEY's artificial intelligence features, in particular the SARA assistant.

## Indicative nature

Content generated by the AI is provided for **purely informational and indicative purposes**. It is produced automatically and may be inaccurate, incomplete or unsuited to a particular situation.

## Not a substitute for professional advice

AI answers do not constitute and do not replace qualified professional advice. Any legal, financial, accounting or tax decision is the user's sole responsibility.

## User decisions

The user remains solely responsible for decisions made and actions taken on the basis of AI answers. It is the user's responsibility to verify them before any implementation.

## Limitation of liability

To the extent permitted by applicable law, IBIG Soft cannot be held liable for the direct or indirect consequences of using AI-generated answers.

## Dependence on third parties

AI features rely in part on third-party providers. IBIG Soft does not guarantee their continued availability or the accuracy of their models.

## Reporting

Any clearly erroneous or inappropriate answer can be reported to contact@ibigsoft.com to help improve the service.`,
    },
  },

  // 17 ─────────────────────────────────────────────────────────────────────
  'suppression-compte': {
    fr: {
      titre: 'Gestion et suppression du compte',
      contenu: `## Gestion du compte

Chaque utilisateur peut consulter et mettre à jour les informations de son compte depuis son espace. Les administrateurs peuvent gérer les comptes des utilisateurs de leur organisation.

## Demande de suppression

La suppression d'un compte peut être demandée depuis l'espace approprié ou par email à contact@ibigsoft.com. La demande est traitée dans un délai raisonnable.

## Effet de la suppression

La suppression entraîne la désactivation de l'accès et l'engagement d'un processus de suppression des données associées, sous réserve des obligations légales de conservation.

## Conservation légale

Certaines données peuvent être conservées, même après suppression du compte, pour respecter des obligations légales, comptables ou de lutte contre la fraude, pendant la durée strictement nécessaire.

## Export préalable

Avant toute suppression définitive, l'utilisateur est invité à exporter les données qu'il souhaite conserver, lorsque cette fonction est disponible.

## Comptes liés

La suppression d'un compte administrateur peut affecter l'accès des utilisateurs rattachés à l'organisation. Il appartient au client d'organiser la transition.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Account management and deletion',
      contenu: `## Account management

Each user can view and update their account information from their area. Administrators can manage the accounts of users in their organisation.

## Deletion request

Deleting an account can be requested from the appropriate area or by email to contact@ibigsoft.com. The request is handled within a reasonable time.

## Effect of deletion

Deletion results in access being disabled and the start of a process to delete the associated data, subject to legal retention obligations.

## Legal retention

Certain data may be kept, even after account deletion, to comply with legal, accounting or anti-fraud obligations, for the period strictly necessary.

## Prior export

Before any final deletion, the user is invited to export the data they wish to keep, where this feature is available.

## Linked accounts

Deleting an administrator account may affect the access of users attached to the organisation. It is the customer's responsibility to organise the transition.

## Contact

contact@ibigsoft.com.`,
    },
  },

  // 18 ─────────────────────────────────────────────────────────────────────
  'reclamations': {
    fr: {
      titre: 'Gestion des réclamations',
      contenu: `## Objet

La présente procédure décrit comment adresser une réclamation à IBIG Soft concernant GESTMONEY et comment celle-ci est traitée.

## Comment réclamer

Toute réclamation peut être adressée par email à **contact@ibigsoft.com**, en précisant :

- L'identité et les coordonnées du demandeur
- La description précise du problème rencontré
- Les éléments utiles (dates, captures, références)

## Accusé de réception

IBIG Soft s'efforce d'accuser réception de la réclamation dans un délai raisonnable et d'indiquer les prochaines étapes.

## Traitement

Chaque réclamation est examinée de bonne foi. IBIG Soft peut solliciter des informations complémentaires afin de qualifier et résoudre la demande.

## Délais

Les délais de résolution dépendent de la nature et de la complexité de la réclamation. IBIG Soft s'efforce d'apporter une réponse dans les meilleurs délais raisonnables.

## Escalade

Si la réponse apportée ne satisfait pas le demandeur, celui-ci peut demander un réexamen en le mentionnant expressément dans sa réponse à IBIG Soft.

## Recours

À défaut de solution amiable, les parties peuvent recourir aux voies de règlement prévues par le contrat et le droit applicable dans l'espace OHADA.

## Contact

contact@ibigsoft.com.`,
    },
    en: {
      titre: 'Complaints handling',
      contenu: `## Purpose

This procedure describes how to submit a complaint to IBIG Soft regarding GESTMONEY and how it is handled.

## How to complain

Any complaint can be sent by email to **contact@ibigsoft.com**, stating:

- The identity and contact details of the complainant
- A precise description of the problem encountered
- Any useful evidence (dates, screenshots, references)

## Acknowledgement

IBIG Soft strives to acknowledge receipt of the complaint within a reasonable time and to indicate the next steps.

## Handling

Each complaint is examined in good faith. IBIG Soft may request additional information in order to qualify and resolve the request.

## Timeframes

Resolution times depend on the nature and complexity of the complaint. IBIG Soft strives to provide a response within the shortest reasonable time.

## Escalation

If the response provided does not satisfy the complainant, they may request a review by expressly stating so in their reply to IBIG Soft.

## Remedies

Failing an amicable solution, the parties may use the dispute-resolution methods provided for in the contract and by the law applicable in the OHADA area.

## Contact

contact@ibigsoft.com.`,
    },
  },
};

// ── Slugs (ordre canonique) — sert à generateStaticParams & au garde 404 ──
export const LEGAL_SLUGS: string[] = Object.keys(LEGAL_CONTENT);

// ── Catégories pour l'index (bilingue) ────────────────────────────────────
export interface LegalCategory {
  fr: string;
  en: string;
  slugs: string[];
}

export const LEGAL_CATEGORIES: LegalCategory[] = [
  {
    fr: 'Informations légales',
    en: 'Legal information',
    slugs: ['mentions-legales', 'cgu', 'conditions-commerciales', 'licence'],
  },
  {
    fr: 'Données personnelles & confidentialité',
    en: 'Personal data & privacy',
    slugs: ['confidentialite', 'cookies', 'donnees'],
  },
  {
    fr: 'Service & abonnement',
    en: 'Service & subscription',
    slugs: ['support', 'sauvegarde', 'resiliation', 'remboursement', 'essai'],
  },
  {
    fr: 'Propriété intellectuelle',
    en: 'Intellectual property',
    slugs: ['propriete-intellectuelle', 'protection-marque'],
  },
  {
    fr: 'Intelligence artificielle (SARA)',
    en: 'Artificial intelligence (SARA)',
    slugs: ['sara', 'responsabilite-ia'],
  },
  {
    fr: 'Votre compte',
    en: 'Your account',
    slugs: ['suppression-compte', 'reclamations'],
  },
];

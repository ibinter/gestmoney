// ============================================================
// GESTMONEY — Contenu du Guide utilisateur (FR + EN)
// Module de DONNÉES pur (aucun 'use client', aucune dépendance React)
// → importable à la fois par les composants serveur/client ET par
//   le générateur PDF (guidePdf.ts).
//
// Deux jeux de données :
//   • GUIDE_MODULES     — le guide structuré par module produit
//   • GUIDE_CAS         — les cas pratiques (scénarios pas-à-pas)
//
// Le contenu est du markdown SIMPLIFIÉ, rendu par renderGuideMarkdown() :
//   ## Titre     → sous-titre de niveau 2
//   ### Titre    → sous-titre de niveau 3
//   - item       → liste à puces
//   1. item      → liste numérotée
//   **gras**     → mise en gras
//   > texte      → encadré (callout)
//   (ligne vide) → séparation de paragraphe
//
// Principe d'HONNÊTETÉ : le contenu reste factuel et générique.
// Aucune fonctionnalité inexistante n'est promise ; en cas de doute
// on décrit le geste métier plutôt qu'un bouton précis.
// ============================================================

export interface GuideDoc {
  /** Titre affiché (h2 / entrée de sommaire). */
  titre: string;
  /** Résumé court (une phrase) affiché sous le titre. */
  resume: string;
  /** Contenu en markdown simplifié. */
  contenu: string;
}

export interface GuideModule {
  /** Identifiant stable (ancre + clé). */
  id: string;
  /** Emoji d'illustration (cohérent avec la nav produit). */
  icone: string;
  fr: GuideDoc;
  en: GuideDoc;
}

export interface GuideCas {
  id: string;
  icone: string;
  fr: GuideDoc;
  en: GuideDoc;
}

// ── Rendu markdown simplifié → HTML ───────────────────────────────────────
// Partagé par la vue React (dangerouslySetInnerHTML) et le PDF.
// Les classes utilitaires ne sont utilisées que dans l'app ; le PDF a sa
// propre feuille de style qui cible les mêmes balises (h2/h3/ul/ol/p…).

function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function renderGuideMarkdown(content: string): string {
  const lines = content.trim().split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2 class="gm-guide-h2">${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3 class="gm-guide-h3">${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ')) {
      closeList();
      html.push(`<div class="gm-guide-note">${inline(line.slice(2))}</div>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') { closeList(); html.push('<ol class="gm-guide-ol">'); listType = 'ol'; }
      html.push(`<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`);
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') { closeList(); html.push('<ul class="gm-guide-ul">'); listType = 'ul'; }
      html.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html.push(`<p class="gm-guide-p">${inline(line)}</p>`);
    }
  }
  closeList();
  return html.join('\n');
}

// ── CSS du corps markdown (injecté par les vues, portée .gm-guide-body) ──────
// Défini ici pour être partagé par GuideView et CasPratiques sans toucher au
// CSS global de l'application.
export const GUIDE_BODY_CSS = `
.gm-guide-body .gm-guide-h2 { font-size: 1.05rem; font-weight: 800; margin: 1.25rem 0 .5rem; color:#111827; }
.gm-guide-body .gm-guide-h3 { font-size: .95rem; font-weight: 700; color:#1E8C32; margin: 1rem 0 .35rem; }
.gm-guide-body .gm-guide-p  { font-size: .95rem; line-height: 1.65; margin: .5rem 0; color:#374151; }
.gm-guide-body .gm-guide-ul,
.gm-guide-body .gm-guide-ol { margin: .5rem 0 .5rem 1.35rem; }
.gm-guide-body .gm-guide-ul li { list-style: disc; margin: .3rem 0; font-size: .95rem; line-height: 1.6; color:#374151; }
.gm-guide-body .gm-guide-ol li { list-style: decimal; margin: .3rem 0; font-size: .95rem; line-height: 1.6; color:#374151; }
.gm-guide-body .gm-guide-note { border-left: 3px solid #1E8C32; background: rgba(30,140,50,.06); border-radius: 8px; padding: .6rem .9rem; margin: .75rem 0; font-size: .9rem; color:#245c30; }
.gm-guide-body strong { font-weight: 700; }
.dark .gm-guide-body .gm-guide-h2 { color:#f3f4f6; }
.dark .gm-guide-body .gm-guide-h3 { color:#4ade80; }
.dark .gm-guide-body .gm-guide-p,
.dark .gm-guide-body .gm-guide-ul li,
.dark .gm-guide-body .gm-guide-ol li { color:#d1d5db; }
.dark .gm-guide-body .gm-guide-note { color:#bbf7d0; background: rgba(30,140,50,.12); }
`;

// ══════════════════════════════════════════════════════════════════════════
// 1) MODULES DU GUIDE
// ══════════════════════════════════════════════════════════════════════════

export const GUIDE_MODULES: GuideModule[] = [
  // ── Prise en main / connexion ───────────────────────────────────────────
  {
    id: 'prise-en-main',
    icone: '🚀',
    fr: {
      titre: 'Prise en main & connexion',
      resume: 'Se connecter, comprendre l’interface et choisir sa langue.',
      contenu: `## À quoi ça sert
La prise en main vous permet d’accéder à votre espace GESTMONEY et de vous repérer dans l’interface : barre latérale de navigation, barre supérieure (recherche, notifications, profil) et zone de travail centrale.

### Comment se connecter
1. Ouvrez l’application dans votre navigateur.
2. Saisissez votre **e-mail** et votre **mot de passe**, puis validez.
3. À la première connexion, vérifiez votre profil et complétez les informations manquantes.

### Repères dans l’interface
- La **barre latérale** regroupe les modules (agences, agents, transactions, float, etc.).
- La **barre supérieure** donne accès à la recherche, aux notifications et au menu profil.
- Le **sélecteur de langue** (FR / EN) bascule instantanément toute l’interface.

### Bonnes pratiques
- Utilisez un mot de passe unique et ne le partagez jamais.
- Déconnectez-vous depuis un poste partagé.
> Astuce : la langue choisie est mémorisée sur votre appareil pour vos prochaines visites.`,
    },
    en: {
      titre: 'Getting started & sign-in',
      resume: 'Sign in, find your way around and pick your language.',
      contenu: `## What it is for
Getting started lets you access your GESTMONEY workspace and find your way around: the navigation sidebar, the top bar (search, notifications, profile) and the central work area.

### How to sign in
1. Open the application in your browser.
2. Enter your **email** and **password**, then confirm.
3. On first sign-in, review your profile and complete any missing information.

### Finding your way
- The **sidebar** groups the modules (agencies, agents, transactions, float, etc.).
- The **top bar** gives access to search, notifications and the profile menu.
- The **language switch** (FR / EN) instantly toggles the whole interface.

### Best practices
- Use a unique password and never share it.
- Sign out when using a shared computer.
> Tip: your chosen language is remembered on your device for future visits.`,
    },
  },

  // ── Tableau de bord ─────────────────────────────────────────────────────
  {
    id: 'tableau-de-bord',
    icone: '📊',
    fr: {
      titre: 'Tableau de bord',
      resume: 'Vue d’ensemble en temps réel de votre activité.',
      contenu: `## À quoi ça sert
Le tableau de bord réunit les indicateurs clés de votre réseau : volume de transactions, chiffre d’affaires, commissions, état du float et activité des agents. Il vous donne une lecture rapide de la santé de l’activité.

### Actions clés
- Consultez les **indicateurs (KPI)** en haut de page pour la période en cours.
- Parcourez les **graphiques** d’évolution (transactions, revenus) pour repérer les tendances.
- Utilisez les **raccourcis** vers les modules pour agir directement depuis une alerte.

### Bonnes pratiques
- Commencez chaque journée par le tableau de bord pour détecter une anomalie tôt.
- Croisez les KPI avec le module Reporting pour une analyse détaillée.
> Les chiffres reflètent les données réellement enregistrées : plus la saisie est rigoureuse, plus le tableau de bord est fiable.`,
    },
    en: {
      titre: 'Dashboard',
      resume: 'A real-time overview of your activity.',
      contenu: `## What it is for
The dashboard brings together your network’s key metrics: transaction volume, revenue, commissions, float status and agent activity. It gives you a quick read on the health of the business.

### Key actions
- Check the **KPIs** at the top of the page for the current period.
- Browse the **trend charts** (transactions, revenue) to spot patterns.
- Use the **shortcuts** to modules to act directly from an alert.

### Best practices
- Start each day on the dashboard to catch anomalies early.
- Cross-check KPIs with the Reporting module for detailed analysis.
> The figures reflect the data actually recorded: the more rigorous the entry, the more reliable the dashboard.`,
    },
  },

  // ── Agences ─────────────────────────────────────────────────────────────
  {
    id: 'agences',
    icone: '🏢',
    fr: {
      titre: 'Agences',
      resume: 'Créer et piloter vos points de vente / agences.',
      contenu: `## À quoi ça sert
Le module Agences gère vos points de vente : coordonnées, responsable, statut (active / suspendue) et agents rattachés. C’est la brique d’organisation de votre réseau.

### Actions clés
1. Ouvrez le module **Agences** puis lancez la création d’une nouvelle agence.
2. Renseignez le **nom**, l’**adresse / localisation** et le **responsable**.
3. Enregistrez, puis **affectez des agents** à l’agence.
- Modifiez à tout moment les informations d’une agence existante.
- Suspendez une agence pour bloquer temporairement son activité sans la supprimer.

### Bonnes pratiques
- Nommez vos agences de façon claire et cohérente (ville, quartier).
- Gardez un responsable identifié par agence pour la traçabilité.
> Une agence bien renseignée facilite le suivi du float et des commissions par point de vente.`,
    },
    en: {
      titre: 'Agencies',
      resume: 'Create and manage your points of sale / branches.',
      contenu: `## What it is for
The Agencies module manages your points of sale: contact details, manager, status (active / suspended) and the agents attached to them. It is the organisational backbone of your network.

### Key actions
1. Open the **Agencies** module and start creating a new agency.
2. Fill in the **name**, **address / location** and **manager**.
3. Save, then **assign agents** to the agency.
- Edit an existing agency’s information at any time.
- Suspend an agency to temporarily block its activity without deleting it.

### Best practices
- Name your agencies clearly and consistently (city, district).
- Keep an identified manager per agency for traceability.
> A well-documented agency makes it easier to track float and commissions per point of sale.`,
    },
  },

  // ── Agents ──────────────────────────────────────────────────────────────
  {
    id: 'agents',
    icone: '👥',
    fr: {
      titre: 'Agents',
      resume: 'Gérer les agents, leurs rattachements et leur activité.',
      contenu: `## À quoi ça sert
Le module Agents recense les personnes qui réalisent les opérations sur le terrain. Vous y gérez leurs informations, leur agence de rattachement, leur statut et le suivi de leur activité.

### Actions clés
1. Créez un **nouvel agent** en renseignant son identité et son contact.
2. **Rattachez-le à une agence**.
3. Suivez son activité : transactions réalisées, float disponible, commissions générées.
- Suspendez ou réactivez un agent selon les besoins.

### Bonnes pratiques
- Tenez à jour les coordonnées de chaque agent.
- Vérifiez régulièrement les agents inactifs ou à float faible.
> Un agent doit toujours être rattaché à une agence active pour opérer.`,
    },
    en: {
      titre: 'Agents',
      resume: 'Manage agents, their assignments and activity.',
      contenu: `## What it is for
The Agents module lists the people carrying out operations in the field. Here you manage their details, their assigned agency, their status and the monitoring of their activity.

### Key actions
1. Create a **new agent** by entering their identity and contact details.
2. **Assign them to an agency**.
3. Track their activity: transactions carried out, available float, commissions generated.
- Suspend or reactivate an agent as needed.

### Best practices
- Keep each agent’s contact details up to date.
- Regularly review inactive agents or those with low float.
> An agent must always be attached to an active agency in order to operate.`,
    },
  },

  // ── Transactions dépôt & retrait ────────────────────────────────────────
  {
    id: 'transactions',
    icone: '💸',
    fr: {
      titre: 'Transactions (dépôt & retrait)',
      resume: 'Enregistrer les opérations dépôt et retrait Mobile Money.',
      contenu: `## À quoi ça sert
Le module Transactions enregistre les opérations Mobile Money : **dépôts** (le client alimente son compte) et **retraits** (le client retire des espèces). Chaque opération met à jour le float de l’agent et calcule les frais / commissions associés.

### Enregistrer un dépôt
1. Ouvrez le module **Transactions** et choisissez l’opération **Dépôt**.
2. Sélectionnez l’**agent** et le **client** (ou son numéro).
3. Saisissez le **montant** et l’**opérateur** (canal Mobile Money).
4. Validez : le solde de float et la commission se mettent à jour.

### Enregistrer un retrait
1. Choisissez l’opération **Retrait**.
2. Renseignez l’agent, le client et le montant.
3. Vérifiez que l’agent dispose des **espèces suffisantes**, puis validez.

### Bonnes pratiques
- Vérifiez le montant et le numéro avant de valider : une transaction validée engage le float.
- Rapprochez régulièrement les transactions du solde réel de caisse.
> Le sens de l’impact sur le float dépend du type d’opération et du canal : contrôlez toujours le solde après une opération importante.`,
    },
    en: {
      titre: 'Transactions (cash-in & cash-out)',
      resume: 'Record Mobile Money cash-in and cash-out operations.',
      contenu: `## What it is for
The Transactions module records Mobile Money operations: **cash-in** (the customer tops up their account) and **cash-out** (the customer withdraws cash). Each operation updates the agent’s float and calculates the related fees / commissions.

### Recording a cash-in
1. Open the **Transactions** module and choose the **Cash-in** operation.
2. Select the **agent** and the **customer** (or their number).
3. Enter the **amount** and the **operator** (Mobile Money channel).
4. Confirm: the float balance and commission update automatically.

### Recording a cash-out
1. Choose the **Cash-out** operation.
2. Enter the agent, the customer and the amount.
3. Check that the agent has **enough cash**, then confirm.

### Best practices
- Double-check the amount and number before confirming: a confirmed transaction commits the float.
- Regularly reconcile transactions against the actual cash balance.
> The direction of the impact on the float depends on the operation type and channel: always check the balance after a large operation.`,
    },
  },

  // ── Float / liquidité ───────────────────────────────────────────────────
  {
    id: 'float',
    icone: '💧',
    fr: {
      titre: 'Float & liquidité',
      resume: 'Suivre et réapprovisionner la liquidité des agents.',
      contenu: `## À quoi ça sert
Le float est la liquidité disponible pour opérer (électronique et/ou espèces). Ce module suit le solde de chaque agent / agence et vous alerte quand la liquidité devient insuffisante.

### Actions clés
1. Consultez le **solde de float** par agent et par agence.
2. Repérez les agents **à sec** ou sous le seuil d’alerte.
3. Enregistrez un **réapprovisionnement** en indiquant l’agent et le montant.
- Suivez l’historique des mouvements de float.

### Bonnes pratiques
- Définissez un seuil d’alerte réaliste par agent.
- Anticipez les réapprovisionnements avant les pics d’activité (jours de marché, fin de mois).
> Un agent sans float ne peut plus servir les clients : surveillez les seuils au quotidien.`,
    },
    en: {
      titre: 'Float & liquidity',
      resume: 'Track and replenish agents’ liquidity.',
      contenu: `## What it is for
Float is the liquidity available to operate (electronic and/or cash). This module tracks each agent’s / agency’s balance and alerts you when liquidity runs low.

### Key actions
1. Check the **float balance** per agent and per agency.
2. Spot agents that are **out of float** or below the alert threshold.
3. Record a **replenishment** by specifying the agent and the amount.
- Review the history of float movements.

### Best practices
- Set a realistic alert threshold per agent.
- Anticipate replenishments ahead of activity peaks (market days, month-end).
> An agent with no float can no longer serve customers: monitor thresholds daily.`,
    },
  },

  // ── Commissions ─────────────────────────────────────────────────────────
  {
    id: 'commissions',
    icone: '🎯',
    fr: {
      titre: 'Commissions',
      resume: 'Suivre les commissions générées par les opérations.',
      contenu: `## À quoi ça sert
Le module Commissions récapitule les gains générés par les transactions, par agent, agence et période. Il vous aide à mesurer la rentabilité et à préparer les reversements.

### Actions clés
- Consultez les **commissions par agent** et par agence.
- Filtrez par **période** pour suivre l’évolution.
- Rapprochez les commissions du volume de transactions correspondant.

### Bonnes pratiques
- Vérifiez la cohérence entre volume, frais et commissions.
- Utilisez le Reporting pour exporter un récapitulatif de commissions.
> Les commissions découlent des transactions enregistrées : une saisie rigoureuse garantit un calcul juste.`,
    },
    en: {
      titre: 'Commissions',
      resume: 'Track the commissions generated by operations.',
      contenu: `## What it is for
The Commissions module summarises the earnings generated by transactions, by agent, agency and period. It helps you measure profitability and prepare payouts.

### Key actions
- Review **commissions per agent** and per agency.
- Filter by **period** to track the trend.
- Reconcile commissions against the corresponding transaction volume.

### Best practices
- Check consistency between volume, fees and commissions.
- Use Reporting to export a commission summary.
> Commissions derive from recorded transactions: rigorous entry ensures accurate calculation.`,
    },
  },

  // ── Clients & KYC ───────────────────────────────────────────────────────
  {
    id: 'clients-kyc',
    icone: '🪪',
    fr: {
      titre: 'Clients & KYC',
      resume: 'Gérer les clients et leurs pièces d’identification (KYC).',
      contenu: `## À quoi ça sert
Le module Clients centralise les personnes servies par votre réseau et leurs informations d’identification (KYC — « Know Your Customer »). Il facilite le suivi et la conformité.

### Actions clés
1. Créez une **fiche client** avec son identité et son contact.
2. Renseignez les **informations KYC** requises (pièce d’identité, etc.).
3. Retrouvez un client via la **recherche** avant une opération.
- Mettez à jour une fiche existante quand les informations changent.

### Bonnes pratiques
- Vérifiez l’identité avant d’enregistrer une opération sensible.
- Gardez les données clients exactes et à jour pour la conformité.
> Renseignez uniquement les données nécessaires et traitez-les avec confidentialité.`,
    },
    en: {
      titre: 'Customers & KYC',
      resume: 'Manage customers and their identification (KYC).',
      contenu: `## What it is for
The Customers module centralises the people served by your network and their identification data (KYC — “Know Your Customer”). It supports monitoring and compliance.

### Key actions
1. Create a **customer record** with their identity and contact details.
2. Fill in the required **KYC information** (ID document, etc.).
3. Find a customer via **search** before an operation.
- Update an existing record when information changes.

### Best practices
- Verify identity before recording a sensitive operation.
- Keep customer data accurate and up to date for compliance.
> Only capture the data you need and handle it confidentially.`,
    },
  },

  // ── Comptabilité ────────────────────────────────────────────────────────
  {
    id: 'comptabilite',
    icone: '📒',
    fr: {
      titre: 'Comptabilité',
      resume: 'Suivre les écritures, la caisse et clôturer la journée.',
      contenu: `## À quoi ça sert
Le module Comptabilité assure le suivi financier : mouvements de caisse, écritures, soldes et clôtures. Il vous donne une image fiable des flux de votre activité.

### Actions clés
- Consultez les **écritures** et les **soldes** par période.
- Vérifiez la **caisse** en rapprochant les mouvements réels des transactions.
- Procédez à la **clôture de journée** pour figer les totaux.

### Bonnes pratiques
- Rapprochez la caisse chaque jour avant la clôture.
- Corrigez immédiatement tout écart identifié et documentez-le.
> Une clôture régulière évite l’accumulation d’écarts difficiles à retracer.`,
    },
    en: {
      titre: 'Accounting',
      resume: 'Track entries, cash and close the day.',
      contenu: `## What it is for
The Accounting module handles financial tracking: cash movements, entries, balances and closings. It gives you a reliable picture of your activity’s flows.

### Key actions
- Review **entries** and **balances** by period.
- Check the **cash** by reconciling real movements against transactions.
- Perform the **day-end closing** to lock in the totals.

### Best practices
- Reconcile the cash every day before closing.
- Fix any identified discrepancy immediately and document it.
> Regular closings prevent the build-up of hard-to-trace discrepancies.`,
    },
  },

  // ── Stock ───────────────────────────────────────────────────────────────
  {
    id: 'stock',
    icone: '📦',
    fr: {
      titre: 'Stock',
      resume: 'Gérer les articles et le suivi des quantités.',
      contenu: `## À quoi ça sert
Le module Stock gère les articles associés à votre activité (par exemple consommables ou produits vendus au point de vente) : quantités, entrées, sorties et niveaux d’alerte.

### Actions clés
1. Créez ou mettez à jour un **article** (nom, quantité).
2. Enregistrez les **entrées** et **sorties** de stock.
3. Surveillez les articles sous le **seuil d’alerte**.

### Bonnes pratiques
- Faites un inventaire régulier pour garder des quantités fiables.
- Réapprovisionnez avant la rupture pour ne pas interrompre le service.
> Un stock à jour évite les ruptures et les écarts d’inventaire.`,
    },
    en: {
      titre: 'Stock',
      resume: 'Manage items and quantity tracking.',
      contenu: `## What it is for
The Stock module manages the items related to your activity (for example consumables or products sold at the point of sale): quantities, inflows, outflows and alert levels.

### Key actions
1. Create or update an **item** (name, quantity).
2. Record stock **inflows** and **outflows**.
3. Watch items below the **alert threshold**.

### Best practices
- Run a regular inventory to keep quantities reliable.
- Replenish before running out to avoid service interruptions.
> Up-to-date stock prevents shortages and inventory discrepancies.`,
    },
  },

  // ── RH ──────────────────────────────────────────────────────────────────
  {
    id: 'rh',
    icone: '🧑‍💼',
    fr: {
      titre: 'Ressources humaines',
      resume: 'Gérer le personnel et les informations RH.',
      contenu: `## À quoi ça sert
Le module RH centralise les informations du personnel : identité, poste, rattachement et suivi administratif. Il complète la gestion des agents côté opérationnel.

### Actions clés
1. Créez une **fiche employé** (identité, poste).
2. Renseignez le **rattachement** (agence, équipe).
3. Tenez à jour le **statut** et les informations administratives.

### Bonnes pratiques
- Gardez les fiches à jour lors des arrivées et départs.
- Limitez l’accès aux données RH aux personnes autorisées.
> Les données RH sont sensibles : traitez-les avec confidentialité.`,
    },
    en: {
      titre: 'Human resources',
      resume: 'Manage staff and HR information.',
      contenu: `## What it is for
The HR module centralises staff information: identity, role, assignment and administrative tracking. It complements agent management on the operational side.

### Key actions
1. Create an **employee record** (identity, role).
2. Set the **assignment** (agency, team).
3. Keep the **status** and administrative details up to date.

### Best practices
- Keep records current for arrivals and departures.
- Restrict access to HR data to authorised people.
> HR data is sensitive: handle it confidentially.`,
    },
  },

  // ── Reporting ───────────────────────────────────────────────────────────
  {
    id: 'reporting',
    icone: '📈',
    fr: {
      titre: 'Reporting',
      resume: 'Générer et exporter des rapports d’activité.',
      contenu: `## À quoi ça sert
Le module Reporting produit des rapports d’activité (journaliers, hebdomadaires, mensuels) et permet de les exporter pour l’analyse ou l’archivage.

### Actions clés
1. Choisissez la **période** et le **type de rapport**.
2. Générez le rapport pour obtenir les indicateurs et détails.
3. **Exportez** au format adapté (PDF, tableur, CSV) pour partage ou archivage.

### Bonnes pratiques
- Standardisez vos périodes de reporting (ex. mensuel) pour comparer.
- Archivez les exports importants de façon organisée.
> Les rapports reprennent les données enregistrées : une saisie propre donne des rapports fiables.`,
    },
    en: {
      titre: 'Reporting',
      resume: 'Generate and export activity reports.',
      contenu: `## What it is for
The Reporting module produces activity reports (daily, weekly, monthly) and lets you export them for analysis or archiving.

### Key actions
1. Choose the **period** and the **report type**.
2. Generate the report to get the metrics and details.
3. **Export** in the right format (PDF, spreadsheet, CSV) for sharing or archiving.

### Best practices
- Standardise your reporting periods (e.g. monthly) to enable comparison.
- Archive important exports in an organised way.
> Reports reflect the recorded data: clean entry yields reliable reports.`,
    },
  },

  // ── Licence & facturation ───────────────────────────────────────────────
  {
    id: 'licence-facturation',
    icone: '🔑',
    fr: {
      titre: 'Licence & facturation',
      resume: 'Suivre votre abonnement, vos factures et l’échéance.',
      contenu: `## À quoi ça sert
Ce module concerne votre abonnement à GESTMONEY : l’offre souscrite, la période de validité, les factures et le statut de la licence (active / à renouveler / expirée).

### Actions clés
- Consultez l’**offre** en cours et sa **date d’échéance**.
- Retrouvez et téléchargez vos **factures**.
- Anticipez le **renouvellement** avant l’expiration.

### Bonnes pratiques
- Surveillez l’échéance pour éviter toute interruption de service.
- Conservez vos factures pour votre comptabilité.
> Une licence expirée peut restreindre l’accès : renouvelez avant l’échéance. En cas de doute, contactez IBIG Soft (contact@ibigsoft.com).`,
    },
    en: {
      titre: 'Licence & billing',
      resume: 'Track your subscription, invoices and expiry.',
      contenu: `## What it is for
This module covers your GESTMONEY subscription: the plan you subscribed to, the validity period, invoices and the licence status (active / to renew / expired).

### Key actions
- Check the current **plan** and its **expiry date**.
- Find and download your **invoices**.
- Anticipate the **renewal** before expiry.

### Best practices
- Monitor the expiry date to avoid any service interruption.
- Keep your invoices for your accounting.
> An expired licence may restrict access: renew before expiry. If in doubt, contact IBIG Soft (contact@ibigsoft.com).`,
    },
  },

  // ── SARA (assistant IA) ─────────────────────────────────────────────────
  {
    id: 'sara',
    icone: '🤖',
    fr: {
      titre: 'SARA, l’assistant IA',
      resume: 'Poser des questions et obtenir de l’aide dans l’application.',
      contenu: `## À quoi ça sert
SARA est l’assistant intelligent de GESTMONEY. Vous lui posez des questions en langage naturel pour obtenir de l’aide sur l’utilisation de la plateforme ou une lecture rapide de votre activité.

### Actions clés
1. Ouvrez l’**assistant SARA** depuis l’interface.
2. Formulez votre question en une phrase claire.
3. Lisez la réponse et affinez si besoin en reformulant.

### Bonnes pratiques
- Soyez précis dans votre question pour une réponse pertinente.
- Vérifiez toujours une action critique dans le module concerné avant de la valider.
> SARA vous aide et vous oriente ; les décisions et validations importantes restent de votre responsabilité.`,
    },
    en: {
      titre: 'SARA, the AI assistant',
      resume: 'Ask questions and get help inside the application.',
      contenu: `## What it is for
SARA is GESTMONEY’s smart assistant. You ask questions in natural language to get help using the platform or a quick read on your activity.

### Key actions
1. Open the **SARA assistant** from the interface.
2. Phrase your question in one clear sentence.
3. Read the answer and refine by rephrasing if needed.

### Best practices
- Be specific in your question for a relevant answer.
- Always double-check a critical action in the relevant module before confirming it.
> SARA helps and guides you; important decisions and confirmations remain your responsibility.`,
    },
  },

  // ── Paramètres ──────────────────────────────────────────────────────────
  {
    id: 'parametres',
    icone: '⚙️',
    fr: {
      titre: 'Paramètres',
      resume: 'Configurer votre compte, votre profil et vos préférences.',
      contenu: `## À quoi ça sert
Les paramètres regroupent la configuration de votre compte et de vos préférences : profil, langue, sécurité et options de l’espace.

### Actions clés
- Mettez à jour votre **profil** (nom, contact).
- Choisissez votre **langue** d’interface (FR / EN).
- Gérez les options de **sécurité** de votre compte (dont le mot de passe).

### Bonnes pratiques
- Gardez vos informations de contact à jour.
- Changez votre mot de passe régulièrement et ne le partagez jamais.
> Certaines options peuvent être réservées aux profils administrateurs.`,
    },
    en: {
      titre: 'Settings',
      resume: 'Configure your account, profile and preferences.',
      contenu: `## What it is for
Settings bring together your account configuration and preferences: profile, language, security and workspace options.

### Key actions
- Update your **profile** (name, contact).
- Choose your interface **language** (FR / EN).
- Manage your account **security** options (including the password).

### Best practices
- Keep your contact information up to date.
- Change your password regularly and never share it.
> Some options may be reserved for administrator profiles.`,
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 2) CAS PRATIQUES (scénarios pas-à-pas)
// ══════════════════════════════════════════════════════════════════════════

export const GUIDE_CAS: GuideCas[] = [
  {
    id: 'ouvrir-agence-affecter-agent',
    icone: '🏢',
    fr: {
      titre: 'Ouvrir une nouvelle agence et y affecter un agent',
      resume: 'Créer un point de vente et lui rattacher un agent opérationnel.',
      contenu: `> **Contexte :** vous ouvrez un nouveau point de vente et devez le rendre opérationnel avec au moins un agent.

### Étapes
1. Ouvrez le module **Agences** et lancez la création d’une agence.
2. Renseignez le **nom**, la **localisation** et le **responsable**, puis enregistrez.
3. Ouvrez le module **Agents** et créez (ou sélectionnez) l’agent à affecter.
4. **Rattachez l’agent** à l’agence nouvellement créée.
5. Vérifiez que l’agence et l’agent sont bien **actifs**.

### Résultat attendu
L’agence apparaît dans la liste des agences actives, avec au moins un agent rattaché prêt à réaliser des opérations.`,
    },
    en: {
      titre: 'Open a new agency and assign an agent',
      resume: 'Create a point of sale and attach an operational agent to it.',
      contenu: `> **Context:** you are opening a new point of sale and need to make it operational with at least one agent.

### Steps
1. Open the **Agencies** module and start creating an agency.
2. Fill in the **name**, **location** and **manager**, then save.
3. Open the **Agents** module and create (or select) the agent to assign.
4. **Attach the agent** to the newly created agency.
5. Check that both the agency and the agent are **active**.

### Expected result
The agency appears in the list of active agencies, with at least one attached agent ready to carry out operations.`,
    },
  },
  {
    id: 'depot-verifier-commission',
    icone: '💸',
    fr: {
      titre: 'Enregistrer un dépôt client et vérifier la commission',
      resume: 'Saisir un dépôt puis contrôler la commission générée.',
      contenu: `> **Contexte :** un client souhaite alimenter son compte Mobile Money via votre agent.

### Étapes
1. Ouvrez le module **Transactions** et choisissez l’opération **Dépôt**.
2. Sélectionnez l’**agent**, le **client** et l’**opérateur**.
3. Saisissez le **montant**, puis validez l’opération.
4. Ouvrez le module **Commissions** et filtrez sur l’**agent** et la **période** du jour.
5. Vérifiez que la commission correspondant au dépôt apparaît bien.

### Résultat attendu
Le dépôt est enregistré, le float de l’agent est mis à jour et la commission associée est visible dans le module Commissions.`,
    },
    en: {
      titre: 'Record a customer cash-in and check the commission',
      resume: 'Enter a cash-in, then verify the commission generated.',
      contenu: `> **Context:** a customer wants to top up their Mobile Money account through your agent.

### Steps
1. Open the **Transactions** module and choose the **Cash-in** operation.
2. Select the **agent**, the **customer** and the **operator**.
3. Enter the **amount**, then confirm the operation.
4. Open the **Commissions** module and filter by the **agent** and today’s **period**.
5. Check that the commission for the cash-in appears.

### Expected result
The cash-in is recorded, the agent’s float is updated and the related commission is visible in the Commissions module.`,
    },
  },
  {
    id: 'reapprovisionner-float',
    icone: '💧',
    fr: {
      titre: 'Réapprovisionner le float d’un agent à sec',
      resume: 'Détecter un agent sans liquidité et le recréditer.',
      contenu: `> **Contexte :** un agent ne peut plus servir de clients car son float est épuisé.

### Étapes
1. Ouvrez le module **Float & liquidité**.
2. Repérez l’agent **à sec** (solde nul ou sous le seuil d’alerte).
3. Lancez un **réapprovisionnement** en sélectionnant l’agent.
4. Saisissez le **montant** à recréditer, puis validez.
5. Vérifiez que le **solde de float** de l’agent est de nouveau positif.

### Résultat attendu
Le float de l’agent est réapprovisionné, l’alerte disparaît et l’agent peut de nouveau réaliser des opérations.`,
    },
    en: {
      titre: 'Replenish an out-of-float agent',
      resume: 'Detect an agent with no liquidity and top them up.',
      contenu: `> **Context:** an agent can no longer serve customers because their float is exhausted.

### Steps
1. Open the **Float & liquidity** module.
2. Spot the **out-of-float** agent (zero balance or below the alert threshold).
3. Start a **replenishment** by selecting the agent.
4. Enter the **amount** to credit, then confirm.
5. Check that the agent’s **float balance** is positive again.

### Expected result
The agent’s float is replenished, the alert clears and the agent can carry out operations again.`,
    },
  },
  {
    id: 'retrait-client',
    icone: '🏧',
    fr: {
      titre: 'Effectuer un retrait client en espèces',
      resume: 'Servir un retrait tout en contrôlant la caisse.',
      contenu: `> **Contexte :** un client veut retirer des espèces depuis son compte Mobile Money.

### Étapes
1. Ouvrez le module **Transactions** et choisissez l’opération **Retrait**.
2. Sélectionnez l’**agent** et le **client**.
3. Saisissez le **montant** demandé.
4. Vérifiez que l’agent dispose des **espèces suffisantes** en caisse.
5. Validez l’opération et remettez les espèces au client.

### Résultat attendu
Le retrait est enregistré, le solde de l’agent est ajusté et l’opération est traçable dans l’historique des transactions.`,
    },
    en: {
      titre: 'Process a customer cash withdrawal',
      resume: 'Serve a withdrawal while keeping cash under control.',
      contenu: `> **Context:** a customer wants to withdraw cash from their Mobile Money account.

### Steps
1. Open the **Transactions** module and choose the **Cash-out** operation.
2. Select the **agent** and the **customer**.
3. Enter the requested **amount**.
4. Check that the agent has **enough cash** on hand.
5. Confirm the operation and hand the cash to the customer.

### Expected result
The withdrawal is recorded, the agent’s balance is adjusted and the operation is traceable in the transaction history.`,
    },
  },
  {
    id: 'nouveau-client-kyc',
    icone: '🪪',
    fr: {
      titre: 'Enregistrer un nouveau client avec ses informations KYC',
      resume: 'Créer une fiche client conforme avant de la servir.',
      contenu: `> **Contexte :** un nouveau client se présente pour la première fois et doit être enregistré.

### Étapes
1. Ouvrez le module **Clients & KYC** et créez une **fiche client**.
2. Saisissez l’**identité** et les **coordonnées** du client.
3. Renseignez les **informations KYC** requises (pièce d’identité, etc.).
4. Enregistrez la fiche.
5. Retrouvez le client via la **recherche** pour confirmer sa création.

### Résultat attendu
La fiche client est créée avec ses informations KYC ; le client peut être sélectionné lors des prochaines opérations.`,
    },
    en: {
      titre: 'Register a new customer with their KYC information',
      resume: 'Create a compliant customer record before serving them.',
      contenu: `> **Context:** a new customer arrives for the first time and needs to be registered.

### Steps
1. Open the **Customers & KYC** module and create a **customer record**.
2. Enter the customer’s **identity** and **contact details**.
3. Fill in the required **KYC information** (ID document, etc.).
4. Save the record.
5. Find the customer via **search** to confirm the record was created.

### Expected result
The customer record is created with its KYC information; the customer can be selected in future operations.`,
    },
  },
  {
    id: 'cloturer-journee-comptable',
    icone: '📒',
    fr: {
      titre: 'Clôturer la journée comptable',
      resume: 'Rapprocher la caisse et figer les totaux du jour.',
      contenu: `> **Contexte :** la journée se termine et vous devez arrêter les comptes.

### Étapes
1. Ouvrez le module **Comptabilité**.
2. Consultez les **écritures** et les **mouvements de caisse** du jour.
3. **Rapprochez** la caisse réelle avec les montants enregistrés.
4. Corrigez et documentez tout **écart** identifié.
5. Lancez la **clôture de journée** pour figer les totaux.

### Résultat attendu
La journée est clôturée, les totaux sont figés et la caisse est rapprochée sans écart non expliqué.`,
    },
    en: {
      titre: 'Close the accounting day',
      resume: 'Reconcile cash and lock in the day’s totals.',
      contenu: `> **Context:** the day is ending and you need to close the books.

### Steps
1. Open the **Accounting** module.
2. Review the day’s **entries** and **cash movements**.
3. **Reconcile** the actual cash against the recorded amounts.
4. Fix and document any identified **discrepancy**.
5. Run the **day-end closing** to lock in the totals.

### Expected result
The day is closed, the totals are locked and the cash is reconciled with no unexplained discrepancy.`,
    },
  },
  {
    id: 'generer-rapport-mensuel',
    icone: '📈',
    fr: {
      titre: 'Générer et exporter le rapport mensuel',
      resume: 'Produire le rapport du mois et l’exporter en PDF.',
      contenu: `> **Contexte :** en fin de mois, vous devez produire un rapport d’activité à partager.

### Étapes
1. Ouvrez le module **Reporting**.
2. Sélectionnez la **période** (le mois écoulé) et le type **mensuel**.
3. **Générez** le rapport.
4. Vérifiez les indicateurs (transactions, revenus, commissions).
5. **Exportez** en PDF (ou tableur / CSV) pour l’archivage ou le partage.

### Résultat attendu
Le rapport mensuel est généré et exporté, prêt à être archivé ou partagé avec les parties prenantes.`,
    },
    en: {
      titre: 'Generate and export the monthly report',
      resume: 'Produce the month’s report and export it to PDF.',
      contenu: `> **Context:** at month-end, you need to produce an activity report to share.

### Steps
1. Open the **Reporting** module.
2. Select the **period** (the past month) and the **monthly** type.
3. **Generate** the report.
4. Check the metrics (transactions, revenue, commissions).
5. **Export** to PDF (or spreadsheet / CSV) for archiving or sharing.

### Expected result
The monthly report is generated and exported, ready to be archived or shared with stakeholders.`,
    },
  },
  {
    id: 'licence-expiree',
    icone: '🔑',
    fr: {
      titre: 'Gérer une licence expirée',
      resume: 'Réagir à une échéance dépassée et rétablir l’accès.',
      contenu: `> **Contexte :** un message indique que votre licence GESTMONEY est arrivée à échéance.

### Étapes
1. Ouvrez le module **Licence & facturation**.
2. Vérifiez le **statut** de la licence et la **date d’échéance**.
3. Consultez l’**offre** en cours et retrouvez la dernière **facture**.
4. Lancez le **renouvellement** de l’abonnement.
5. Si l’accès reste bloqué, contactez **IBIG Soft** (contact@ibigsoft.com).

### Résultat attendu
La licence est renouvelée, son statut repasse à « active » et l’accès complet à la plateforme est rétabli.`,
    },
    en: {
      titre: 'Handle an expired licence',
      resume: 'React to a passed expiry date and restore access.',
      contenu: `> **Context:** a message indicates that your GESTMONEY licence has expired.

### Steps
1. Open the **Licence & billing** module.
2. Check the licence **status** and the **expiry date**.
3. Review the current **plan** and find the latest **invoice**.
4. Start the subscription **renewal**.
5. If access remains blocked, contact **IBIG Soft** (contact@ibigsoft.com).

### Expected result
The licence is renewed, its status returns to “active” and full access to the platform is restored.`,
    },
  },
  {
    id: 'poser-question-sara',
    icone: '🤖',
    fr: {
      titre: 'Poser une question à SARA',
      resume: 'Utiliser l’assistant IA pour obtenir de l’aide rapidement.',
      contenu: `> **Contexte :** vous cherchez comment réaliser une action ou comprendre un chiffre.

### Étapes
1. Ouvrez l’**assistant SARA** depuis l’interface.
2. Formulez votre question en une phrase claire et précise.
3. Lisez la réponse proposée par SARA.
4. Reformulez ou précisez si la réponse ne correspond pas exactement.
5. Vérifiez, dans le module concerné, toute action importante avant de la valider.

### Résultat attendu
Vous obtenez une réponse ou une orientation utile, tout en gardant la maîtrise des validations importantes.`,
    },
    en: {
      titre: 'Ask SARA a question',
      resume: 'Use the AI assistant to get help quickly.',
      contenu: `> **Context:** you are looking for how to perform an action or understand a figure.

### Steps
1. Open the **SARA assistant** from the interface.
2. Phrase your question in one clear, precise sentence.
3. Read the answer SARA proposes.
4. Rephrase or add detail if the answer is not quite right.
5. Double-check any important action in the relevant module before confirming it.

### Expected result
You get a useful answer or direction, while keeping control over important confirmations.`,
    },
  },
];

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
      resume: 'Se connecter, comprendre l’interface, choisir sa langue et sécuriser son accès.',
      contenu: `## À quoi ça sert
La prise en main est votre porte d’entrée dans GESTMONEY. Elle vous permet d’accéder à votre espace de travail, de vous repérer dans l’interface et de comprendre où se trouve chaque fonction. C’est aussi ici que se joue la sécurité de votre compte : c’est votre identifiant qui trace chaque opération enregistrée.

Ce module concerne **tous les utilisateurs**, du gérant qui pilote l’ensemble du réseau à l’agent qui saisit les transactions. L’interface s’adapte à votre rôle : vous ne voyez que les modules auxquels vous avez droit.

## Avant de commencer
- Vous devez disposer d’un **compte actif** créé par votre administrateur (adresse e-mail + mot de passe).
- Votre **licence** doit être valide. Pendant l’essai de 14 jours, ou la période de grâce de 7 jours après échéance, l’accès reste ouvert.
- Un navigateur récent (Chrome, Edge, Firefox) et une connexion Internet stable sont recommandés.

## Pas à pas

### Se connecter
1. Ouvrez l’application GESTMONEY dans votre navigateur (adresse fournie par votre organisation).
2. Saisissez votre **e-mail** dans le premier champ.
3. Saisissez votre **mot de passe** dans le second champ.
4. Cliquez sur **Se connecter**. Vous arrivez sur le tableau de bord.
5. À la première connexion, ouvrez votre **profil** (menu en haut à droite) et complétez les informations manquantes.

### Se repérer dans l’interface
1. Repérez la **barre latérale** à gauche : elle regroupe tous les modules (Agences, Agents, Transactions, Float, Commissions, etc.).
2. En haut, la **barre supérieure** donne accès à la **recherche**, aux **notifications** et au **menu profil**.
3. La **zone centrale** affiche le contenu du module sélectionné.
4. Cliquez sur un module de la barre latérale pour l’ouvrir ; l’élément actif est mis en évidence.

### Changer la langue
1. Ouvrez le **sélecteur de langue** (FR / EN), généralement dans la barre supérieure ou les paramètres.
2. Choisissez **Français** ou **English**.
3. L’interface bascule instantanément ; le choix est mémorisé sur votre appareil.

### Se déconnecter
1. Ouvrez le **menu profil** en haut à droite.
2. Cliquez sur **Se déconnecter**.
3. Vous revenez à l’écran de connexion ; votre session est fermée.

## Bonnes pratiques
- Utilisez un **mot de passe unique** et robuste, jamais partagé avec un collègue.
- **Déconnectez-vous** systématiquement sur un poste partagé.
- Ne laissez pas votre session ouverte sans surveillance : chaque opération est tracée sous votre nom.
> Astuce : la langue choisie est mémorisée sur votre appareil pour vos prochaines visites.

## Problèmes fréquents
- **« Identifiants incorrects »** → e-mail ou mot de passe erroné → vérifiez la casse et l’absence d’espace ; demandez une réinitialisation à votre administrateur si besoin.
- **Accès bloqué / licence expirée** → abonnement arrivé à échéance → voyez le module Licence & facturation et renouvelez ; l’accès reste ouvert 7 jours en période de grâce.
- **Certains modules n’apparaissent pas** → votre rôle ne les autorise pas → c’est normal ; contactez votre administrateur si vous pensez y avoir droit.
- **L’interface reste en anglais** → langue non enregistrée → rebasculez via le sélecteur ; le choix est propre à l’appareil.

## Questions fréquentes
- **Puis-je changer mon mot de passe moi-même ?** Oui, depuis le module Paramètres, section sécurité.
- **La langue est-elle la même pour toute l’équipe ?** Non, chacun choisit la sienne ; elle est mémorisée par appareil.
- **Que se passe-t-il si je ferme le navigateur sans me déconnecter ?** La session peut rester active ; sur un poste partagé, déconnectez-vous toujours.
- **Ai-je besoin d’installer un logiciel ?** Non, GESTMONEY fonctionne dans le navigateur.`,
    },
    en: {
      titre: 'Getting started & sign-in',
      resume: 'Sign in, find your way around, pick your language and secure your access.',
      contenu: `## What it is for
Getting started is your entry point into GESTMONEY. It lets you access your workspace, find your way around the interface and understand where each function lives. It is also where account security begins: your login is what traces every operation you record.

This module concerns **every user**, from the manager running the whole network to the agent entering transactions. The interface adapts to your role: you only see the modules you are entitled to.

## Before you begin
- You need an **active account** created by your administrator (email + password).
- Your **licence** must be valid. During the 14-day trial, or the 7-day grace period after expiry, access stays open.
- A recent browser (Chrome, Edge, Firefox) and a stable Internet connection are recommended.

## Step by step

### Sign in
1. Open the GESTMONEY application in your browser (the address provided by your organisation).
2. Enter your **email** in the first field.
3. Enter your **password** in the second field.
4. Click **Sign in**. You land on the dashboard.
5. On first sign-in, open your **profile** (top-right menu) and complete any missing information.

### Find your way around
1. Locate the **sidebar** on the left: it groups all modules (Agencies, Agents, Transactions, Float, Commissions, etc.).
2. At the top, the **top bar** gives access to **search**, **notifications** and the **profile menu**.
3. The **central area** shows the content of the selected module.
4. Click a module in the sidebar to open it; the active item is highlighted.

### Change the language
1. Open the **language switch** (FR / EN), usually in the top bar or settings.
2. Choose **Français** or **English**.
3. The interface switches instantly; your choice is remembered on your device.

### Sign out
1. Open the **profile menu** at the top right.
2. Click **Sign out**.
3. You return to the sign-in screen; your session is closed.

## Best practices
- Use a **unique**, strong **password**, never shared with a colleague.
- Always **sign out** on a shared computer.
- Do not leave your session unattended: every operation is traced under your name.
> Tip: your chosen language is remembered on your device for future visits.

## Common problems
- **“Invalid credentials”** → wrong email or password → check case and stray spaces; ask your administrator for a reset if needed.
- **Access blocked / licence expired** → subscription past due → see the Licence & billing module and renew; access stays open for 7 grace-period days.
- **Some modules are missing** → your role does not allow them → this is normal; contact your administrator if you believe you should have access.
- **The interface stays in French** → language not saved → switch again via the selector; the choice is per device.

## Frequently asked questions
- **Can I change my own password?** Yes, from the Settings module, security section.
- **Is the language the same for the whole team?** No, each person picks their own; it is remembered per device.
- **What happens if I close the browser without signing out?** The session may stay active; on a shared computer, always sign out.
- **Do I need to install any software?** No, GESTMONEY runs in the browser.`,
    },
  },

  // ── Tableau de bord ─────────────────────────────────────────────────────
  {
    id: 'tableau-de-bord',
    icone: '📊',
    fr: {
      titre: 'Tableau de bord',
      resume: 'Vue d’ensemble en temps réel de votre activité : KPI, tendances et alertes.',
      contenu: `## À quoi ça sert
Le tableau de bord est la première page que vous voyez en vous connectant. Il réunit en un coup d’œil les indicateurs clés de votre réseau : volume de transactions, chiffre d’affaires, commissions, état du float et activité des agents. Son but est de vous donner une lecture rapide de la santé de l’activité et d’attirer votre attention sur ce qui demande une action.

Il est utilisé surtout par le **gérant** et les **superviseurs**, qui pilotent l’ensemble, mais tout profil ayant accès y trouve un résumé adapté à son périmètre.

## Avant de commencer
- Le tableau de bord n’affiche que ce qui a été **réellement saisi** dans les autres modules : agences, agents, transactions, float.
- Pour des chiffres pertinents, assurez-vous que les transactions du jour sont **bien enregistrées** au fil de l’eau.
- Aucun droit particulier n’est requis pour consulter votre propre périmètre.

## Pas à pas

### Lire les indicateurs (KPI)
1. Ouvrez le **Tableau de bord** depuis la barre latérale (page d’accueil par défaut).
2. En haut, repérez les **cartes KPI** : volume de transactions, revenus, commissions, float total.
3. Notez la **période** couverte par ces chiffres (jour, semaine ou mois selon l’affichage).
4. Comparez mentalement avec la veille pour détecter une variation inhabituelle.

### Analyser les tendances
1. Faites défiler jusqu’aux **graphiques d’évolution** (transactions et revenus).
2. Repérez les **pics** et les **creux** : jours de marché, fin de mois, incidents.
3. Survolez un point du graphique pour lire la valeur détaillée.

### Réagir à une alerte
1. Repérez les **agents à float faible** ou les indicateurs signalés en rouge / orange.
2. Cliquez sur le **raccourci** vers le module concerné (Float, Transactions…).
3. Traitez l’anomalie directement, puis revenez au tableau de bord pour vérifier la mise à jour.

## Bonnes pratiques
- Commencez **chaque journée** par le tableau de bord pour détecter une anomalie tôt.
- Croisez les KPI avec le module **Reporting** pour une analyse détaillée et exportable.
- Ne prenez pas une décision lourde sur le seul KPI : vérifiez le détail dans le module source.
> Les chiffres reflètent les données réellement enregistrées : plus la saisie est rigoureuse, plus le tableau de bord est fiable.

## Problèmes fréquents
- **Les chiffres semblent figés / à zéro** → aucune transaction saisie sur la période → vérifiez la saisie et la période affichée.
- **Un écart avec le Reporting** → périodes ou filtres différents → alignez la même période dans les deux modules.
- **Le float total paraît faux** → un réapprovisionnement non enregistré → contrôlez le module Float.
- **Rien ne s’affiche** → connexion instable ou droits limités → rechargez la page ou vérifiez votre rôle.

## Questions fréquentes
- **À quelle fréquence les chiffres se mettent-ils à jour ?** Ils reflètent les données enregistrées ; rechargez la page pour la vue la plus récente.
- **Puis-je choisir la période affichée ?** L’affichage suit la période prévue par le module ; pour un choix libre, utilisez le Reporting.
- **Le tableau de bord remplace-t-il la comptabilité ?** Non, c’est une vue de pilotage ; la comptabilité reste la source financière de référence.
- **Pourquoi mes chiffres diffèrent de ceux d’un collègue ?** Vos périmètres (agence, rôle) peuvent différer.`,
    },
    en: {
      titre: 'Dashboard',
      resume: 'A real-time overview of your activity: KPIs, trends and alerts.',
      contenu: `## What it is for
The dashboard is the first page you see when you sign in. At a glance it brings together your network’s key metrics: transaction volume, revenue, commissions, float status and agent activity. Its purpose is to give you a quick read on the health of the business and draw your attention to what needs action.

It is used mainly by the **manager** and **supervisors**, who oversee the whole operation, but any profile with access sees a summary scoped to their perimeter.

## Before you begin
- The dashboard only shows what has actually been **recorded** in the other modules: agencies, agents, transactions, float.
- For meaningful figures, make sure the day’s transactions are **entered as they happen**.
- No special rights are needed to view your own perimeter.

## Step by step

### Read the KPIs
1. Open the **Dashboard** from the sidebar (the default home page).
2. At the top, find the **KPI cards**: transaction volume, revenue, commissions, total float.
3. Note the **period** these figures cover (day, week or month depending on the display).
4. Mentally compare with yesterday to catch any unusual change.

### Analyse trends
1. Scroll to the **trend charts** (transactions and revenue).
2. Spot the **peaks** and **dips**: market days, month-end, incidents.
3. Hover over a chart point to read the detailed value.

### React to an alert
1. Spot **agents with low float** or indicators flagged in red / orange.
2. Click the **shortcut** to the relevant module (Float, Transactions…).
3. Handle the anomaly directly, then return to the dashboard to check the update.

## Best practices
- Start **every day** on the dashboard to catch anomalies early.
- Cross-check KPIs with the **Reporting** module for detailed, exportable analysis.
- Do not make a heavy decision on a single KPI: check the detail in the source module.
> The figures reflect the data actually recorded: the more rigorous the entry, the more reliable the dashboard.

## Common problems
- **Figures look frozen / at zero** → no transactions recorded for the period → check entry and the displayed period.
- **A gap with Reporting** → different periods or filters → align the same period in both modules.
- **Total float looks wrong** → an unrecorded replenishment → check the Float module.
- **Nothing shows** → unstable connection or limited rights → reload the page or check your role.

## Frequently asked questions
- **How often do the figures update?** They reflect recorded data; reload the page for the latest view.
- **Can I choose the displayed period?** The view follows the module’s intended period; for a free choice, use Reporting.
- **Does the dashboard replace accounting?** No, it is a management view; accounting remains the financial source of truth.
- **Why do my figures differ from a colleague’s?** Your perimeters (agency, role) may differ.`,
    },
  },

  // ── Agences ─────────────────────────────────────────────────────────────
  {
    id: 'agences',
    icone: '🏢',
    fr: {
      titre: 'Agences',
      resume: 'Créer, modifier et piloter vos points de vente / agences.',
      contenu: `## À quoi ça sert
Le module Agences gère vos points de vente physiques : coordonnées, responsable, statut (active / suspendue) et agents rattachés. C’est la **brique d’organisation** de tout votre réseau : chaque agent, chaque float et chaque commission se rattachent à une agence. Bien structurer vos agences, c’est pouvoir ensuite lire votre activité point de vente par point de vente.

Il est utilisé par le **gérant** ou l’**administrateur** du réseau, qui décide de l’ouverture, de la fermeture ou de la suspension d’un point de vente.

## Avant de commencer
- C’est **le premier module à renseigner** : créez vos agences avant vos agents, car un agent doit être rattaché à une agence.
- Préparez les informations : nom, localisation, nom du responsable.
- Vous devez disposer des **droits d’administration** pour créer ou suspendre une agence.

## Pas à pas

### Créer une agence
1. Ouvrez le module **Agences** dans la barre latérale.
2. Cliquez sur **Nouvelle agence** (ou le bouton d’ajout).
3. Renseignez le **nom** (clair et unique, ex. « Agence Cocody »).
4. Saisissez l’**adresse / localisation** et le **responsable**.
5. Cliquez sur **Enregistrer** : l’agence apparaît dans la liste, au statut actif.

### Affecter des agents
1. Depuis la fiche de l’agence (ou le module Agents), ouvrez la gestion des rattachements.
2. Sélectionnez le ou les **agents** à rattacher.
3. Validez : les agents apparaissent désormais sous cette agence.

### Modifier une agence
1. Dans la liste, cliquez sur l’agence à modifier pour ouvrir sa **fiche**.
2. Corrigez les champs souhaités (nom, localisation, responsable).
3. Enregistrez ; les modifications sont immédiates.

### Suspendre ou réactiver une agence
1. Ouvrez la fiche de l’agence.
2. Basculez son **statut** sur **Suspendue** pour bloquer temporairement son activité.
3. Pour la remettre en service, rebasculez le statut sur **Active**.
> Suspendre n’efface rien : l’historique et les données restent, seule l’activité est gelée.

### Rechercher et filtrer
1. Utilisez la **barre de recherche** pour retrouver une agence par nom.
2. Filtrez par **statut** (active / suspendue) pour cibler la liste.

## Bonnes pratiques
- Nommez vos agences de façon **claire et cohérente** (ville, quartier) pour les repérer vite.
- Gardez un **responsable identifié** par agence pour la traçabilité.
- Préférez **suspendre** plutôt que supprimer une agence temporairement inactive.
> Une agence bien renseignée facilite le suivi du float et des commissions par point de vente.

## Problèmes fréquents
- **Impossible de rattacher un agent** → l’agence est suspendue → réactivez-la d’abord.
- **La liste est vide** → un filtre trop restrictif → réinitialisez les filtres et la recherche.
- **Deux agences portent le même nom** → nommage non standardisé → renommez avec ville/quartier pour distinguer.
- **Le bouton créer est absent** → droits insuffisants → demandez le rôle administrateur.

## Questions fréquentes
- **Peut-on supprimer une agence ?** Évitez-le si elle a un historique ; la suspension est préférable pour conserver la traçabilité.
- **Un agent peut-il dépendre de deux agences ?** Un agent est rattaché à une agence active pour opérer.
- **Le float est-il suivi par agence ?** Oui, indirectement via les agents rattachés.
- **Que devient l’historique d’une agence suspendue ?** Il est conservé et reste consultable.`,
    },
    en: {
      titre: 'Agencies',
      resume: 'Create, edit and manage your points of sale / branches.',
      contenu: `## What it is for
The Agencies module manages your physical points of sale: contact details, manager, status (active / suspended) and the agents attached to them. It is the **organisational backbone** of your entire network: every agent, every float and every commission ties back to an agency. Structuring your agencies well lets you later read your activity point of sale by point of sale.

It is used by the network **manager** or **administrator**, who decides on opening, closing or suspending a point of sale.

## Before you begin
- This is **the first module to fill in**: create your agencies before your agents, since an agent must be attached to an agency.
- Prepare the information: name, location, manager’s name.
- You need **administration rights** to create or suspend an agency.

## Step by step

### Create an agency
1. Open the **Agencies** module in the sidebar.
2. Click **New agency** (or the add button).
3. Enter the **name** (clear and unique, e.g. “Cocody Branch”).
4. Fill in the **address / location** and the **manager**.
5. Click **Save**: the agency appears in the list, with active status.

### Assign agents
1. From the agency record (or the Agents module), open the assignment management.
2. Select the **agent(s)** to attach.
3. Confirm: the agents now appear under this agency.

### Edit an agency
1. In the list, click the agency to open its **record**.
2. Correct the desired fields (name, location, manager).
3. Save; changes take effect immediately.

### Suspend or reactivate an agency
1. Open the agency record.
2. Switch its **status** to **Suspended** to temporarily block its activity.
3. To bring it back, switch the status to **Active** again.
> Suspending deletes nothing: history and data remain, only activity is frozen.

### Search and filter
1. Use the **search bar** to find an agency by name.
2. Filter by **status** (active / suspended) to narrow the list.

## Best practices
- Name your agencies **clearly and consistently** (city, district) to find them fast.
- Keep an **identified manager** per agency for traceability.
- Prefer **suspending** over deleting a temporarily inactive agency.
> A well-documented agency makes it easier to track float and commissions per point of sale.

## Common problems
- **Can’t attach an agent** → the agency is suspended → reactivate it first.
- **The list is empty** → an overly restrictive filter → reset filters and search.
- **Two agencies share the same name** → non-standardised naming → rename with city/district to tell them apart.
- **The create button is missing** → insufficient rights → request the administrator role.

## Frequently asked questions
- **Can an agency be deleted?** Avoid it if it has history; suspension is preferable to keep traceability.
- **Can an agent belong to two agencies?** An agent is attached to one active agency to operate.
- **Is float tracked per agency?** Yes, indirectly through the attached agents.
- **What happens to a suspended agency’s history?** It is kept and remains viewable.`,
    },
  },

  // ── Agents ──────────────────────────────────────────────────────────────
  {
    id: 'agents',
    icone: '👥',
    fr: {
      titre: 'Agents',
      resume: 'Créer, modifier, suspendre et suivre l’activité des agents.',
      contenu: `## À quoi ça sert
Le module Agents recense les personnes qui réalisent les opérations Mobile Money sur le terrain. Vous y gérez leur identité, leur agence de rattachement, leur statut et le suivi de leur activité (transactions, float, commissions). C’est le lien entre votre organisation et les opérations réelles : chaque transaction est enregistrée au nom d’un agent.

Il est utilisé par le **gérant** et les **superviseurs** qui recrutent, affectent et pilotent les agents.

## Avant de commencer
- Vos **agences** doivent déjà exister : un agent se rattache à une agence active.
- Préparez l’identité et le contact de l’agent.
- Il est utile d’avoir défini le **seuil d’alerte de float** que vous souhaitez appliquer.

## Pas à pas

### Créer un agent
1. Ouvrez le module **Agents**.
2. Cliquez sur **Nouvel agent**.
3. Renseignez son **identité** (nom, prénom) et son **contact** (téléphone).
4. Choisissez l’**agence de rattachement** (active).
5. Enregistrez : l’agent apparaît dans la liste, prêt à opérer.

### Modifier un agent
1. Cliquez sur l’agent pour ouvrir sa **fiche détail**.
2. Mettez à jour les informations (contact, agence, statut).
3. Enregistrez.

### Suspendre ou réactiver un agent
1. Ouvrez la fiche de l’agent.
2. Basculez son **statut** sur **Suspendu** : il ne peut plus enregistrer d’opérations.
3. Rebasculez sur **Actif** pour le remettre en service.

### Suivre l’activité d’un agent
1. Ouvrez sa **fiche détail**.
2. Consultez ses **transactions réalisées**, son **float disponible** et ses **commissions générées**.
3. Repérez un float sous le seuil pour déclencher un réapprovisionnement.

### Rechercher et filtrer
1. Utilisez la **recherche** par nom.
2. Filtrez par **agence** ou par **statut** pour cibler la liste.

## Bonnes pratiques
- Tenez à jour les **coordonnées** de chaque agent.
- Vérifiez régulièrement les agents **inactifs** ou **à float faible**.
- Suspendez immédiatement un agent qui quitte le réseau plutôt que de le laisser actif.
> Un agent doit toujours être rattaché à une agence active pour opérer.

## Problèmes fréquents
- **L’agent n’apparaît pas dans les transactions** → il est suspendu ou non rattaché → vérifiez son statut et son agence.
- **Impossible de créer un agent** → aucune agence active disponible → créez / réactivez d’abord une agence.
- **Float toujours à zéro** → aucun réapprovisionnement enregistré → passez par le module Float.
- **La liste est vide** → filtre agence/statut trop restrictif → réinitialisez les filtres.

## Questions fréquentes
- **Un agent peut-il changer d’agence ?** Oui, modifiez son rattachement dans sa fiche.
- **Que deviennent ses transactions s’il est suspendu ?** Elles restent dans l’historique ; il ne peut simplement plus en créer.
- **Peut-on supprimer un agent ?** Préférez la suspension pour conserver l’historique et les commissions.
- **Comment savoir qui a le plus de float bloqué ?** Consultez le module Float, trié par agent.`,
    },
    en: {
      titre: 'Agents',
      resume: 'Create, edit, suspend and monitor agents’ activity.',
      contenu: `## What it is for
The Agents module lists the people carrying out Mobile Money operations in the field. Here you manage their identity, their assigned agency, their status and the monitoring of their activity (transactions, float, commissions). It is the link between your organisation and real operations: every transaction is recorded under an agent’s name.

It is used by the **manager** and **supervisors** who recruit, assign and oversee agents.

## Before you begin
- Your **agencies** must already exist: an agent attaches to an active agency.
- Prepare the agent’s identity and contact details.
- It helps to have decided the **float alert threshold** you want to apply.

## Step by step

### Create an agent
1. Open the **Agents** module.
2. Click **New agent**.
3. Enter their **identity** (first and last name) and **contact** (phone).
4. Choose the **assigned agency** (active).
5. Save: the agent appears in the list, ready to operate.

### Edit an agent
1. Click the agent to open their **detail record**.
2. Update the information (contact, agency, status).
3. Save.

### Suspend or reactivate an agent
1. Open the agent’s record.
2. Switch their **status** to **Suspended**: they can no longer record operations.
3. Switch back to **Active** to bring them back into service.

### Monitor an agent’s activity
1. Open their **detail record**.
2. Review their **transactions**, their **available float** and their **generated commissions**.
3. Spot a float below threshold to trigger a replenishment.

### Search and filter
1. Use **search** by name.
2. Filter by **agency** or **status** to narrow the list.

## Best practices
- Keep each agent’s **contact details** up to date.
- Regularly review **inactive** agents or those with **low float**.
- Suspend an agent who leaves the network immediately rather than leaving them active.
> An agent must always be attached to an active agency in order to operate.

## Common problems
- **The agent isn’t available in transactions** → they are suspended or unassigned → check their status and agency.
- **Can’t create an agent** → no active agency available → create / reactivate an agency first.
- **Float always at zero** → no replenishment recorded → use the Float module.
- **The list is empty** → agency/status filter too restrictive → reset the filters.

## Frequently asked questions
- **Can an agent change agency?** Yes, edit their assignment in their record.
- **What happens to their transactions if suspended?** They stay in history; they simply can no longer create new ones.
- **Can an agent be deleted?** Prefer suspension to keep history and commissions.
- **How do I see who holds the most locked float?** Check the Float module, sorted by agent.`,
    },
  },

  // ── Transactions dépôt & retrait ────────────────────────────────────────
  {
    id: 'transactions',
    icone: '💸',
    fr: {
      titre: 'Transactions (dépôt & retrait)',
      resume: 'Enregistrer et suivre les opérations dépôt (cash-in) et retrait (cash-out).',
      contenu: `## À quoi ça sert
Le module Transactions est le cœur opérationnel de GESTMONEY. Il enregistre les opérations Mobile Money : **dépôts / cash-in** (le client alimente son compte) et **retraits / cash-out** (le client retire des espèces). Chaque opération met à jour le **float** de l’agent, calcule les **frais et commissions** et alimente la comptabilité et le reporting.

Il est utilisé au quotidien par les **agents** et supervisé par le **gérant**. C’est le module le plus sollicité : la fiabilité de tout le système dépend de la rigueur de saisie ici.

## Avant de commencer
- L’**agent** doit être actif et rattaché à une agence active.
- L’agent doit disposer d’un **float** (électronique pour un dépôt, espèces pour un retrait) suffisant.
- L’**opérateur** Mobile Money (Orange Money, MTN MoMo, Wave, Moov…) doit être disponible ; sinon, ajoutez-le via la gestion des opérateurs.
- Le **client** peut être enregistré au préalable (module Clients & KYC) ou identifié par son numéro.

## Pas à pas

### Enregistrer un dépôt (cash-in)
1. Ouvrez le module **Transactions**.
2. Choisissez l’opération **Dépôt**.
3. Sélectionnez l’**agent** qui réalise l’opération.
4. Sélectionnez le **client** (ou saisissez son **numéro**).
5. Choisissez l’**opérateur** (canal Mobile Money).
6. Saisissez le **montant** en XOF.
7. Cliquez sur **Valider** : le float et la commission se mettent à jour automatiquement.

### Enregistrer un retrait (cash-out)
1. Choisissez l’opération **Retrait**.
2. Renseignez l’**agent**, le **client** et l’**opérateur**.
3. Saisissez le **montant** demandé.
4. Vérifiez que l’agent dispose des **espèces suffisantes** en caisse.
5. Validez, puis remettez les espèces au client.

### Consulter et rechercher une transaction
1. Parcourez la **liste des transactions**, la plus récente en tête.
2. Filtrez par **agent**, **opérateur**, **type** (dépôt / retrait) ou **période**.
3. Cliquez sur une ligne pour voir le **détail** (montant, frais, commission, horodatage).

## Bonnes pratiques
- **Vérifiez le montant et le numéro** avant de valider : une transaction validée engage le float.
- Saisissez les opérations **au fil de l’eau**, jamais en fin de journée de mémoire.
- Rapprochez régulièrement les transactions du **solde réel de caisse**.
> Le sens de l’impact sur le float dépend du type d’opération et du canal : contrôlez toujours le solde après une opération importante.

## Problèmes fréquents
- **« Float insuffisant »** → l’agent n’a plus la liquidité nécessaire → réapprovisionnez via le module Float avant de recommencer.
- **L’opérateur n’est pas dans la liste** → canal non configuré → ajoutez-le dans la gestion des opérateurs.
- **La commission semble fausse** → montant ou opérateur erroné → vérifiez la saisie ; la commission découle du montant et du canal.
- **Impossible de sélectionner l’agent** → agent suspendu ou non rattaché → réactivez-le / rattachez-le.
- **Doublon de transaction** → double validation → vérifiez l’historique avant de ressaisir.

## Questions fréquentes
- **Puis-je annuler une transaction validée ?** Une opération validée engage le float ; traitez toute correction avec rigueur et tracez-la (voir Comptabilité).
- **Le client doit-il exister au préalable ?** Pas obligatoirement, mais une fiche client facilite le suivi et la conformité KYC.
- **Où voir les commissions générées ?** Dans le module Commissions, filtrées par agent et période.
- **Les frais sont-ils automatiques ?** Oui, ils découlent du montant et de l’opérateur choisis.`,
    },
    en: {
      titre: 'Transactions (cash-in & cash-out)',
      resume: 'Record and track cash-in and cash-out operations.',
      contenu: `## What it is for
The Transactions module is the operational heart of GESTMONEY. It records Mobile Money operations: **cash-in** (the customer tops up their account) and **cash-out** (the customer withdraws cash). Each operation updates the agent’s **float**, calculates the related **fees and commissions** and feeds accounting and reporting.

It is used daily by **agents** and supervised by the **manager**. It is the most-used module: the reliability of the whole system depends on careful entry here.

## Before you begin
- The **agent** must be active and attached to an active agency.
- The agent must have enough **float** (electronic for a cash-in, cash for a cash-out).
- The Mobile Money **operator** (Orange Money, MTN MoMo, Wave, Moov…) must be available; otherwise add it via operator management.
- The **customer** can be registered beforehand (Customers & KYC module) or identified by their number.

## Step by step

### Record a cash-in
1. Open the **Transactions** module.
2. Choose the **Cash-in** operation.
3. Select the **agent** performing the operation.
4. Select the **customer** (or enter their **number**).
5. Choose the **operator** (Mobile Money channel).
6. Enter the **amount** in XOF.
7. Click **Confirm**: float and commission update automatically.

### Record a cash-out
1. Choose the **Cash-out** operation.
2. Enter the **agent**, the **customer** and the **operator**.
3. Enter the requested **amount**.
4. Check that the agent has **enough cash** on hand.
5. Confirm, then hand the cash to the customer.

### View and search a transaction
1. Browse the **transaction list**, most recent first.
2. Filter by **agent**, **operator**, **type** (cash-in / cash-out) or **period**.
3. Click a row to see the **detail** (amount, fees, commission, timestamp).

## Best practices
- **Double-check the amount and number** before confirming: a confirmed transaction commits the float.
- Enter operations **as they happen**, never from memory at day’s end.
- Regularly reconcile transactions against the **actual cash balance**.
> The direction of the impact on the float depends on the operation type and channel: always check the balance after a large operation.

## Common problems
- **“Insufficient float”** → the agent no longer has the needed liquidity → replenish via the Float module before retrying.
- **The operator is missing from the list** → channel not configured → add it in operator management.
- **The commission looks wrong** → wrong amount or operator → check the entry; the commission derives from amount and channel.
- **Can’t select the agent** → agent suspended or unassigned → reactivate / assign them.
- **Duplicate transaction** → double confirmation → check history before re-entering.

## Frequently asked questions
- **Can I cancel a confirmed transaction?** A confirmed operation commits the float; handle any correction carefully and trace it (see Accounting).
- **Must the customer exist beforehand?** Not necessarily, but a customer record helps tracking and KYC compliance.
- **Where do I see generated commissions?** In the Commissions module, filtered by agent and period.
- **Are fees automatic?** Yes, they derive from the chosen amount and operator.`,
    },
  },

  // ── Float / liquidité ───────────────────────────────────────────────────
  {
    id: 'float',
    icone: '💧',
    fr: {
      titre: 'Float & liquidité',
      resume: 'Suivre, alerter et réapprovisionner la liquidité des agents.',
      contenu: `## À quoi ça sert
Le float est la **liquidité disponible pour opérer** : le solde électronique (unités Mobile Money) et/ou les espèces qu’un agent peut mobiliser. Ce module suit le solde de chaque agent et de chaque agence, et vous alerte quand la liquidité devient insuffisante. Sans float, un agent est à l’arrêt : ce module est donc central pour la continuité du service.

Il est piloté par le **gérant** ou le **superviseur**, qui décide des réapprovisionnements.

## Avant de commencer
- Les **agents** doivent exister et être rattachés à une agence.
- Définissez à l’avance un **seuil d’alerte** par agent, cohérent avec son volume d’activité.
- Un réapprovisionnement suppose que vous disposez réellement de la liquidité à transférer.

## Pas à pas

### Consulter les soldes de float
1. Ouvrez le module **Float & liquidité**.
2. Lisez le **solde** par agent et par agence.
3. Triez ou filtrez pour repérer les soldes les plus bas.

### Repérer un agent à sec
1. Repérez les agents **à zéro** ou **sous le seuil d’alerte** (signalés visuellement).
2. Ouvrez l’agent concerné pour voir le détail de son float.

### Enregistrer un réapprovisionnement
1. Lancez un **réapprovisionnement** (bouton dédié).
2. Sélectionnez l’**agent** à recréditer.
3. Saisissez le **montant** en XOF.
4. Validez : le solde de float de l’agent augmente immédiatement et l’alerte disparaît.

### Suivre l’historique des mouvements
1. Ouvrez l’**historique** de float.
2. Filtrez par **agent** ou par **période**.
3. Vérifiez la cohérence entre réapprovisionnements et consommation par les transactions.

## Bonnes pratiques
- Définissez un **seuil d’alerte réaliste** par agent, ajusté à son activité.
- **Anticipez** les réapprovisionnements avant les pics (jours de marché, fin de mois, paie).
- Rapprochez le float théorique du **stock réel** (espèces + unités) régulièrement.
> Un agent sans float ne peut plus servir les clients : surveillez les seuils au quotidien.

## Problèmes fréquents
- **Le solde ne baisse pas après des ventes** → transactions non enregistrées → vérifiez la saisie dans Transactions.
- **Alerte persistante après réapprovisionnement** → montant insuffisant ou non validé → recréditez au-dessus du seuil et confirmez.
- **Écart entre float et espèces réelles** → opération non tracée → rapprochez avec la Comptabilité et documentez l’écart.
- **Impossible de réapprovisionner un agent** → agent suspendu → réactivez-le d’abord.

## Questions fréquentes
- **Float électronique et espèces sont-ils suivis ensemble ?** Le module suit la liquidité disponible pour opérer ; distinguez selon le sens de vos opérations.
- **Que se passe-t-il si le float tombe à zéro ?** L’agent ne peut plus enregistrer d’opération jusqu’au réapprovisionnement.
- **Puis-je fixer un seuil différent par agent ?** Oui, adaptez-le au volume de chacun.
- **Le réapprovisionnement crée-t-il une écriture comptable ?** Il constitue un mouvement de liquidité à rapprocher côté Comptabilité.`,
    },
    en: {
      titre: 'Float & liquidity',
      resume: 'Track, alert on and replenish agents’ liquidity.',
      contenu: `## What it is for
Float is the **liquidity available to operate**: the electronic balance (Mobile Money units) and/or the cash an agent can mobilise. This module tracks each agent’s and agency’s balance and alerts you when liquidity runs low. With no float, an agent is stuck: this module is therefore central to service continuity.

It is driven by the **manager** or **supervisor**, who decides on replenishments.

## Before you begin
- **Agents** must exist and be attached to an agency.
- Set an **alert threshold** per agent in advance, consistent with their activity volume.
- A replenishment assumes you actually hold the liquidity to transfer.

## Step by step

### Check float balances
1. Open the **Float & liquidity** module.
2. Read the **balance** per agent and per agency.
3. Sort or filter to surface the lowest balances.

### Spot an out-of-float agent
1. Identify agents at **zero** or **below the alert threshold** (visually flagged).
2. Open the agent concerned to see their float detail.

### Record a replenishment
1. Start a **replenishment** (dedicated button).
2. Select the **agent** to credit.
3. Enter the **amount** in XOF.
4. Confirm: the agent’s float balance rises immediately and the alert clears.

### Review the movement history
1. Open the float **history**.
2. Filter by **agent** or **period**.
3. Check consistency between replenishments and consumption via transactions.

## Best practices
- Set a **realistic alert threshold** per agent, tuned to their activity.
- **Anticipate** replenishments ahead of peaks (market days, month-end, payday).
- Reconcile theoretical float against **real stock** (cash + units) regularly.
> An agent with no float can no longer serve customers: monitor thresholds daily.

## Common problems
- **Balance doesn’t drop after sales** → transactions not recorded → check entry in Transactions.
- **Alert persists after replenishment** → amount too low or not confirmed → credit above the threshold and confirm.
- **Gap between float and real cash** → an untraced operation → reconcile with Accounting and document the gap.
- **Can’t replenish an agent** → agent suspended → reactivate them first.

## Frequently asked questions
- **Are electronic float and cash tracked together?** The module tracks the liquidity available to operate; distinguish by the direction of your operations.
- **What happens if float hits zero?** The agent can no longer record operations until replenished.
- **Can I set a different threshold per agent?** Yes, tune it to each one’s volume.
- **Does a replenishment create an accounting entry?** It is a liquidity movement to reconcile on the Accounting side.`,
    },
  },

  // ── Commissions ─────────────────────────────────────────────────────────
  {
    id: 'commissions',
    icone: '🎯',
    fr: {
      titre: 'Commissions',
      resume: 'Suivre, filtrer et analyser les commissions générées par les opérations.',
      contenu: `## À quoi ça sert
Le module Commissions récapitule les **gains générés par les transactions**, ventilés par agent, par agence et par période. Il vous aide à mesurer la rentabilité de votre réseau, à comparer la performance des agents et à préparer les reversements. Les commissions ne se saisissent pas : elles sont **calculées automatiquement** à partir des transactions (montant + opérateur).

Il est consulté par le **gérant** et les **superviseurs** pour piloter la rentabilité.

## Avant de commencer
- Les **transactions** doivent être enregistrées : sans elles, aucune commission n’apparaît.
- La cohérence des commissions dépend directement de la rigueur de saisie des transactions.
- Pour un export formaté, prévoyez d’utiliser le module Reporting.

## Pas à pas

### Consulter les commissions
1. Ouvrez le module **Commissions**.
2. Lisez le **total** des commissions pour la période affichée.
3. Repérez la ventilation **par agent** et **par agence**.

### Filtrer par période et par agent
1. Sélectionnez une **période** (jour, semaine, mois).
2. Filtrez par **agent** ou par **agence** pour cibler l’analyse.
3. La liste et les totaux se recalculent selon les filtres.

### Rapprocher commissions et transactions
1. Notez le **volume de transactions** correspondant à un agent.
2. Comparez-le à la **commission** affichée pour vérifier la cohérence.
3. En cas d’écart, ouvrez le module Transactions pour contrôler la saisie.

## Bonnes pratiques
- Vérifiez régulièrement la **cohérence** entre volume, frais et commissions.
- Utilisez le **Reporting** pour exporter un récapitulatif partageable.
- Analysez les commissions **par période** pour repérer les tendances et récompenser les agents performants.
> Les commissions découlent des transactions enregistrées : une saisie rigoureuse garantit un calcul juste.

## Problèmes fréquents
- **Aucune commission affichée** → aucune transaction sur la période / filtre trop restrictif → élargissez la période et réinitialisez les filtres.
- **Commission plus faible qu’attendu** → montants ou opérateurs saisis à tort → contrôlez les transactions concernées.
- **Écart avec le tableau de bord** → périodes différentes → alignez les mêmes dates.
- **Total qui ne correspond pas au reversement** → confusion période / agent → vérifiez le périmètre exact du filtre.

## Questions fréquentes
- **Puis-je modifier une commission manuellement ?** Non, elle découle de la transaction ; corrigez la transaction source si nécessaire.
- **Les commissions incluent-elles les frais client ?** Non, ce sont deux notions distinctes ; les commissions sont le gain de votre réseau.
- **Comment préparer un reversement à un agent ?** Filtrez par agent et période, puis exportez via Reporting.
- **Une transaction annulée retire-t-elle sa commission ?** La commission suit la transaction ; toute correction doit être tracée.`,
    },
    en: {
      titre: 'Commissions',
      resume: 'Track, filter and analyse the commissions generated by operations.',
      contenu: `## What it is for
The Commissions module summarises the **earnings generated by transactions**, broken down by agent, agency and period. It helps you measure your network’s profitability, compare agent performance and prepare payouts. Commissions are not entered: they are **calculated automatically** from transactions (amount + operator).

It is consulted by the **manager** and **supervisors** to steer profitability.

## Before you begin
- **Transactions** must be recorded: without them, no commission appears.
- Commission accuracy depends directly on careful transaction entry.
- For a formatted export, plan to use the Reporting module.

## Step by step

### Review commissions
1. Open the **Commissions** module.
2. Read the **total** commissions for the displayed period.
3. Note the breakdown **by agent** and **by agency**.

### Filter by period and agent
1. Select a **period** (day, week, month).
2. Filter by **agent** or **agency** to focus the analysis.
3. The list and totals recompute according to the filters.

### Reconcile commissions and transactions
1. Note the **transaction volume** for an agent.
2. Compare it with the displayed **commission** to check consistency.
3. If there is a gap, open the Transactions module to check the entry.

## Best practices
- Regularly check **consistency** between volume, fees and commissions.
- Use **Reporting** to export a shareable summary.
- Analyse commissions **by period** to spot trends and reward high-performing agents.
> Commissions derive from recorded transactions: rigorous entry ensures accurate calculation.

## Common problems
- **No commission shown** → no transactions in the period / filter too restrictive → widen the period and reset filters.
- **Commission lower than expected** → wrong amounts or operators entered → check the transactions concerned.
- **Gap with the dashboard** → different periods → align the same dates.
- **Total doesn’t match the payout** → period / agent confusion → check the exact filter scope.

## Frequently asked questions
- **Can I edit a commission manually?** No, it derives from the transaction; correct the source transaction if needed.
- **Do commissions include customer fees?** No, they are distinct; commissions are your network’s earnings.
- **How do I prepare an agent payout?** Filter by agent and period, then export via Reporting.
- **Does a cancelled transaction remove its commission?** The commission follows the transaction; any correction must be traced.`,
    },
  },

  // ── Clients & KYC ───────────────────────────────────────────────────────
  {
    id: 'clients-kyc',
    icone: '🪪',
    fr: {
      titre: 'Clients & KYC',
      resume: 'Créer, mettre à jour et retrouver les clients et leurs informations KYC.',
      contenu: `## À quoi ça sert
Le module Clients centralise les personnes servies par votre réseau et leurs **informations d’identification (KYC — « Know Your Customer »)**. Il facilite le suivi commercial, la recherche rapide lors d’une opération et surtout la **conformité réglementaire** : connaître son client est une obligation dans les services financiers.

Il est utilisé par les **agents** (création à l’accueil) et par le **gérant** (suivi et conformité).

## Avant de commencer
- Munissez-vous d’une **pièce d’identité** valide du client pour le KYC.
- Ne collectez que les données **réellement nécessaires** à l’opération et à la conformité.
- Vérifiez si le client n’existe pas déjà (recherche) pour éviter les doublons.

## Pas à pas

### Créer une fiche client
1. Ouvrez le module **Clients & KYC**.
2. Cliquez sur **Nouveau client**.
3. Saisissez l’**identité** (nom, prénom) et le **contact** (téléphone).
4. Renseignez les **informations KYC** requises (type et numéro de pièce d’identité, etc.).
5. Enregistrez : la fiche est créée et devient sélectionnable dans les transactions.

### Mettre à jour une fiche
1. Recherchez le client et ouvrez sa **fiche**.
2. Corrigez les informations qui ont changé (contact, pièce).
3. Enregistrez.

### Retrouver un client avant une opération
1. Utilisez la **barre de recherche** (nom ou numéro).
2. Ouvrez la fiche pour vérifier l’identité.
3. Sélectionnez ce client lors de la saisie de la transaction.

## Bonnes pratiques
- **Vérifiez l’identité** avant d’enregistrer une opération sensible.
- Gardez les données **exactes et à jour** pour la conformité.
- Évitez les **doublons** : cherchez avant de créer.
> Renseignez uniquement les données nécessaires et traitez-les avec confidentialité.

## Problèmes fréquents
- **Client introuvable** → orthographe ou numéro différent → cherchez par numéro plutôt que par nom.
- **Doublon de fiche** → création sans recherche préalable → conservez la fiche la plus complète et mettez à jour.
- **KYC incomplet signalé** → pièce d’identité manquante → complétez avant l’opération sensible.
- **Impossible de sélectionner le client dans une transaction** → fiche non enregistrée → rouvrez et enregistrez.

## Questions fréquentes
- **Le KYC est-il obligatoire pour toute opération ?** Il est requis pour les opérations sensibles et la conformité ; renseignez-le dès que possible.
- **Puis-je servir un client sans fiche ?** Une opération peut identifier un numéro, mais une fiche facilite suivi et conformité.
- **Qui peut voir les données KYC ?** Elles sont confidentielles ; l’accès dépend du rôle.
- **Comment corriger une erreur d’identité ?** Ouvrez la fiche, modifiez et enregistrez.`,
    },
    en: {
      titre: 'Customers & KYC',
      resume: 'Create, update and find customers and their KYC information.',
      contenu: `## What it is for
The Customers module centralises the people served by your network and their **identification data (KYC — “Know Your Customer”)**. It supports commercial tracking, fast lookup during an operation and, above all, **regulatory compliance**: knowing your customer is an obligation in financial services.

It is used by **agents** (creation at the counter) and by the **manager** (tracking and compliance).

## Before you begin
- Have the customer’s valid **ID document** ready for KYC.
- Only collect the data **actually needed** for the operation and compliance.
- Check whether the customer already exists (search) to avoid duplicates.

## Step by step

### Create a customer record
1. Open the **Customers & KYC** module.
2. Click **New customer**.
3. Enter the **identity** (first and last name) and **contact** (phone).
4. Fill in the required **KYC information** (ID type and number, etc.).
5. Save: the record is created and becomes selectable in transactions.

### Update a record
1. Search for the customer and open their **record**.
2. Correct the information that changed (contact, ID).
3. Save.

### Find a customer before an operation
1. Use the **search bar** (name or number).
2. Open the record to verify identity.
3. Select this customer when entering the transaction.

## Best practices
- **Verify identity** before recording a sensitive operation.
- Keep data **accurate and up to date** for compliance.
- Avoid **duplicates**: search before creating.
> Only capture the data you need and handle it confidentially.

## Common problems
- **Customer not found** → different spelling or number → search by number rather than name.
- **Duplicate record** → creation without prior search → keep the most complete record and update it.
- **Incomplete KYC flagged** → missing ID document → complete it before the sensitive operation.
- **Can’t select the customer in a transaction** → record not saved → reopen and save.

## Frequently asked questions
- **Is KYC mandatory for every operation?** It is required for sensitive operations and compliance; fill it in as soon as possible.
- **Can I serve a customer without a record?** An operation can identify a number, but a record helps tracking and compliance.
- **Who can see KYC data?** It is confidential; access depends on role.
- **How do I fix an identity error?** Open the record, edit and save.`,
    },
  },

  // ── Comptabilité ────────────────────────────────────────────────────────
  {
    id: 'comptabilite',
    icone: '📒',
    fr: {
      titre: 'Comptabilité',
      resume: 'Suivre les écritures, la caisse et clôturer la journée (référentiel SYSCOHADA).',
      contenu: `## À quoi ça sert
Le module Comptabilité assure le **suivi financier** de votre activité : mouvements de caisse, écritures, soldes et clôtures, dans une logique conforme au référentiel **SYSCOHADA / OHADA** utilisé dans la zone. Il transforme les opérations du terrain en une image financière fiable et exploitable.

Il est utilisé par le **gérant** et, le cas échéant, le **comptable** de la structure.

## Avant de commencer
- Les **transactions** et **mouvements de float** du jour doivent être saisis pour refléter la réalité.
- Préparez le **comptage réel de la caisse** (espèces) avant tout rapprochement.
- Une clôture est un acte engageant : réservez-la à la fin de journée, une fois toutes les opérations passées.

## Pas à pas

### Consulter les écritures et les soldes
1. Ouvrez le module **Comptabilité**.
2. Sélectionnez la **période** souhaitée.
3. Parcourez les **écritures** et lisez les **soldes** correspondants.

### Rapprocher la caisse
1. Comptez physiquement les **espèces** en caisse.
2. Comparez ce montant aux **mouvements enregistrés** (transactions, réapprovisionnements).
3. Identifiez tout **écart** entre le théorique et le réel.

### Corriger et documenter un écart
1. Recherchez la cause (opération oubliée, erreur de montant).
2. Enregistrez la correction ou l’écriture d’ajustement nécessaire.
3. **Documentez** l’explication pour la traçabilité.

### Clôturer la journée
1. Assurez-vous que toutes les opérations du jour sont saisies.
2. Vérifiez que la caisse est rapprochée sans écart inexpliqué.
3. Lancez la **clôture de journée** pour **figer les totaux**.

## Bonnes pratiques
- **Rapprochez la caisse chaque jour** avant la clôture.
- Corrigez **immédiatement** tout écart identifié et documentez-le.
- Ne reportez pas les clôtures : un retard rend les écarts difficiles à retracer.
> Une clôture régulière évite l’accumulation d’écarts difficiles à retracer.

## Problèmes fréquents
- **Écart de caisse récurrent** → opérations non saisies au fil de l’eau → imposez la saisie en temps réel.
- **Solde qui ne correspond pas au float** → réapprovisionnement non tracé → rapprochez avec le module Float.
- **Impossible de clôturer** → opérations du jour incomplètes → terminez la saisie avant la clôture.
- **Écriture erronée figée** → clôture trop hâtive → passez une écriture d’ajustement documentée.

## Questions fréquentes
- **La comptabilité est-elle conforme OHADA ?** Elle s’appuie sur le référentiel SYSCOHADA/OHADA de la zone.
- **Peut-on rouvrir une journée clôturée ?** La clôture fige les totaux ; toute correction ultérieure se fait par écriture d’ajustement tracée.
- **Faut-il un comptable pour utiliser le module ?** Non pour le suivi courant, mais son expertise est utile pour les clôtures et le contrôle.
- **La comptabilité remplace-t-elle le reporting ?** Non : le reporting analyse l’activité, la comptabilité tient les comptes.`,
    },
    en: {
      titre: 'Accounting',
      resume: 'Track entries, cash and close the day (SYSCOHADA framework).',
      contenu: `## What it is for
The Accounting module handles the **financial tracking** of your activity: cash movements, entries, balances and closings, in line with the **SYSCOHADA / OHADA** framework used in the region. It turns field operations into a reliable, usable financial picture.

It is used by the **manager** and, where applicable, the organisation’s **accountant**.

## Before you begin
- The day’s **transactions** and **float movements** must be entered to reflect reality.
- Prepare the **actual cash count** before any reconciliation.
- A closing is a committing act: reserve it for day’s end, once all operations are recorded.

## Step by step

### Review entries and balances
1. Open the **Accounting** module.
2. Select the desired **period**.
3. Browse the **entries** and read the corresponding **balances**.

### Reconcile the cash
1. Physically count the **cash** on hand.
2. Compare that amount with the **recorded movements** (transactions, replenishments).
3. Identify any **discrepancy** between theoretical and actual.

### Fix and document a discrepancy
1. Investigate the cause (forgotten operation, amount error).
2. Record the correction or the necessary adjustment entry.
3. **Document** the explanation for traceability.

### Close the day
1. Make sure all of the day’s operations are entered.
2. Check that the cash is reconciled with no unexplained discrepancy.
3. Run the **day-end closing** to **lock in the totals**.

## Best practices
- **Reconcile the cash every day** before closing.
- Fix any identified discrepancy **immediately** and document it.
- Do not defer closings: a delay makes discrepancies hard to trace.
> Regular closings prevent the build-up of hard-to-trace discrepancies.

## Common problems
- **Recurring cash discrepancy** → operations not entered as they happen → enforce real-time entry.
- **Balance doesn’t match float** → untraced replenishment → reconcile with the Float module.
- **Can’t close** → the day’s operations are incomplete → finish entry before closing.
- **Wrong entry locked in** → closed too hastily → post a documented adjustment entry.

## Frequently asked questions
- **Is the accounting OHADA-compliant?** It is based on the region’s SYSCOHADA/OHADA framework.
- **Can a closed day be reopened?** Closing locks the totals; later corrections are made via a traced adjustment entry.
- **Do I need an accountant to use the module?** Not for day-to-day tracking, but their expertise helps with closings and controls.
- **Does accounting replace reporting?** No: reporting analyses activity, accounting keeps the books.`,
    },
  },

  // ── Stock ───────────────────────────────────────────────────────────────
  {
    id: 'stock',
    icone: '📦',
    fr: {
      titre: 'Stock',
      resume: 'Gérer les articles, les entrées/sorties et les seuils d’alerte.',
      contenu: `## À quoi ça sert
Le module Stock gère les **articles associés à votre activité** : consommables, cartes SIM, recharges physiques ou produits vendus au point de vente. Il suit les quantités, enregistre les entrées et sorties et vous alerte avant la rupture. C’est un module complémentaire aux opérations Mobile Money, utile pour les points de vente qui vendent aussi des biens physiques.

Il est utilisé par le **gérant** ou le responsable d’agence.

## Avant de commencer
- Listez les **articles** à suivre et leur quantité initiale.
- Définissez un **seuil d’alerte** pertinent par article, selon sa rotation.
- Prévoyez qui enregistre les entrées (achats) et les sorties (ventes).

## Pas à pas

### Créer ou mettre à jour un article
1. Ouvrez le module **Stock**.
2. Cliquez sur **Nouvel article** (ou ouvrez un article existant).
3. Renseignez le **nom** et la **quantité** initiale.
4. Définissez le **seuil d’alerte**.
5. Enregistrez.

### Enregistrer une entrée de stock
1. Ouvrez l’article concerné.
2. Enregistrez une **entrée** (réapprovisionnement) en indiquant la **quantité** reçue.
3. Validez : la quantité disponible augmente.

### Enregistrer une sortie de stock
1. Ouvrez l’article concerné.
2. Enregistrez une **sortie** (vente / consommation) avec la **quantité**.
3. Validez : la quantité disponible diminue.

### Surveiller les alertes
1. Repérez les articles **sous le seuil d’alerte** (signalés dans la liste).
2. Planifiez un réapprovisionnement avant la rupture.

## Bonnes pratiques
- Faites un **inventaire régulier** pour garder des quantités fiables.
- **Réapprovisionnez avant la rupture** pour ne pas interrompre le service.
- Enregistrez entrées et sorties **au moment où elles ont lieu**.
> Un stock à jour évite les ruptures et les écarts d’inventaire.

## Problèmes fréquents
- **Quantité affichée fausse** → entrées/sorties non enregistrées → faites un inventaire et corrigez.
- **Alerte qui ne se déclenche pas** → seuil trop bas → relevez le seuil d’alerte.
- **Rupture non anticipée** → suivi irrégulier → enregistrez chaque mouvement en temps réel.
- **Article introuvable** → nommage incohérent → standardisez les noms d’articles.

## Questions fréquentes
- **Le stock est-il lié aux transactions Mobile Money ?** Non, c’est un suivi distinct des biens physiques.
- **Puis-je suivre plusieurs articles par agence ?** Oui, gérez autant d’articles que nécessaire.
- **Comment corriger un écart d’inventaire ?** Ajustez la quantité de l’article après comptage physique.
- **Le seuil d’alerte est-il par article ?** Oui, définissez-le selon la rotation de chacun.`,
    },
    en: {
      titre: 'Stock',
      resume: 'Manage items, inflows/outflows and alert thresholds.',
      contenu: `## What it is for
The Stock module manages the **items related to your activity**: consumables, SIM cards, physical top-ups or products sold at the point of sale. It tracks quantities, records inflows and outflows and alerts you before running out. It complements Mobile Money operations, useful for outlets that also sell physical goods.

It is used by the **manager** or the branch supervisor.

## Before you begin
- List the **items** to track and their initial quantity.
- Set a relevant **alert threshold** per item, based on its turnover.
- Decide who records inflows (purchases) and outflows (sales).

## Step by step

### Create or update an item
1. Open the **Stock** module.
2. Click **New item** (or open an existing item).
3. Enter the **name** and the initial **quantity**.
4. Set the **alert threshold**.
5. Save.

### Record a stock inflow
1. Open the item concerned.
2. Record an **inflow** (replenishment) with the **quantity** received.
3. Confirm: the available quantity increases.

### Record a stock outflow
1. Open the item concerned.
2. Record an **outflow** (sale / consumption) with the **quantity**.
3. Confirm: the available quantity decreases.

### Watch the alerts
1. Spot items **below the alert threshold** (flagged in the list).
2. Plan a replenishment before running out.

## Best practices
- Run a **regular inventory** to keep quantities reliable.
- **Replenish before running out** to avoid service interruptions.
- Record inflows and outflows **as they happen**.
> Up-to-date stock prevents shortages and inventory discrepancies.

## Common problems
- **Displayed quantity is wrong** → inflows/outflows not recorded → run an inventory and correct.
- **Alert doesn’t trigger** → threshold too low → raise the alert threshold.
- **Unanticipated shortage** → irregular tracking → record every movement in real time.
- **Item not found** → inconsistent naming → standardise item names.

## Frequently asked questions
- **Is stock linked to Mobile Money transactions?** No, it is separate tracking of physical goods.
- **Can I track several items per agency?** Yes, manage as many items as needed.
- **How do I fix an inventory gap?** Adjust the item quantity after a physical count.
- **Is the alert threshold per item?** Yes, set it according to each one’s turnover.`,
    },
  },

  // ── RH ──────────────────────────────────────────────────────────────────
  {
    id: 'rh',
    icone: '🧑‍💼',
    fr: {
      titre: 'Ressources humaines',
      resume: 'Gérer le personnel, les postes et le suivi administratif.',
      contenu: `## À quoi ça sert
Le module RH centralise les **informations du personnel** : identité, poste, rattachement (agence, équipe) et suivi administratif. Là où le module Agents traite l’aspect opérationnel (qui réalise les transactions), le module RH gère la dimension **employeur** : le suivi des personnes en tant que salariés de la structure.

Il est utilisé par le **gérant** ou un responsable RH désigné.

## Avant de commencer
- Rassemblez les informations d’identité et de poste de chaque employé.
- Définissez les **rattachements** (quelle agence, quelle équipe).
- L’accès aux données RH doit être **réservé aux personnes autorisées** : ce sont des données sensibles.

## Pas à pas

### Créer une fiche employé
1. Ouvrez le module **Ressources humaines**.
2. Cliquez sur **Nouvel employé**.
3. Renseignez l’**identité** (nom, prénom, contact) et le **poste**.
4. Enregistrez : la fiche apparaît dans la liste du personnel.

### Renseigner le rattachement
1. Ouvrez la fiche de l’employé.
2. Indiquez son **rattachement** (agence, équipe).
3. Enregistrez.

### Mettre à jour le statut et les informations administratives
1. Ouvrez la fiche concernée.
2. Mettez à jour le **statut** (présent, en congé, sorti) et les informations administratives.
3. Enregistrez pour tracer le changement.

### Rechercher un employé
1. Utilisez la **recherche** par nom.
2. Filtrez éventuellement par agence ou statut.

## Bonnes pratiques
- Gardez les fiches **à jour lors des arrivées et des départs**.
- **Limitez l’accès** aux données RH aux personnes autorisées.
- Distinguez bien le suivi RH (employeur) du suivi Agents (opérationnel).
> Les données RH sont sensibles : traitez-les avec confidentialité.

## Problèmes fréquents
- **Fiche employé sans agent correspondant** → l’employé opère mais n’est pas créé côté Agents → créez-le aussi dans le module Agents pour qu’il puisse enregistrer des transactions.
- **Données visibles par trop de personnes** → droits trop larges → restreignez l’accès RH.
- **Employé sorti toujours actif** → statut non mis à jour → passez son statut à « sorti ».
- **Liste vide** → filtre trop restrictif → réinitialisez la recherche.

## Questions fréquentes
- **RH et Agents, est-ce la même chose ?** Non : RH gère le salarié, Agents gère l’opérateur qui saisit les transactions. Une même personne peut figurer dans les deux.
- **Qui peut consulter les fiches RH ?** Seules les personnes autorisées selon leur rôle.
- **Peut-on suivre les congés ?** Vous pouvez tenir le statut administratif à jour.
- **Faut-il supprimer un employé sorti ?** Préférez mettre à jour son statut pour conserver l’historique.`,
    },
    en: {
      titre: 'Human resources',
      resume: 'Manage staff, roles and administrative tracking.',
      contenu: `## What it is for
The HR module centralises **staff information**: identity, role, assignment (agency, team) and administrative tracking. Where the Agents module handles the operational side (who performs transactions), the HR module handles the **employer** dimension: tracking people as employees of the organisation.

It is used by the **manager** or a designated HR lead.

## Before you begin
- Gather each employee’s identity and role information.
- Define the **assignments** (which agency, which team).
- Access to HR data must be **restricted to authorised people**: it is sensitive data.

## Step by step

### Create an employee record
1. Open the **Human resources** module.
2. Click **New employee**.
3. Enter the **identity** (name, contact) and the **role**.
4. Save: the record appears in the staff list.

### Set the assignment
1. Open the employee’s record.
2. Specify their **assignment** (agency, team).
3. Save.

### Update status and administrative details
1. Open the record concerned.
2. Update the **status** (present, on leave, left) and administrative details.
3. Save to trace the change.

### Find an employee
1. Use **search** by name.
2. Optionally filter by agency or status.

## Best practices
- Keep records **current for arrivals and departures**.
- **Restrict access** to HR data to authorised people.
- Clearly distinguish HR tracking (employer) from Agents tracking (operational).
> HR data is sensitive: handle it confidentially.

## Common problems
- **Employee record with no matching agent** → the employee operates but isn’t created in Agents → also create them in the Agents module so they can record transactions.
- **Data visible to too many people** → overly broad rights → restrict HR access.
- **Departed employee still active** → status not updated → set their status to “left”.
- **Empty list** → filter too restrictive → reset the search.

## Frequently asked questions
- **Are HR and Agents the same?** No: HR manages the employee, Agents manages the operator who records transactions. The same person can appear in both.
- **Who can view HR records?** Only people authorised by their role.
- **Can I track leave?** You can keep the administrative status up to date.
- **Should I delete a departed employee?** Prefer updating their status to keep history.`,
    },
  },

  // ── Reporting ───────────────────────────────────────────────────────────
  {
    id: 'reporting',
    icone: '📈',
    fr: {
      titre: 'Reporting',
      resume: 'Générer, analyser et exporter des rapports d’activité.',
      contenu: `## À quoi ça sert
Le module Reporting produit des **rapports d’activité** (journaliers, hebdomadaires, mensuels) et permet de les exporter pour l’analyse, le partage ou l’archivage. Là où le tableau de bord donne une vue instantanée, le reporting permet une lecture approfondie sur la période de votre choix, et surtout un **export** exploitable hors de l’application.

Il est utilisé par le **gérant** et les **superviseurs** pour rendre compte de l’activité et prendre des décisions.

## Avant de commencer
- Les données doivent être **saisies proprement** dans les autres modules : un rapport ne vaut que par la qualité de la saisie.
- Décidez de la **période** et du **type de rapport** dont vous avez besoin.
- Prévoyez où **archiver** vos exports de façon organisée.

## Pas à pas

### Générer un rapport
1. Ouvrez le module **Reporting**.
2. Choisissez la **période** (jour, semaine, mois).
3. Sélectionnez le **type de rapport** souhaité.
4. Lancez la **génération** : les indicateurs et détails s’affichent.

### Analyser les résultats
1. Lisez les **indicateurs** (transactions, revenus, commissions).
2. Comparez avec une période précédente pour dégager une tendance.
3. Repérez les agents ou agences les plus / moins performants.

### Exporter un rapport
1. Cliquez sur **Exporter**.
2. Choisissez le **format** adapté (PDF pour le partage, tableur / CSV pour l’analyse).
3. Enregistrez le fichier et **archivez-le** de façon organisée.

## Bonnes pratiques
- **Standardisez vos périodes** de reporting (ex. mensuel) pour comparer d’une fois sur l’autre.
- **Archivez** les exports importants dans une arborescence claire (année / mois).
- Croisez le rapport avec la **Comptabilité** pour valider les chiffres financiers.
> Les rapports reprennent les données enregistrées : une saisie propre donne des rapports fiables.

## Problèmes fréquents
- **Rapport vide ou incomplet** → période sans activité ou saisie manquante → vérifiez la période et la saisie source.
- **Chiffres différents du tableau de bord** → périodes non alignées → utilisez exactement les mêmes dates.
- **Export illisible dans un tableur** → mauvais format choisi → préférez CSV pour l’analyse, PDF pour le partage.
- **Impossible de générer** → période mal définie → resélectionnez des dates valides.

## Questions fréquentes
- **Quels formats d’export sont disponibles ?** Selon le rapport : PDF, tableur ou CSV.
- **Puis-je comparer deux périodes ?** Générez chaque période puis comparez, ou standardisez vos périodes.
- **Le reporting inclut-il les commissions ?** Oui, parmi les indicateurs d’activité.
- **À quelle fréquence faire un rapport ?** Au minimum mensuel ; ajoutez du hebdomadaire en période de forte activité.`,
    },
    en: {
      titre: 'Reporting',
      resume: 'Generate, analyse and export activity reports.',
      contenu: `## What it is for
The Reporting module produces **activity reports** (daily, weekly, monthly) and lets you export them for analysis, sharing or archiving. Where the dashboard gives a snapshot, reporting enables an in-depth read over the period of your choice and, above all, a usable **export** outside the application.

It is used by the **manager** and **supervisors** to report on activity and make decisions.

## Before you begin
- Data must be **entered cleanly** in the other modules: a report is only as good as the entry behind it.
- Decide on the **period** and **report type** you need.
- Plan where to **archive** your exports in an organised way.

## Step by step

### Generate a report
1. Open the **Reporting** module.
2. Choose the **period** (day, week, month).
3. Select the desired **report type**.
4. Run the **generation**: metrics and details appear.

### Analyse the results
1. Read the **metrics** (transactions, revenue, commissions).
2. Compare with a previous period to reveal a trend.
3. Spot the best / worst performing agents or agencies.

### Export a report
1. Click **Export**.
2. Choose the right **format** (PDF for sharing, spreadsheet / CSV for analysis).
3. Save the file and **archive it** in an organised way.

## Best practices
- **Standardise your reporting periods** (e.g. monthly) to compare over time.
- **Archive** important exports in a clear structure (year / month).
- Cross-check the report with **Accounting** to validate financial figures.
> Reports reflect the recorded data: clean entry yields reliable reports.

## Common problems
- **Empty or incomplete report** → period with no activity or missing entry → check the period and the source entry.
- **Figures differ from the dashboard** → periods not aligned → use exactly the same dates.
- **Export unreadable in a spreadsheet** → wrong format chosen → prefer CSV for analysis, PDF for sharing.
- **Can’t generate** → period poorly defined → reselect valid dates.

## Frequently asked questions
- **Which export formats are available?** Depending on the report: PDF, spreadsheet or CSV.
- **Can I compare two periods?** Generate each period then compare, or standardise your periods.
- **Does reporting include commissions?** Yes, among the activity metrics.
- **How often should I run a report?** Monthly at minimum; add weekly during high-activity periods.`,
    },
  },

  // ── Licence & facturation ───────────────────────────────────────────────
  {
    id: 'licence-facturation',
    icone: '🔑',
    fr: {
      titre: 'Licence & facturation',
      resume: 'Suivre votre abonnement, vos factures, l’échéance et le renouvellement.',
      contenu: `## À quoi ça sert
Ce module concerne votre **abonnement à GESTMONEY** : l’offre souscrite (Starter, Essentiel, Professional ou Enterprise), la période de validité, les factures et le statut de la licence (active / à renouveler / expirée). C’est ici que vous surveillez l’échéance pour éviter toute interruption de service.

Il est réservé au **gérant** ou à l’**administrateur** qui gère l’abonnement de la structure.

## Avant de commencer
- Après l’inscription, vous bénéficiez d’un **essai de 14 jours**.
- À l’échéance, une **période de grâce de 7 jours** maintient l’accès pour vous laisser renouveler.
- Identifiez votre **forfait** actuel et vos besoins (nombre d’agences, d’agents) avant de renouveler ou de changer d’offre.

## Pas à pas

### Consulter votre abonnement
1. Ouvrez le module **Licence & facturation**.
2. Lisez l’**offre en cours** (Starter / Essentiel / Professional / Enterprise).
3. Repérez le **statut** de la licence et la **date d’échéance**.

### Retrouver et télécharger une facture
1. Ouvrez la section **Factures**.
2. Repérez la facture souhaitée par date.
3. **Téléchargez-la** pour votre comptabilité.

### Anticiper le renouvellement
1. Surveillez la **date d’échéance** affichée.
2. Lancez le **renouvellement** avant l’expiration.
3. Vérifiez ensuite que le statut est repassé à **active**.

## Bonnes pratiques
- **Surveillez l’échéance** pour éviter toute interruption de service.
- **Conservez vos factures** pour votre comptabilité.
- Anticipez : ne renouvelez pas au dernier jour de la période de grâce.
> Une licence expirée peut restreindre l’accès : renouvelez avant l’échéance. En cas de doute, contactez IBIG Soft (contact@ibigsoft.com).

## Problèmes fréquents
- **Accès restreint / bloqué** → licence expirée et période de grâce dépassée → renouvelez ; contactez IBIG Soft si le blocage persiste.
- **Facture introuvable** → mauvaise période affichée → élargissez la plage de dates.
- **Le forfait ne correspond plus au besoin** → réseau qui grandit → changez d’offre (ex. Professional / Enterprise).
- **Statut encore « à renouveler » après paiement** → mise à jour non prise en compte → rechargez ; sinon contactez IBIG Soft.

## Questions fréquentes
- **Que se passe-t-il à la fin de l’essai de 14 jours ?** Vous devez souscrire une offre ; une période de grâce de 7 jours suit l’échéance.
- **Perds-je mes données si la licence expire ?** L’accès peut être restreint, mais renouvelez pour rétablir le service ; contactez IBIG Soft en cas de doute.
- **Comment changer de forfait ?** Depuis ce module ou en contactant IBIG Soft (contact@ibigsoft.com).
- **Qui peut gérer la licence ?** Le gérant / administrateur de la structure.`,
    },
    en: {
      titre: 'Licence & billing',
      resume: 'Track your subscription, invoices, expiry and renewal.',
      contenu: `## What it is for
This module covers your **GESTMONEY subscription**: the plan you subscribed to (Starter, Essentiel, Professional or Enterprise), the validity period, invoices and the licence status (active / to renew / expired). This is where you monitor expiry to avoid any service interruption.

It is reserved for the **manager** or **administrator** managing the organisation’s subscription.

## Before you begin
- After sign-up, you get a **14-day trial**.
- At expiry, a **7-day grace period** keeps access open to let you renew.
- Identify your current **plan** and your needs (number of agencies, agents) before renewing or changing plan.

## Step by step

### Check your subscription
1. Open the **Licence & billing** module.
2. Read the **current plan** (Starter / Essentiel / Professional / Enterprise).
3. Note the licence **status** and the **expiry date**.

### Find and download an invoice
1. Open the **Invoices** section.
2. Find the desired invoice by date.
3. **Download it** for your accounting.

### Anticipate renewal
1. Watch the displayed **expiry date**.
2. Start the **renewal** before expiry.
3. Then check that the status is back to **active**.

## Best practices
- **Monitor the expiry date** to avoid any service interruption.
- **Keep your invoices** for your accounting.
- Anticipate: do not renew on the last day of the grace period.
> An expired licence may restrict access: renew before expiry. If in doubt, contact IBIG Soft (contact@ibigsoft.com).

## Common problems
- **Restricted / blocked access** → licence expired and grace period passed → renew; contact IBIG Soft if the block persists.
- **Invoice not found** → wrong period displayed → widen the date range.
- **The plan no longer fits the need** → a growing network → change plan (e.g. Professional / Enterprise).
- **Status still “to renew” after payment** → update not reflected → reload; otherwise contact IBIG Soft.

## Frequently asked questions
- **What happens at the end of the 14-day trial?** You must subscribe to a plan; a 7-day grace period follows expiry.
- **Do I lose my data if the licence expires?** Access may be restricted, but renewing restores service; contact IBIG Soft if in doubt.
- **How do I change plan?** From this module or by contacting IBIG Soft (contact@ibigsoft.com).
- **Who can manage the licence?** The organisation’s manager / administrator.`,
    },
  },

  // ── SARA (assistant IA) ─────────────────────────────────────────────────
  {
    id: 'sara',
    icone: '🤖',
    fr: {
      titre: 'SARA, l’assistant IA',
      resume: 'Poser des questions en langage naturel et obtenir de l’aide dans l’application.',
      contenu: `## À quoi ça sert
SARA est l’**assistant IA** de GESTMONEY. Vous lui posez des questions en langage naturel pour obtenir de l’aide sur l’utilisation de la plateforme (« comment enregistrer un retrait ? ») ou une lecture rapide de votre activité (« quel agent a le plus de commissions ce mois ? »). SARA vous fait gagner du temps en vous orientant vers le bon module ou en résumant une information.

Elle est accessible à tous les utilisateurs, quel que soit leur rôle.

## Avant de commencer
- SARA s’appuie sur les données **réellement enregistrées** : des chiffres justes supposent une saisie propre.
- Ses réponses sont **indicatives et non contractuelles** : elles aident à décider, elles ne décident pas à votre place.
- Formulez une question **claire et précise** pour obtenir une réponse pertinente.

## Pas à pas

### Poser une question
1. Ouvrez l’**assistant SARA** depuis l’interface.
2. Saisissez votre question en **une phrase claire**.
3. Envoyez : SARA affiche sa réponse.

### Affiner une réponse
1. Si la réponse n’est pas exacte, **reformulez** en ajoutant un détail (période, agent, agence).
2. Relancez la question précisée.
3. Répétez jusqu’à obtenir l’orientation utile.

### Vérifier avant d’agir
1. Notez le module vers lequel SARA vous oriente.
2. Ouvrez ce module et **vérifiez** la donnée ou l’action.
3. Ne validez une action critique qu’après ce contrôle.

## Bonnes pratiques
- Soyez **précis** dans votre question (période, agent, type d’opération).
- Utilisez SARA pour **gagner du temps**, pas pour remplacer votre jugement.
- **Vérifiez toujours** une action critique dans le module concerné avant de la valider.
> SARA vous aide et vous oriente ; les réponses sont indicatives et non contractuelles. Les décisions et validations importantes restent de votre responsabilité.

## Problèmes fréquents
- **Réponse imprécise** → question trop vague → ajoutez une période ou un nom précis.
- **Chiffre qui semble faux** → données sous-jacentes incomplètes → vérifiez la saisie dans le module source.
- **SARA ne comprend pas la demande** → formulation ambiguë → reformulez plus simplement.
- **Réponse prise pour une validation** → confusion → SARA n’exécute pas les opérations sensibles : validez-les vous-même.

## Questions fréquentes
- **SARA peut-elle enregistrer une transaction à ma place ?** Non ; elle vous oriente, vous réalisez et validez l’opération.
- **Les réponses sont-elles fiables à 100 % ?** Elles sont indicatives ; vérifiez toujours une décision importante.
- **Dans quelle langue puis-je écrire ?** En français ou en anglais, selon votre interface.
- **SARA voit-elle mes données confidentielles ?** Elle répond dans le cadre de votre périmètre ; traitez les données sensibles avec prudence.`,
    },
    en: {
      titre: 'SARA, the AI assistant',
      resume: 'Ask questions in natural language and get help inside the application.',
      contenu: `## What it is for
SARA is GESTMONEY’s **AI assistant**. You ask questions in natural language to get help using the platform (“how do I record a cash-out?”) or a quick read on your activity (“which agent has the most commissions this month?”). SARA saves you time by pointing you to the right module or summarising information.

It is available to all users, whatever their role.

## Before you begin
- SARA relies on the data **actually recorded**: accurate figures assume clean entry.
- Its answers are **indicative and non-contractual**: they help you decide, they do not decide for you.
- Phrase a **clear, precise** question to get a relevant answer.

## Step by step

### Ask a question
1. Open the **SARA assistant** from the interface.
2. Type your question in **one clear sentence**.
3. Send: SARA shows its answer.

### Refine an answer
1. If the answer isn’t quite right, **rephrase** with an extra detail (period, agent, agency).
2. Resend the refined question.
3. Repeat until you get useful direction.

### Verify before acting
1. Note the module SARA points you to.
2. Open that module and **verify** the data or action.
3. Only confirm a critical action after this check.

## Best practices
- Be **specific** in your question (period, agent, operation type).
- Use SARA to **save time**, not to replace your judgement.
- **Always double-check** a critical action in the relevant module before confirming.
> SARA helps and guides you; answers are indicative and non-contractual. Important decisions and confirmations remain your responsibility.

## Common problems
- **Imprecise answer** → question too vague → add a period or a precise name.
- **A figure looks wrong** → incomplete underlying data → check entry in the source module.
- **SARA doesn’t understand the request** → ambiguous wording → rephrase more simply.
- **Answer mistaken for a confirmation** → confusion → SARA does not execute sensitive operations: confirm them yourself.

## Frequently asked questions
- **Can SARA record a transaction for me?** No; it guides you, you perform and confirm the operation.
- **Are the answers 100% reliable?** They are indicative; always verify an important decision.
- **Which language can I write in?** French or English, matching your interface.
- **Can SARA see my confidential data?** It answers within your perimeter; handle sensitive data carefully.`,
    },
  },

  // ── Paramètres ──────────────────────────────────────────────────────────
  {
    id: 'parametres',
    icone: '⚙️',
    fr: {
      titre: 'Paramètres',
      resume: 'Configurer votre compte, votre profil, la sécurité et les préférences.',
      contenu: `## À quoi ça sert
Les paramètres regroupent la **configuration de votre compte** et de vos préférences : profil, photo, langue, sécurité (dont le mot de passe) et options de l’espace de travail. C’est ici que vous personnalisez votre expérience et que vous protégez votre accès. Certaines options avancées (opérateurs Mobile Money, réglages de la structure) sont réservées aux profils **administrateurs**.

Chaque utilisateur gère son propre profil ; l’**administrateur** dispose en plus des réglages de la structure.

## Avant de commencer
- Sachez quel réglage vous voulez modifier (profil, langue, sécurité).
- Pour un changement de mot de passe, préparez un mot de passe robuste et unique.
- Les réglages qui affectent toute la structure exigent des **droits administrateur**.

## Pas à pas

### Mettre à jour votre profil
1. Ouvrez le module **Paramètres**.
2. Ouvrez la section **Profil**.
3. Modifiez votre **nom** et votre **contact**.
4. Enregistrez.

### Changer votre photo de profil
1. Dans la section **Profil**, choisissez **modifier la photo**.
2. Sélectionnez une image depuis votre appareil.
3. Enregistrez : la photo apparaît dans la barre supérieure.

### Choisir la langue
1. Ouvrez la préférence de **langue**.
2. Choisissez **Français** ou **English**.
3. L’interface bascule et le choix est mémorisé sur l’appareil.

### Gérer la sécurité (mot de passe)
1. Ouvrez la section **Sécurité**.
2. Choisissez **changer le mot de passe**.
3. Saisissez l’ancien puis le nouveau mot de passe.
4. Enregistrez : le nouveau mot de passe s’applique à la prochaine connexion.

## Bonnes pratiques
- Gardez vos **informations de contact à jour**.
- Changez votre mot de passe **régulièrement** et ne le partagez jamais.
- Vérifiez votre profil après toute mise à jour importante.
> Certaines options peuvent être réservées aux profils administrateurs.

## Problèmes fréquents
- **Impossible de changer un réglage de la structure** → droits insuffisants → demandez un administrateur.
- **La nouvelle photo n’apparaît pas** → image non enregistrée ou trop lourde → réessayez avec une image plus légère.
- **Mot de passe refusé** → ancien mot de passe erroné ou nouveau trop faible → vérifiez la saisie et la robustesse.
- **La langue revient à l’ancienne** → réglage propre à l’appareil → refaites le choix sur cet appareil.

## Questions fréquentes
- **Puis-je changer mon mot de passe seul ?** Oui, dans la section Sécurité des paramètres.
- **Mes préférences suivent-elles mon compte ?** La langue est mémorisée par appareil ; le profil suit votre compte.
- **Qui configure les opérateurs Mobile Money ?** Un administrateur, via la gestion des opérateurs.
- **Comment récupérer un accès perdu ?** Contactez votre administrateur pour une réinitialisation.`,
    },
    en: {
      titre: 'Settings',
      resume: 'Configure your account, profile, security and preferences.',
      contenu: `## What it is for
Settings bring together your **account configuration** and preferences: profile, photo, language, security (including the password) and workspace options. This is where you personalise your experience and protect your access. Some advanced options (Mobile Money operators, organisation settings) are reserved for **administrator** profiles.

Each user manages their own profile; the **administrator** additionally has the organisation settings.

## Before you begin
- Know which setting you want to change (profile, language, security).
- For a password change, prepare a strong, unique password.
- Settings affecting the whole organisation require **administrator rights**.

## Step by step

### Update your profile
1. Open the **Settings** module.
2. Open the **Profile** section.
3. Edit your **name** and **contact**.
4. Save.

### Change your profile photo
1. In the **Profile** section, choose **change photo**.
2. Select an image from your device.
3. Save: the photo appears in the top bar.

### Choose the language
1. Open the **language** preference.
2. Choose **Français** or **English**.
3. The interface switches and the choice is remembered on the device.

### Manage security (password)
1. Open the **Security** section.
2. Choose **change password**.
3. Enter the old password then the new one.
4. Save: the new password applies at next sign-in.

## Best practices
- Keep your **contact information up to date**.
- Change your password **regularly** and never share it.
- Review your profile after any important update.
> Some options may be reserved for administrator profiles.

## Common problems
- **Can’t change an organisation setting** → insufficient rights → ask an administrator.
- **The new photo doesn’t appear** → image not saved or too large → retry with a lighter image.
- **Password rejected** → wrong old password or new one too weak → check entry and strength.
- **Language reverts to the old one** → setting is per device → set it again on this device.

## Frequently asked questions
- **Can I change my own password?** Yes, in the Security section of settings.
- **Do my preferences follow my account?** Language is remembered per device; the profile follows your account.
- **Who configures Mobile Money operators?** An administrator, via operator management.
- **How do I recover lost access?** Contact your administrator for a reset.`,
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
      contenu: `## Contexte
Vous ouvrez un nouveau point de vente et devez le rendre opérationnel avec au moins un agent capable d’enregistrer des transactions. C’est le scénario de démarrage type quand votre réseau s’agrandit. L’ordre compte : l’agence doit exister avant l’agent, car un agent se rattache à une agence.

## Étapes
1. Ouvrez le module **Agences** et cliquez sur **Nouvelle agence**.
2. Renseignez le **nom** (clair, ex. « Agence Cocody »), la **localisation** et le **responsable**.
3. Cliquez sur **Enregistrer** ; l’agence apparaît au statut **actif**.
4. Ouvrez le module **Agents** et cliquez sur **Nouvel agent** (ou sélectionnez un agent existant).
5. Renseignez son **identité** et son **contact**.
6. Choisissez comme **agence de rattachement** l’agence que vous venez de créer.
7. Enregistrez l’agent.
8. Vérifiez que l’**agence** et l’**agent** sont tous deux au statut **actif**.
9. Ouvrez le module **Float** et enregistrez un premier **réapprovisionnement** pour que l’agent puisse opérer.

## Résultat attendu
L’agence apparaît dans la liste des agences actives, avec au moins un agent rattaché, actif et doté d’un float. Le point de vente est prêt à enregistrer des dépôts et retraits.

## Pièges à éviter
- Créer l’agent **avant** l’agence : le rattachement échoue.
- Oublier de **réapprovisionner le float** : l’agent est actif mais ne peut rien faire.
- Laisser l’agence en statut **suspendu** : aucun rattachement ni opération possible.
- Nommer l’agence de façon ambiguë : préférez ville / quartier pour la retrouver plus tard.`,
    },
    en: {
      titre: 'Open a new agency and assign an agent',
      resume: 'Create a point of sale and attach an operational agent to it.',
      contenu: `## Context
You are opening a new point of sale and need to make it operational with at least one agent able to record transactions. This is the typical start-up scenario as your network grows. Order matters: the agency must exist before the agent, since an agent attaches to an agency.

## Steps
1. Open the **Agencies** module and click **New agency**.
2. Fill in the **name** (clear, e.g. “Cocody Branch”), the **location** and the **manager**.
3. Click **Save**; the agency appears with **active** status.
4. Open the **Agents** module and click **New agent** (or select an existing one).
5. Enter their **identity** and **contact**.
6. Choose the agency you just created as the **assigned agency**.
7. Save the agent.
8. Check that both the **agency** and the **agent** are **active**.
9. Open the **Float** module and record a first **replenishment** so the agent can operate.

## Expected result
The agency appears in the list of active agencies, with at least one attached, active agent that has float. The point of sale is ready to record cash-in and cash-out.

## Pitfalls to avoid
- Creating the agent **before** the agency: the assignment fails.
- Forgetting to **replenish the float**: the agent is active but can do nothing.
- Leaving the agency in **suspended** status: no assignment or operation is possible.
- Naming the agency ambiguously: prefer city / district to find it later.`,
    },
  },
  {
    id: 'depot-verifier-commission',
    icone: '💸',
    fr: {
      titre: 'Enregistrer un dépôt client et vérifier la commission',
      resume: 'Saisir un dépôt puis contrôler la commission générée.',
      contenu: `## Contexte
Un client souhaite alimenter son compte Mobile Money (cash-in) via votre agent. Vous voulez enregistrer l’opération correctement puis vérifier que la commission attendue a bien été calculée. C’est le geste le plus courant du quotidien, et le contrôle de la commission garantit la fiabilité de votre suivi de rentabilité.

## Étapes
1. Ouvrez le module **Transactions** et choisissez l’opération **Dépôt**.
2. Sélectionnez l’**agent** qui réalise l’opération.
3. Sélectionnez le **client** (ou saisissez son numéro).
4. Choisissez l’**opérateur** (Orange Money, MTN MoMo, Wave, Moov…).
5. Saisissez le **montant** en XOF et **vérifiez-le** avant validation.
6. Cliquez sur **Valider** : le float de l’agent et la commission se mettent à jour.
7. Ouvrez le module **Commissions**.
8. Filtrez sur l’**agent** concerné et la **période** du jour.
9. Vérifiez que la commission correspondant au dépôt apparaît bien et correspond au montant.

## Résultat attendu
Le dépôt est enregistré, le float de l’agent est mis à jour et la commission associée est visible dans le module Commissions, cohérente avec le montant et l’opérateur.

## Pièges à éviter
- Se tromper d’**opérateur** : la commission calculée sera différente.
- Valider sans **relire le montant** : une transaction validée engage le float.
- Chercher la commission sur une **mauvaise période** et croire qu’elle manque.
- Enregistrer le dépôt sous un agent **à sec** : l’opération peut être bloquée pour float insuffisant.`,
    },
    en: {
      titre: 'Record a customer cash-in and check the commission',
      resume: 'Enter a cash-in, then verify the commission generated.',
      contenu: `## Context
A customer wants to top up their Mobile Money account (cash-in) through your agent. You want to record the operation correctly then check that the expected commission was calculated. This is the most common daily action, and checking the commission ensures your profitability tracking stays reliable.

## Steps
1. Open the **Transactions** module and choose the **Cash-in** operation.
2. Select the **agent** performing the operation.
3. Select the **customer** (or enter their number).
4. Choose the **operator** (Orange Money, MTN MoMo, Wave, Moov…).
5. Enter the **amount** in XOF and **double-check it** before confirming.
6. Click **Confirm**: the agent’s float and the commission update.
7. Open the **Commissions** module.
8. Filter by the **agent** concerned and today’s **period**.
9. Check that the commission for the cash-in appears and matches the amount.

## Expected result
The cash-in is recorded, the agent’s float is updated and the related commission is visible in the Commissions module, consistent with the amount and operator.

## Pitfalls to avoid
- Choosing the wrong **operator**: the calculated commission will differ.
- Confirming without **re-reading the amount**: a confirmed transaction commits the float.
- Looking for the commission in the **wrong period** and thinking it is missing.
- Recording the cash-in under an **out-of-float** agent: the operation may be blocked for insufficient float.`,
    },
  },
  {
    id: 'reapprovisionner-float',
    icone: '💧',
    fr: {
      titre: 'Réapprovisionner le float d’un agent à sec',
      resume: 'Détecter un agent sans liquidité et le recréditer.',
      contenu: `## Contexte
Un agent ne peut plus servir ses clients car son float est épuisé ou passé sous le seuil d’alerte. Vous devez le détecter rapidement et le recréditer pour éviter une interruption de service, en particulier un jour de forte affluence.

## Étapes
1. Ouvrez le module **Float & liquidité**.
2. Repérez l’agent **à sec** (solde nul ou sous le **seuil d’alerte**, signalé visuellement).
3. Assurez-vous de disposer réellement de la **liquidité** à transférer.
4. Lancez un **réapprovisionnement** et sélectionnez l’agent concerné.
5. Saisissez le **montant** à recréditer, au-dessus du seuil d’alerte.
6. Cliquez sur **Valider** : le solde de float augmente immédiatement.
7. Vérifiez que le **solde** de l’agent est de nouveau positif et que l’**alerte a disparu**.
8. Rapprochez, côté **Comptabilité**, ce mouvement de liquidité.

## Résultat attendu
Le float de l’agent est réapprovisionné, l’alerte disparaît et l’agent peut de nouveau réaliser des opérations sans interruption.

## Pièges à éviter
- Recréditer un montant **juste au seuil** : l’alerte peut réapparaître dès la première opération.
- Réapprovisionner un agent **suspendu** : réactivez-le d’abord.
- Oublier de **rapprocher** le mouvement en comptabilité : source d’écart de caisse.
- Confondre float **électronique** et **espèces** selon le sens des opérations de l’agent.`,
    },
    en: {
      titre: 'Replenish an out-of-float agent',
      resume: 'Detect an agent with no liquidity and top them up.',
      contenu: `## Context
An agent can no longer serve customers because their float is exhausted or has dropped below the alert threshold. You need to detect this quickly and top them up to avoid a service interruption, especially on a busy day.

## Steps
1. Open the **Float & liquidity** module.
2. Spot the **out-of-float** agent (zero balance or below the **alert threshold**, visually flagged).
3. Make sure you actually hold the **liquidity** to transfer.
4. Start a **replenishment** and select the agent concerned.
5. Enter the **amount** to credit, above the alert threshold.
6. Click **Confirm**: the float balance rises immediately.
7. Check that the agent’s **balance** is positive again and the **alert has cleared**.
8. Reconcile this liquidity movement on the **Accounting** side.

## Expected result
The agent’s float is replenished, the alert clears and the agent can carry out operations again without interruption.

## Pitfalls to avoid
- Crediting an amount **right at the threshold**: the alert may reappear on the first operation.
- Replenishing a **suspended** agent: reactivate them first.
- Forgetting to **reconcile** the movement in accounting: a source of cash discrepancy.
- Confusing **electronic** float and **cash** depending on the agent’s operation direction.`,
    },
  },
  {
    id: 'retrait-client',
    icone: '🏧',
    fr: {
      titre: 'Effectuer un retrait client en espèces',
      resume: 'Servir un retrait tout en contrôlant la caisse.',
      contenu: `## Contexte
Un client veut retirer des espèces depuis son compte Mobile Money (cash-out). L’enjeu est double : enregistrer correctement l’opération et s’assurer que l’agent dispose des **espèces** nécessaires avant de les remettre. Un retrait mal contrôlé crée un écart de caisse.

## Étapes
1. Ouvrez le module **Transactions** et choisissez l’opération **Retrait**.
2. Sélectionnez l’**agent** qui sert le client.
3. Sélectionnez le **client** (ou son numéro) et vérifiez son identité si l’opération est sensible.
4. Choisissez l’**opérateur** et saisissez le **montant** demandé en XOF.
5. Vérifiez que l’agent dispose des **espèces suffisantes** en caisse.
6. Cliquez sur **Valider** pour enregistrer l’opération.
7. **Remettez les espèces** au client une fois l’opération validée.
8. Contrôlez que le **solde** de l’agent a bien été ajusté.

## Résultat attendu
Le retrait est enregistré, le solde de l’agent est ajusté, les espèces sont remises et l’opération est traçable dans l’historique des transactions.

## Pièges à éviter
- Remettre les espèces **avant** d’avoir validé l’opération.
- Servir un retrait sans **espèces suffisantes** : caisse négative et écart garanti.
- Oublier de **vérifier l’identité** du client pour une opération sensible (KYC).
- Saisir un montant erroné : relisez avant de valider, la validation engage le float.`,
    },
    en: {
      titre: 'Process a customer cash withdrawal',
      resume: 'Serve a withdrawal while keeping cash under control.',
      contenu: `## Context
A customer wants to withdraw cash from their Mobile Money account (cash-out). The challenge is twofold: record the operation correctly and make sure the agent has the **cash** needed before handing it over. A poorly controlled withdrawal creates a cash discrepancy.

## Steps
1. Open the **Transactions** module and choose the **Cash-out** operation.
2. Select the **agent** serving the customer.
3. Select the **customer** (or their number) and verify identity if the operation is sensitive.
4. Choose the **operator** and enter the requested **amount** in XOF.
5. Check that the agent has **enough cash** on hand.
6. Click **Confirm** to record the operation.
7. **Hand the cash** to the customer once the operation is confirmed.
8. Check that the agent’s **balance** has been adjusted.

## Expected result
The withdrawal is recorded, the agent’s balance is adjusted, the cash is handed over and the operation is traceable in the transaction history.

## Pitfalls to avoid
- Handing over the cash **before** confirming the operation.
- Serving a withdrawal without **enough cash**: negative till and a guaranteed discrepancy.
- Forgetting to **verify the customer’s identity** for a sensitive operation (KYC).
- Entering a wrong amount: re-read before confirming, as confirmation commits the float.`,
    },
  },
  {
    id: 'nouveau-client-kyc',
    icone: '🪪',
    fr: {
      titre: 'Enregistrer un nouveau client avec ses informations KYC',
      resume: 'Créer une fiche client conforme avant de la servir.',
      contenu: `## Contexte
Un nouveau client se présente pour la première fois et doit être enregistré avant de réaliser une opération sensible. L’objectif est une fiche **conforme au KYC**, réutilisable pour toutes ses opérations futures, sans créer de doublon.

## Étapes
1. Ouvrez le module **Clients & KYC**.
2. **Recherchez d’abord** le client par nom ou numéro pour éviter un doublon.
3. S’il n’existe pas, cliquez sur **Nouveau client**.
4. Saisissez l’**identité** (nom, prénom) et les **coordonnées** (téléphone).
5. Renseignez les **informations KYC** requises (type et numéro de pièce d’identité, etc.).
6. Vérifiez la pièce d’identité présentée.
7. Cliquez sur **Enregistrer**.
8. Retrouvez le client via la **recherche** pour confirmer la création.
9. Sélectionnez-le lors de la prochaine transaction.

## Résultat attendu
La fiche client est créée avec ses informations KYC ; le client apparaît dans la recherche et peut être sélectionné lors des prochaines opérations.

## Pièges à éviter
- Créer une fiche **sans rechercher** au préalable : risque de doublon.
- Laisser le **KYC incomplet** avant une opération sensible.
- Saisir des données **inutiles** : ne collectez que le nécessaire, avec confidentialité.
- Mal orthographier le nom : préférez la recherche par **numéro** pour retrouver le client ensuite.`,
    },
    en: {
      titre: 'Register a new customer with their KYC information',
      resume: 'Create a compliant customer record before serving them.',
      contenu: `## Context
A new customer arrives for the first time and needs to be registered before a sensitive operation. The goal is a **KYC-compliant** record, reusable for all their future operations, without creating a duplicate.

## Steps
1. Open the **Customers & KYC** module.
2. **Search first** for the customer by name or number to avoid a duplicate.
3. If they do not exist, click **New customer**.
4. Enter the **identity** (first and last name) and **contact details** (phone).
5. Fill in the required **KYC information** (ID type and number, etc.).
6. Verify the ID document presented.
7. Click **Save**.
8. Find the customer via **search** to confirm the record was created.
9. Select them for the next transaction.

## Expected result
The customer record is created with its KYC information; the customer appears in search and can be selected in future operations.

## Pitfalls to avoid
- Creating a record **without searching** first: risk of a duplicate.
- Leaving the **KYC incomplete** before a sensitive operation.
- Capturing **unnecessary** data: only collect what is needed, confidentially.
- Misspelling the name: prefer searching by **number** to find the customer later.`,
    },
  },
  {
    id: 'cloturer-journee-comptable',
    icone: '📒',
    fr: {
      titre: 'Clôturer la journée comptable',
      resume: 'Rapprocher la caisse et figer les totaux du jour.',
      contenu: `## Contexte
La journée se termine et vous devez arrêter les comptes. L’objectif est de rapprocher la caisse réelle avec les opérations enregistrées, d’expliquer tout écart, puis de **figer les totaux** par une clôture conforme au référentiel SYSCOHADA. Une clôture quotidienne évite l’accumulation d’écarts difficiles à retracer.

## Étapes
1. Assurez-vous que **toutes les transactions et mouvements de float** du jour sont saisis.
2. Ouvrez le module **Comptabilité**.
3. Sélectionnez la **période** du jour et consultez les **écritures** et **mouvements de caisse**.
4. **Comptez physiquement** les espèces en caisse.
5. **Rapprochez** la caisse réelle avec les montants enregistrés.
6. En cas d’**écart**, recherchez la cause, corrigez et **documentez** l’explication.
7. Lancez la **clôture de journée** pour figer les totaux.
8. Vérifiez que la journée apparaît bien comme **clôturée**.

## Résultat attendu
La journée est clôturée, les totaux sont figés et la caisse est rapprochée sans écart non expliqué.

## Pièges à éviter
- Clôturer alors que des opérations du jour **ne sont pas encore saisies**.
- Clôturer avec un **écart non documenté** : il devient impossible à retracer plus tard.
- Reporter la clôture au lendemain : les écarts s’accumulent.
- Oublier de rapprocher les **réapprovisionnements de float** avec la caisse.`,
    },
    en: {
      titre: 'Close the accounting day',
      resume: 'Reconcile cash and lock in the day’s totals.',
      contenu: `## Context
The day is ending and you need to close the books. The goal is to reconcile the actual cash against the recorded operations, explain any discrepancy, then **lock in the totals** with a closing aligned to the SYSCOHADA framework. A daily closing prevents the build-up of hard-to-trace discrepancies.

## Steps
1. Make sure all of the day’s **transactions and float movements** are entered.
2. Open the **Accounting** module.
3. Select the day’s **period** and review the **entries** and **cash movements**.
4. **Physically count** the cash on hand.
5. **Reconcile** the actual cash against the recorded amounts.
6. If there is a **discrepancy**, investigate the cause, correct it and **document** the explanation.
7. Run the **day-end closing** to lock in the totals.
8. Check that the day shows as **closed**.

## Expected result
The day is closed, the totals are locked and the cash is reconciled with no unexplained discrepancy.

## Pitfalls to avoid
- Closing while some of the day’s operations are **not yet entered**.
- Closing with an **undocumented discrepancy**: it becomes impossible to trace later.
- Deferring the closing to the next day: discrepancies pile up.
- Forgetting to reconcile **float replenishments** with the cash.`,
    },
  },
  {
    id: 'generer-rapport-mensuel',
    icone: '📈',
    fr: {
      titre: 'Générer et exporter le rapport mensuel',
      resume: 'Produire le rapport du mois et l’exporter en PDF.',
      contenu: `## Contexte
En fin de mois, vous devez produire un rapport d’activité à partager avec les parties prenantes (associés, banque, autorité). L’objectif est un document fiable, exporté et archivé, reflétant fidèlement l’activité du mois écoulé.

## Étapes
1. Assurez-vous que la **saisie du mois** est complète (transactions, float, comptabilité).
2. Ouvrez le module **Reporting**.
3. Sélectionnez la **période** correspondant au mois écoulé.
4. Choisissez le type de rapport **mensuel**.
5. Lancez la **génération** du rapport.
6. Vérifiez les **indicateurs** (transactions, revenus, commissions) et leur cohérence.
7. Croisez au besoin avec la **Comptabilité** pour valider les chiffres financiers.
8. Cliquez sur **Exporter** et choisissez **PDF** (pour le partage) ou **tableur / CSV** (pour l’analyse).
9. **Archivez** le fichier dans votre arborescence (année / mois).

## Résultat attendu
Le rapport mensuel est généré, vérifié et exporté, prêt à être archivé ou partagé avec les parties prenantes.

## Pièges à éviter
- Générer le rapport avant que la **saisie du mois** ne soit terminée.
- Choisir une **période mal bornée** (déborde sur un autre mois).
- Confondre les **formats** : PDF pour partager, CSV pour analyser.
- Ne pas **archiver** l’export : impossible de le retrouver plus tard.`,
    },
    en: {
      titre: 'Generate and export the monthly report',
      resume: 'Produce the month’s report and export it to PDF.',
      contenu: `## Context
At month-end, you need to produce an activity report to share with stakeholders (partners, bank, authority). The goal is a reliable document, exported and archived, faithfully reflecting the past month’s activity.

## Steps
1. Make sure the **month’s entry** is complete (transactions, float, accounting).
2. Open the **Reporting** module.
3. Select the **period** for the past month.
4. Choose the **monthly** report type.
5. Run the report **generation**.
6. Check the **metrics** (transactions, revenue, commissions) and their consistency.
7. Cross-check with **Accounting** if needed to validate financial figures.
8. Click **Export** and choose **PDF** (for sharing) or **spreadsheet / CSV** (for analysis).
9. **Archive** the file in your structure (year / month).

## Expected result
The monthly report is generated, checked and exported, ready to be archived or shared with stakeholders.

## Pitfalls to avoid
- Generating the report before the **month’s entry** is finished.
- Choosing a **poorly bounded period** (spilling into another month).
- Confusing **formats**: PDF to share, CSV to analyse.
- Not **archiving** the export: impossible to find it later.`,
    },
  },
  {
    id: 'licence-expiree',
    icone: '🔑',
    fr: {
      titre: 'Gérer une licence expirée',
      resume: 'Réagir à une échéance dépassée et rétablir l’accès.',
      contenu: `## Contexte
Un message indique que votre licence GESTMONEY est arrivée à échéance. Vous disposez d’une **période de grâce de 7 jours** pour agir avant une restriction d’accès. L’objectif est de renouveler à temps pour éviter toute interruption du service.

## Étapes
1. Ouvrez le module **Licence & facturation**.
2. Vérifiez le **statut** de la licence et la **date d’échéance**.
3. Notez si vous êtes en **période de grâce** (7 jours après l’échéance).
4. Consultez l’**offre** en cours (Starter / Essentiel / Professional / Enterprise) et vérifiez qu’elle correspond à vos besoins.
5. Retrouvez et téléchargez la dernière **facture** si nécessaire.
6. Lancez le **renouvellement** de l’abonnement.
7. Vérifiez que le **statut** repasse à **active**.
8. Si l’accès reste bloqué, contactez **IBIG Soft** (contact@ibigsoft.com).

## Résultat attendu
La licence est renouvelée, son statut repasse à « active » et l’accès complet à la plateforme est rétabli, sans perte de données.

## Pièges à éviter
- Attendre la **fin de la période de grâce** pour agir : l’accès peut se restreindre.
- Renouveler une offre **inadaptée** à un réseau qui a grandi : envisagez un forfait supérieur.
- Ignorer le message d’échéance jusqu’au blocage complet.
- Oublier de **conserver la facture** pour votre comptabilité.`,
    },
    en: {
      titre: 'Handle an expired licence',
      resume: 'React to a passed expiry date and restore access.',
      contenu: `## Context
A message indicates that your GESTMONEY licence has expired. You have a **7-day grace period** to act before access is restricted. The goal is to renew in time to avoid any service interruption.

## Steps
1. Open the **Licence & billing** module.
2. Check the licence **status** and the **expiry date**.
3. Note whether you are in the **grace period** (7 days after expiry).
4. Review the current **plan** (Starter / Essentiel / Professional / Enterprise) and check it fits your needs.
5. Find and download the latest **invoice** if needed.
6. Start the subscription **renewal**.
7. Check that the **status** returns to **active**.
8. If access remains blocked, contact **IBIG Soft** (contact@ibigsoft.com).

## Expected result
The licence is renewed, its status returns to “active” and full access to the platform is restored, with no data loss.

## Pitfalls to avoid
- Waiting until the **end of the grace period** to act: access may be restricted.
- Renewing a plan **ill-suited** to a network that has grown: consider a higher plan.
- Ignoring the expiry message until a full block.
- Forgetting to **keep the invoice** for your accounting.`,
    },
  },
  {
    id: 'poser-question-sara',
    icone: '🤖',
    fr: {
      titre: 'Poser une question à SARA',
      resume: 'Utiliser l’assistant IA pour obtenir de l’aide rapidement.',
      contenu: `## Contexte
Vous cherchez comment réaliser une action (« comment suspendre un agent ? ») ou comprendre un chiffre (« pourquoi le float de cet agent est-il bas ? »). Plutôt que de fouiller les menus, vous interrogez SARA, l’assistant IA, pour gagner du temps. Ses réponses sont indicatives : elles orientent, elles ne remplacent pas votre contrôle.

## Étapes
1. Ouvrez l’**assistant SARA** depuis l’interface.
2. Formulez votre question en **une phrase claire et précise** (ajoutez période, agent ou agence si utile).
3. Envoyez la question et lisez la réponse proposée.
4. Si la réponse n’est pas exacte, **reformulez** ou ajoutez un détail, puis relancez.
5. Notez le **module** vers lequel SARA vous oriente.
6. Ouvrez ce module et **vérifiez** la donnée ou l’action.
7. Ne validez une action importante qu’après ce contrôle.

## Résultat attendu
Vous obtenez une réponse ou une orientation utile, tout en gardant la maîtrise des validations importantes, réalisées vous-même dans le module concerné.

## Pièges à éviter
- Poser une question **trop vague** : la réponse sera imprécise.
- Prendre une réponse SARA pour une **validation** : elle n’exécute pas les opérations sensibles.
- Se fier à un chiffre sans **vérifier la saisie** sous-jacente.
- Oublier que les réponses sont **indicatives et non contractuelles**.`,
    },
    en: {
      titre: 'Ask SARA a question',
      resume: 'Use the AI assistant to get help quickly.',
      contenu: `## Context
You are looking for how to perform an action (“how do I suspend an agent?”) or understand a figure (“why is this agent’s float low?”). Rather than digging through menus, you ask SARA, the AI assistant, to save time. Its answers are indicative: they guide, they do not replace your own check.

## Steps
1. Open the **SARA assistant** from the interface.
2. Phrase your question in **one clear, precise sentence** (add period, agent or agency if useful).
3. Send the question and read the proposed answer.
4. If the answer isn’t quite right, **rephrase** or add a detail, then resend.
5. Note the **module** SARA points you to.
6. Open that module and **verify** the data or action.
7. Only confirm an important action after this check.

## Expected result
You get a useful answer or direction, while keeping control over important confirmations, which you perform yourself in the relevant module.

## Pitfalls to avoid
- Asking a **too vague** question: the answer will be imprecise.
- Mistaking a SARA answer for a **confirmation**: it does not execute sensitive operations.
- Trusting a figure without **checking the underlying entry**.
- Forgetting that answers are **indicative and non-contractual**.`,
    },
  },
];

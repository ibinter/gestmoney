// ============================================================
// GESTMONEY — Académie / Guide utilisateur (espace connecté)
// Source de vérité des 12 articles structurés par catégorie.
// Module de DONNÉES pur — aucun import React.
// ============================================================

export type Categorie =
  | 'demarrage'
  | 'transactions'
  | 'agents'
  | 'rapports'
  | 'configuration'
  | 'securite';

export interface GuideArticle {
  slug: string;
  categorie: Categorie;
  titre: string;
  resume: string;
  tempsLecture: number; // en minutes
  contenu: string; // markdown simplifié
}

// ── Rendu markdown simplifié → HTML ──────────────────────────────────────────
function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function renderMarkdown(content: string): string {
  const lines = content.trim().split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) { html.push(`</${listType}>`); listType = null; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2 id="${slugify(line.slice(3))}" class="acad-h2">${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3 class="acad-h3">${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ⚠️') || line.startsWith('> ATTENTION')) {
      closeList();
      html.push(`<div class="acad-warn">${inline(line.slice(2))}</div>`);
    } else if (line.startsWith('> ')) {
      closeList();
      html.push(`<div class="acad-note">${inline(line.slice(2))}</div>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') { closeList(); html.push('<ol class="acad-ol">'); listType = 'ol'; }
      html.push(`<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`);
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') { closeList(); html.push('<ul class="acad-ul">'); listType = 'ul'; }
      html.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html.push(`<p class="acad-p">${inline(line)}</p>`);
    }
  }
  closeList();
  return html.join('\n');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Extrait les titres H2 d'un contenu pour la table des matières. */
export function extractToc(contenu: string): { id: string; titre: string }[] {
  return contenu
    .split('\n')
    .filter((l) => l.startsWith('## '))
    .map((l) => {
      const titre = l.slice(3).trim();
      return { id: slugify(titre), titre };
    });
}

// ── CSS partagé (portée .acad-body) ──────────────────────────────────────────
export const ACAD_CSS = `
.acad-body .acad-h2 { font-size:1.05rem; font-weight:800; margin:1.4rem 0 .5rem; color:#111827; scroll-margin-top:80px; }
.acad-body .acad-h3 { font-size:.95rem; font-weight:700; color:#1E8C32; margin:.9rem 0 .35rem; }
.acad-body .acad-p  { font-size:.93rem; line-height:1.7; margin:.5rem 0; color:#374151; }
.acad-body .acad-ul,
.acad-body .acad-ol { margin:.5rem 0 .5rem 1.5rem; }
.acad-body .acad-ul li,.acad-body .acad-ol li { font-size:.93rem; line-height:1.65; color:#374151; margin:.3rem 0; }
.acad-body .acad-ul li { list-style:disc; }
.acad-body .acad-ol li { list-style:decimal; }
.acad-body .acad-note { border-left:3px solid #1E8C32; background:rgba(30,140,50,.06); border-radius:8px; padding:.6rem .9rem; margin:.75rem 0; font-size:.9rem; color:#245c30; }
.acad-body .acad-warn { border-left:3px solid #f59e0b; background:rgba(245,158,11,.07); border-radius:8px; padding:.6rem .9rem; margin:.75rem 0; font-size:.9rem; color:#92400e; }
.acad-body strong { font-weight:700; }
.dark .acad-body .acad-h2 { color:#f3f4f6; }
.dark .acad-body .acad-h3 { color:#4ade80; }
.dark .acad-body .acad-p,
.dark .acad-body .acad-ul li,
.dark .acad-body .acad-ol li { color:#d1d5db; }
.dark .acad-body .acad-note { color:#bbf7d0; background:rgba(30,140,50,.12); }
.dark .acad-body .acad-warn { color:#fde68a; background:rgba(245,158,11,.10); }
`;

// ══════════════════════════════════════════════════════════════════════════════
// CATÉGORIES
// ══════════════════════════════════════════════════════════════════════════════

export interface CategorieInfo {
  id: Categorie;
  icone: string;
  titre: string;
  couleur: string; // classe Tailwind de fond
}

export const CATEGORIES: CategorieInfo[] = [
  { id: 'demarrage',     icone: '🚀', titre: 'Démarrage rapide',          couleur: 'bg-blue-50   dark:bg-blue-900/20'   },
  { id: 'transactions',  icone: '💳', titre: 'Transactions',               couleur: 'bg-green-50  dark:bg-green-900/20'  },
  { id: 'agents',        icone: '👥', titre: 'Gestion des agents',         couleur: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'rapports',      icone: '📊', titre: 'Rapports et comptabilité',   couleur: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'configuration', icone: '⚙️', titre: 'Configuration',              couleur: 'bg-gray-50   dark:bg-gray-800/40'   },
  { id: 'securite',      icone: '🔒', titre: 'Sécurité & Administration',  couleur: 'bg-red-50    dark:bg-red-900/20'    },
];

// ══════════════════════════════════════════════════════════════════════════════
// ARTICLES
// ══════════════════════════════════════════════════════════════════════════════

export const GUIDE_ARTICLES: GuideArticle[] = [

  // ── DÉMARRAGE RAPIDE ───────────────────────────────────────────────────────

  {
    slug: 'premiere-connexion',
    categorie: 'demarrage',
    titre: 'Première connexion et configuration initiale',
    resume: 'Se connecter pour la première fois, sécuriser son compte et personnaliser son espace.',
    tempsLecture: 3,
    contenu: `## Bienvenue dans GESTMONEY

Lorsque votre administrateur crée votre compte, vous recevez une adresse e-mail et un mot de passe provisoire. La première connexion vous permet de prendre possession de votre espace et de le configurer selon vos préférences. C'est aussi le moment idéal pour sécuriser votre accès avant de commencer à enregistrer des opérations.

GESTMONEY fonctionne entièrement dans le navigateur : aucune installation n'est nécessaire. Les navigateurs recommandés sont Chrome, Edge et Firefox dans leur version récente.

## Étapes de la première connexion

### Se connecter
1. Ouvrez GESTMONEY dans votre navigateur (URL fournie par votre organisation).
2. Saisissez votre **adresse e-mail** dans le premier champ.
3. Saisissez le **mot de passe provisoire** transmis par votre administrateur.
4. Cliquez sur **Se connecter** pour accéder au tableau de bord.

### Changer son mot de passe dès la première session
1. Ouvrez le menu **Mon profil** (icône en haut à droite).
2. Accédez à la section **Sécurité** ou **Changer le mot de passe**.
3. Saisissez l'ancien mot de passe, puis un nouveau mot de passe robuste (au moins 8 caractères, mixant lettres, chiffres et symboles).
4. Confirmez et enregistrez.

### Compléter son profil
1. Restez dans **Mon profil**.
2. Vérifiez que votre **nom**, votre **téléphone** et votre **rôle** sont corrects.
3. Enregistrez les modifications.

### Choisir sa langue
1. Repérez le sélecteur de langue **FR / EN** dans la barre supérieure.
2. Cliquez sur la langue souhaitée. L'interface bascule instantanément.
3. Le choix est mémorisé sur votre appareil.

## Bonnes pratiques de sécurité

- Utilisez un **mot de passe unique** à GESTMONEY, jamais partagé.
- **Déconnectez-vous** systématiquement sur un poste partagé.
- Ne laissez pas votre session ouverte sans surveillance : chaque opération est tracée sous votre identifiant.

> Conseil : activez les notifications dans votre profil pour recevoir les alertes importantes (float bas, transaction en attente).

## Questions fréquentes

- **Je n'ai pas reçu mon mot de passe.** Vérifiez vos courriers indésirables puis contactez votre administrateur.
- **Je vois une erreur « Compte inactif ».** Votre licence est peut-être expirée — contactez le support.
- **Mon rôle semble incorrect.** Seul l'administrateur peut modifier les rôles ; contactez-le.`,
  },

  {
    slug: 'creer-agence',
    categorie: 'demarrage',
    titre: 'Créer votre première agence',
    resume: 'Paramétrer un point de vente avant d\'y rattacher des agents.',
    tempsLecture: 2,
    contenu: `## Pourquoi commencer par les agences

Dans GESTMONEY, **tout part de l'agence** : chaque agent, chaque float et chaque rapport se rattachent à un point de vente. Avant de pouvoir enregistrer une transaction, il faut au moins une agence active dans le système. Cette étape est donc la première à réaliser après votre connexion initiale.

Une agence correspond à un lieu physique (boutique, kiosque, comptoir) où vos agents opèrent. Vous pouvez en créer autant que nécessaire — une par point de vente.

## Créer une agence étape par étape

### Ouvrir le module Agences
1. Dans la barre latérale gauche, cliquez sur **Agences & PDV**.
2. La liste de vos agences s'affiche (vide lors de la première utilisation).

### Renseigner les informations
1. Cliquez sur **Nouvelle agence** (bouton en haut à droite).
2. Saisissez un **nom clair et unique**, par exemple : « Agence Cocody Centre » ou « PDV Marcory ».
3. Indiquez la **localisation** (quartier, rue ou ville).
4. Désignez un **responsable** (personne référente pour ce point de vente).
5. Cliquez sur **Enregistrer**.

### Vérifier la création
1. L'agence apparaît dans la liste avec le statut **Active**.
2. Elle est désormais disponible pour y rattacher des agents.

## Après la création

Une fois l'agence créée, l'étape suivante est de créer les **agents** qui y travailleront (voir l'article « Ajouter et configurer un agent »). Sans agent rattaché, une agence reste opérationnellement inactive.

> Conseil : adoptez une **convention de nommage** dès le départ (ville + quartier + type de PDV) — cela facilite la lecture des rapports quand le réseau grandit.

## Points d'attention

- Le **nom d'agence est modifiable** à tout moment, mais gardez-le stable pour la lisibilité des historiques.
- Vous pouvez **suspendre** une agence sans la supprimer — toutes ses données restent accessibles.
- Pour les réseaux de plus de 10 agences, utilisez les **filtres de la liste** pour naviguer efficacement.`,
  },

  {
    slug: 'ajouter-agent',
    categorie: 'demarrage',
    titre: 'Ajouter et configurer un agent',
    resume: 'Créer un profil agent, le rattacher à une agence et préparer son float de départ.',
    tempsLecture: 4,
    contenu: `## Le rôle de l'agent dans GESTMONEY

Un agent est la personne qui réalise les opérations Mobile Money sur le terrain : dépôts (cash-in), retraits (cash-out), transferts. Dans GESTMONEY, chaque opération est enregistrée au nom d'un agent identifié. C'est pourquoi il est indispensable de créer les profils agents avant d'enregistrer la moindre transaction.

Un agent doit obligatoirement être **rattaché à une agence active**. Assurez-vous donc d'avoir créé votre première agence (voir l'article précédent) avant de passer à cette étape.

## Créer un profil agent

### Accéder au module Agents
1. Dans la barre latérale, cliquez sur **Agents**.
2. Cliquez sur **Nouvel agent**.

### Renseigner l'identité
1. Saisissez le **prénom** et le **nom** de l'agent.
2. Indiquez son **numéro de téléphone** (utilisé pour le contact et les notifications).
3. Sélectionnez son **agence de rattachement** dans la liste déroulante.
4. Cliquez sur **Enregistrer**.

### Vérifier le profil créé
1. L'agent apparaît dans la liste avec le statut **Actif**.
2. Ouvrez sa fiche pour voir le détail : float disponible (zéro à ce stade), transactions réalisées, commissions générées.

## Préparer le float de départ

Un agent sans float ne peut pas opérer. Après avoir créé le profil, approvisionnez son float :
1. Accédez au module **Float & liquidité** dans la barre latérale.
2. Cliquez sur **Nouveau réapprovisionnement**.
3. Sélectionnez l'agent concerné.
4. Saisissez le montant initial en **XOF**.
5. Validez : le float de l'agent est crédité immédiatement.

> Conseil : pour un agent qui démarre, accordez un float de départ représentant au moins 2 à 3 journées d'activité estimée. Vous pouvez ajuster à tout moment.

## Configurer l'alerte de float bas

1. Dans la fiche de l'agent (module Agents), repérez le champ **Seuil d'alerte de float**.
2. Saisissez un montant en dessous duquel vous souhaitez être alerté.
3. Enregistrez.

Lorsque le float de l'agent passe sous ce seuil, le tableau de bord et le module Float signalent l'alerte en orange.

## Bonnes pratiques

- Créez les agents **un par un** en vérifiant les informations avant d'enregistrer.
- Gardez les **coordonnées à jour** pour joindre l'agent en cas de problème.
- Définissez le seuil d'alerte **dès la création** pour ne pas avoir de mauvaise surprise.

> ⚠️ ATTENTION : Si l'agence de rattachement est suspendue, l'agent ne peut plus enregistrer d'opérations. Assurez-vous que l'agence est bien active.`,
  },

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────

  {
    slug: 'enregistrer-transaction',
    categorie: 'transactions',
    titre: 'Enregistrer une transaction Mobile Money',
    resume: 'Saisir un dépôt ou un retrait pas à pas, avec les bonnes vérifications.',
    tempsLecture: 3,
    contenu: `## Les deux types d'opérations

GESTMONEY gère deux types principaux de transactions Mobile Money :

- **Dépôt (cash-in)** : le client vous remet des espèces et vous chargez son compte Mobile Money. Votre float électronique (unités) diminue, vos espèces augmentent.
- **Retrait (cash-out)** : le client retire des espèces depuis son compte Mobile Money. Votre float électronique augmente, vos espèces diminuent.

Dans les deux cas, la commission est calculée automatiquement sur la base du montant et de l'opérateur.

## Pré-requis avant de saisir

- L'agent doit être **actif** et avoir un **float suffisant** pour l'opération.
- L'opérateur Mobile Money (Orange Money, MTN MoMo, Wave, Moov Money…) doit être **configuré** dans le système.
- Le client peut être retrouvé via sa fiche ou identifié directement par son numéro.

## Enregistrer un dépôt (cash-in)

1. Dans la barre latérale, cliquez sur **Transactions**.
2. Cliquez sur **Nouvelle transaction**.
3. Choisissez le type **Dépôt**.
4. Sélectionnez l'**agent** qui réalise l'opération.
5. Recherchez le **client** par nom ou numéro de téléphone — ou saisissez directement son numéro.
6. Choisissez l'**opérateur** (canal Mobile Money).
7. Saisissez le **montant** en XOF.
8. Vérifiez le récapitulatif (montant, frais, commission).
9. Cliquez sur **Valider** pour enregistrer.

## Enregistrer un retrait (cash-out)

1. Choisissez le type **Retrait**.
2. Renseignez l'**agent**, le **client** et l'**opérateur**.
3. Saisissez le **montant** demandé par le client.
4. Vérifiez que l'agent dispose de **suffisamment d'espèces** en caisse pour remettre au client.
5. Cliquez sur **Valider**, puis remettez les espèces au client.

## Vérifications importantes

- **Double-vérifiez le montant** avant de valider : une opération validée impacte immédiatement le float.
- **Confirmer le numéro client** sur Orange Money, MTN MoMo ou Wave avant d'envoyer.
- En cas de **doute sur le numéro**, annulez et recommencez plutôt que de valider à tort.

> Conseil : saisissez les transactions **au fil de l'eau**, immédiatement après chaque opération. Une saisie différée en fin de journée augmente les risques d'erreur.

## Après la validation

La transaction apparaît dans la liste avec l'horodatage, le nom de l'agent, le montant et la commission générée. Le float de l'agent est mis à jour automatiquement.`,
  },

  {
    slug: 'valider-annuler',
    categorie: 'transactions',
    titre: 'Valider ou annuler une transaction',
    resume: 'Comprendre le cycle de vie d\'une transaction et gérer les corrections.',
    tempsLecture: 2,
    contenu: `## Le cycle de vie d'une transaction

Dans GESTMONEY, une transaction passe par plusieurs états :

- **En attente** : créée mais pas encore confirmée (selon votre configuration).
- **Validée** : opération enregistrée, float impacté, commission calculée.
- **Annulée** : opération annulée avant validation.

Une fois **validée**, une transaction ne peut plus être effacée. Toute correction se fait par une opération complémentaire tracée.

## Valider une transaction en attente

Si votre configuration nécessite une validation manuelle :
1. Accédez au module **Transactions**.
2. Filtrez par statut **En attente**.
3. Ouvrez la transaction à valider.
4. Vérifiez les informations (montant, agent, opérateur, client).
5. Cliquez sur **Valider** pour la confirmer.

## Annuler une transaction avant validation

1. Ouvrez la transaction au statut **En attente**.
2. Cliquez sur **Annuler**.
3. Confirmez l'annulation dans la boîte de dialogue.
4. La transaction passe au statut **Annulée** et le float n'est pas impacté.

## Corriger une transaction déjà validée

Une transaction validée ne peut pas être modifiée directement. Pour corriger :
1. Identifiez l'erreur (montant, opérateur, sens de l'opération).
2. Créez une transaction **corrective** dans le sens inverse pour neutraliser l'impact sur le float.
3. Documentez la correction dans le module **Comptabilité** si nécessaire.
4. Signalez la correction au superviseur pour traçabilité.

> ⚠️ ATTENTION : Ne validez jamais une transaction dont vous n'êtes pas certain du montant ou du numéro client. Une correction après validation est plus longue et risquée qu'une vérification préalable.

## Cas pratiques courants

- **Mauvais montant validé** : créez une transaction inverse du même montant pour équilibrer le float, puis enregistrez la bonne opération.
- **Mauvais opérateur sélectionné** : même approche — opération inverse + nouvelle opération correcte.
- **Doublon de transaction** : vérifiez l'historique avant toute correction pour éviter une troisième opération non voulue.`,
  },

  {
    slug: 'gestion-float',
    categorie: 'transactions',
    titre: 'Gérer la flotte (float) des agents',
    resume: 'Surveiller la liquidité, définir des seuils d\'alerte et réapprovisionner.',
    tempsLecture: 5,
    contenu: `## Qu'est-ce que le float ?

Le **float** est la liquidité disponible qu'un agent peut mobiliser pour opérer. Il se compose :

- Du **float électronique** : les unités Mobile Money stockées sur le compte de l'agent (utilisées pour les dépôts / cash-in).
- Des **espèces en caisse** : l'argent physique disponible pour les retraits / cash-out.

La gestion du float est cruciale : un agent à court de liquidité ne peut plus servir les clients. Les ruptures de float sont la première cause d'interruption de service dans les réseaux Mobile Money en Afrique de l'Ouest.

## Surveiller les soldes de float

### Vue d'ensemble
1. Accédez au module **Float & liquidité** dans la barre latérale.
2. La liste affiche chaque agent avec son **solde actuel** et une indication visuelle (vert = OK, orange = seuil bas, rouge = critique).
3. Triez par solde croissant pour identifier les agents prioritaires.

### Vue détaillée par agent
1. Cliquez sur un agent pour ouvrir sa fiche.
2. Consultez l'**historique des mouvements** : réapprovisionnements reçus et consommation par les transactions.
3. Estimez sa **consommation journalière** pour anticiper le prochain réapprovisionnement.

## Définir des seuils d'alerte

Un seuil d'alerte permet au système de vous signaler automatiquement quand un agent approche de la rupture :
1. Ouvrez la fiche de l'agent dans le module **Agents**.
2. Localisez le champ **Seuil d'alerte de float**.
3. Saisissez un montant représentatif (exemple : 50 000 XOF pour un agent réalisant 300 000 XOF de transactions par jour).
4. Enregistrez.

> Conseil : calibrez le seuil pour avoir au moins **une demi-journée** de tampon avant la rupture. Cela vous laisse le temps d'agir.

## Réapprovisionner un agent

### Réapprovisionnement simple
1. Dans le module **Float & liquidité**, cliquez sur **Nouveau réapprovisionnement**.
2. Sélectionnez l'agent à créditer.
3. Saisissez le montant en **XOF**.
4. Validez : le float de l'agent est mis à jour immédiatement.

### Réapprovisionnement depuis la fiche agent
1. Ouvrez la fiche de l'agent.
2. Cliquez sur le bouton **Réapprovisionner**.
3. Saisissez le montant et confirmez.

## Anticiper les pics d'activité

En Afrique de l'Ouest, certains jours concentrent davantage d'opérations :

- **Jours de marché** (lundis et jeudis dans de nombreuses zones) : prévoir un float 2× supérieur.
- **Fin de mois** (versement des salaires) : retraits massifs attendus — augmentez les espèces en caisse.
- **Jours fériés** précédant une longue période : anticipez car les réapprovisionnements peuvent être difficiles.

> Conseil : tenez un historique des pics pour chaque agence et automatisez les réapprovisionnements préventifs la veille.

## Réconciliation float et comptabilité

Le module Float suit la **liquidité opérationnelle**. Pour la comptabilité :
1. Comparez le total du float théorique (GESTMONEY) avec le comptage réel des espèces.
2. Tout écart doit être documenté et tracé dans le module Comptabilité.
3. Un réapprovisionnement non tracé crée systématiquement un écart — enregistrez **tous** les mouvements.`,
  },

  // ── RAPPORTS ──────────────────────────────────────────────────────────────

  {
    slug: 'rapports-journaliers',
    categorie: 'rapports',
    titre: 'Générer les rapports journaliers',
    resume: 'Produire et exporter les synthèses d\'activité quotidienne par agent et par agence.',
    tempsLecture: 3,
    contenu: `## À quoi servent les rapports journaliers

Les rapports journaliers résument l'activité de la journée : nombre de transactions, volumes en XOF, commissions générées, par agent et par agence. Ils servent à :

- **Vérifier** que toutes les opérations sont bien enregistrées.
- **Piloter** la performance de chaque point de vente.
- **Préparer** les reversements de commissions aux agents.
- **Rendre compte** à votre direction ou à vos partenaires opérateurs.

La discipline du rapport journalier est la base d'une gestion saine d'un réseau Mobile Money.

## Générer un rapport journalier

### Accéder au module Rapports
1. Dans la barre latérale, cliquez sur **Rapports & BI**.
2. Sélectionnez la vue **Journalier** ou choisissez la date du jour.

### Choisir les paramètres
1. Vérifiez que la **date** est bien celle d'aujourd'hui (ou la date souhaitée).
2. Sélectionnez l'**agence** ou laissez sur « Toutes les agences » pour une vue consolidée.
3. Filtrez par **type d'opération** si nécessaire (dépôts seuls, retraits seuls, ou les deux).

### Lire le rapport
1. Observez le **nombre total de transactions** de la journée.
2. Lisez le **volume total en XOF** (dépôts + retraits).
3. Repérez les **commissions générées** par agent et par agence.
4. Identifiez les agents avec peu ou pas d'activité (peut indiquer un problème de float ou un agent absent).

### Exporter le rapport
1. Cliquez sur **Exporter** (format PDF ou Excel selon les options disponibles).
2. Sauvegardez le fichier pour vos archives ou transmettez-le à votre direction.

## Rapprocher le rapport avec la caisse

Après avoir généré le rapport :
1. Comparez le total des transactions au **comptage physique de caisse**.
2. Tout écart supérieur à votre tolérance doit être investigué avant la clôture.
3. Utilisez le module **Comptabilité** pour enregistrer les ajustements.

> Conseil : générez le rapport chaque soir avant la clôture. Un rapport non analysé est une occasion manquée de détecter une erreur pendant qu'elle est encore fraîche.

## Indicateurs clés à surveiller

- **Taux d'utilisation du float** : si un agent a consommé 90 % de son float en une journée, anticipez le réapprovisionnement.
- **Écart entre commissions théoriques et affichées** : vérifiez que les bons opérateurs sont sélectionnés.
- **Agent à zéro transaction** : absence, panne, ou problème de float ? Contactez l'agent concerné.`,
  },

  {
    slug: 'comptabilite-ohada',
    categorie: 'rapports',
    titre: 'Comprendre la comptabilité OHADA dans GESTMONEY',
    resume: 'Principes SYSCOHADA appliqués à votre activité Mobile Money, clôtures et écritures.',
    tempsLecture: 6,
    contenu: `## Le référentiel OHADA / SYSCOHADA

L'**OHADA** (Organisation pour l'Harmonisation en Afrique du Droit des Affaires) a adopté le **SYSCOHADA** comme plan comptable de référence pour les entreprises de la zone. Ce référentiel s'applique à toute structure commerciale en Afrique de l'Ouest et Centrale, y compris les réseaux de services financiers mobiles.

GESTMONEY s'appuie sur ce référentiel pour structurer les écritures comptables générées par votre activité Mobile Money. Comprendre les principes de base vous aide à interpréter les modules Comptabilité et à préparer vos déclarations.

## Les comptes clés dans votre activité

### Le float comme actif circulant
Le float électronique (unités Mobile Money) est un **actif circulant** : il représente la liquidité que vous gérez pour le compte des opérateurs. Dans le SYSCOHADA, il se classe dans les comptes de trésorerie ou de créances selon votre convention avec l'opérateur.

### Les commissions comme produits
Chaque commission perçue est un **produit d'exploitation** (classe 7 du SYSCOHADA). GESTMONEY les ventile automatiquement par opérateur et par période, ce qui facilite la déclaration.

### Les espèces en caisse
Les espèces constituent votre **caisse** (compte 57 du SYSCOHADA). Le module Comptabilité les suit en parallèle des opérations Mobile Money.

## Clôture journalière

La **clôture de journée** est un acte comptable important :
1. **Avant de clôturer** : vérifiez que toutes les transactions du jour sont enregistrées et que la caisse est rapprochée (voir article « Générer les rapports journaliers »).
2. **Lancer la clôture** : dans le module Comptabilité, cliquez sur **Clôture de journée**.
3. **Effet de la clôture** : les totaux sont figés. Toute correction ultérieure passe par une écriture d'ajustement.

> ⚠️ ATTENTION : Ne clôturez pas une journée avec un écart de caisse non expliqué. Investiguez d'abord, puis clôturez.

## Écritures d'ajustement

Quand une erreur est découverte après clôture :
1. Identifiez l'écriture erronée et son impact (montant, sens).
2. Dans le module Comptabilité, créez une **écriture d'ajustement** dans le sens inverse.
3. Documentez la raison de l'ajustement (champ commentaire).
4. Toute écriture d'ajustement doit être **signée par le responsable**.

## Rapprochement avec les relevés opérateurs

Les opérateurs Mobile Money (Orange Money, MTN MoMo, Wave…) fournissent des relevés périodiques de votre compte agent. Rapprochez ces relevés avec les données GESTMONEY :
1. Exportez le rapport mensuel de GESTMONEY (module Rapports & BI).
2. Comparez les volumes et les commissions ligne par ligne.
3. Tout écart doit être signalé à l'opérateur et documenté.

## Questions fréquentes comptables

- **Dois-je avoir un expert-comptable ?** Pour les clôtures annuelles et les déclarations fiscales, oui. Pour le suivi quotidien, GESTMONEY suffit.
- **La TVA s'applique-t-elle aux commissions Mobile Money ?** Cela dépend de votre statut et de la réglementation locale — consultez votre expert-comptable.
- **Les pertes de float sont-elles déductibles ?** Oui, à condition de les documenter correctement. Le journal d'audit de GESTMONEY constitue une pièce justificative.`,
  },

  // ── CONFIGURATION ─────────────────────────────────────────────────────────

  {
    slug: 'configurer-operateurs',
    categorie: 'configuration',
    titre: 'Configurer les opérateurs Mobile Money',
    resume: 'Ajouter et paramétrer Orange Money, MTN MoMo, Wave, Moov Money et autres canaux.',
    tempsLecture: 3,
    contenu: `## Pourquoi configurer les opérateurs

Les opérateurs Mobile Money sont les **canaux** via lesquels vos clients déposent et retirent de l'argent : Orange Money, MTN MoMo, Wave, Moov Money, Free Money, etc. GESTMONEY doit connaître ces canaux pour :

- Associer chaque transaction au bon opérateur.
- Calculer les commissions selon le barème propre à chaque canal.
- Produire des rapports ventilés par opérateur.

Sans opérateur configuré, aucune transaction ne peut être enregistrée.

## Accéder à la gestion des opérateurs

1. Dans la barre latérale, cliquez sur **Opérateurs** (section Réseau).
2. La liste des opérateurs actuellement configurés s'affiche.

> Note : ce module est réservé aux rôles administrateur et superviseur. Si vous ne le voyez pas, contactez votre administrateur.

## Ajouter un opérateur

1. Cliquez sur **Nouvel opérateur**.
2. Saisissez le **nom** de l'opérateur (ex. : « Orange Money CI »).
3. Choisissez le **pays** ou la **zone** de déploiement.
4. Indiquez le **code** ou l'identifiant interne si applicable.
5. Enregistrez.

L'opérateur est désormais disponible dans la liste de sélection lors de la saisie d'une transaction.

## Configurer les barèmes de commission

Les commissions varient selon l'opérateur et le montant de la transaction. Pour chaque opérateur :
1. Ouvrez la fiche de l'opérateur.
2. Accédez à la section **Barème de commission** ou **Paramètres**.
3. Saisissez les **tranches de montant** et les **taux de commission** correspondants (fournis par votre contrat avec l'opérateur).
4. Enregistrez.

> Conseil : rapprochez vos barèmes de commission des **contrats signés avec chaque opérateur**. Un taux erroné génère des commissions inexactes, difficiles à corriger a posteriori.

## Désactiver un opérateur

Si vous cessez de proposer un service (ex. : fin de partenariat) :
1. Ouvrez la fiche de l'opérateur.
2. Basculez son statut sur **Inactif**.
3. Il n'apparaît plus dans la liste de saisie des transactions.

Les transactions historiques liées à cet opérateur restent accessibles dans les rapports.

## Points d'attention

- **Cohérence des noms** : utilisez des noms stables et reconnaissables (« Orange Money » plutôt que « OM » ou « Orange »).
- **Mise à jour des barèmes** : les opérateurs révisent parfois leurs commissions — mettez à jour dès que vous recevez les nouveaux barèmes.
- **Opérateur par défaut** : si votre réseau travaille principalement avec un opérateur, paramétrez-le par défaut pour accélérer la saisie.`,
  },

  {
    slug: 'gestion-commissions',
    categorie: 'configuration',
    titre: 'Paramétrer les plans de commission',
    resume: 'Définir les barèmes, les règles de reversement et les objectifs par agent.',
    tempsLecture: 5,
    contenu: `## Comprendre la structure des commissions

Dans un réseau Mobile Money, la commission est la rémunération que vous percevez pour chaque opération. Elle se calcule généralement en **pourcentage du montant de la transaction**, avec des **tranches progressives** selon les barèmes de l'opérateur.

GESTMONEY distingue :

- La **commission brute** : ce que l'opérateur vous verse.
- La **commission agent** : la part que vous reversez à l'agent (une fraction de la commission brute).
- La **marge réseau** : ce qui reste après reversement à l'agent.

Un bon paramétrage des plans de commission vous permet de calculer automatiquement ces trois niveaux pour chaque transaction.

## Accéder aux plans de commission

1. Dans la barre latérale, cliquez sur **Commissions**.
2. Pour modifier les barèmes, accédez aux **Paramètres** (ou **Configuration**) du module.

> Note : la modification des plans de commission est réservée aux rôles administrateur.

## Créer un plan de commission

### Par opérateur
Chaque opérateur a son propre barème :
1. Sélectionnez l'opérateur concerné.
2. Définissez les **tranches de montant** (ex. : 0–50 000 XOF, 50 001–100 000 XOF, etc.).
3. Pour chaque tranche, indiquez :
   - Le **taux commission brute** (ce que l'opérateur paie).
   - Le **taux commission agent** (ce que vous reversez à l'agent).
4. Enregistrez.

### Par type d'opération
Les barèmes peuvent différer entre dépôt et retrait :
1. Créez des plans distincts pour les dépôts et les retraits si vos contrats le prévoient.
2. Associez chaque plan au type d'opération correspondant.

## Définir des objectifs par agent

Pour motiver vos agents, vous pouvez fixer des **objectifs mensuels** :
1. Dans la fiche de l'agent (module Agents), accédez à la section **Objectifs**.
2. Saisissez un **volume cible** en XOF ou un **nombre de transactions**.
3. Enregistrez.

Le module Performances affiche l'avancement de chaque agent par rapport à ses objectifs.

## Reversement des commissions

À la fin de chaque période (semaine, mois) :
1. Accédez au module **Commissions**.
2. Filtrez par **agent** et **période**.
3. Exportez le récapitulatif via le module **Rapports & BI**.
4. Utilisez ce document pour effectuer les reversements physiques ou bancaires.

> Conseil : établissez un **calendrier fixe de reversement** (ex. : tous les vendredis) et communiquez-le clairement à vos agents. Cela réduit les demandes ad hoc et améliore la confiance.

## Vérifications périodiques

- **Chaque mois** : rapprochez les commissions affichées dans GESTMONEY avec les relevés de l'opérateur.
- **À chaque changement de barème** : mettez à jour immédiatement le plan de commission dans le système.
- **En cas d'écart** : identifiez si l'erreur vient d'une saisie (mauvais opérateur ou montant) ou d'un barème incorrect.`,
  },

  // ── SÉCURITÉ ──────────────────────────────────────────────────────────────

  {
    slug: 'roles-permissions',
    categorie: 'securite',
    titre: 'Comprendre les rôles et permissions',
    resume: 'Les niveaux d\'accès dans GESTMONEY : qui peut voir quoi et faire quoi.',
    tempsLecture: 4,
    contenu: `## Le principe du contrôle d'accès par rôle

GESTMONEY applique un système de **contrôle d'accès basé sur les rôles (RBAC)**. Chaque utilisateur se voit attribuer un rôle qui détermine les modules auxquels il a accès et les actions qu'il peut réaliser. Cette architecture protège les données sensibles et garantit que chacun ne voit que ce qui est nécessaire à sa mission.

Le filtrage par rôle s'applique à la fois à l'**interface** (modules visibles dans la barre latérale) et aux **données** (via l'API backend). Ce n'est pas qu'un confort d'affichage : la sécurité réelle est appliquée côté serveur.

## Les rôles disponibles

### Super Admin
- Accès total à toutes les fonctionnalités, y compris la **Console SuperAdmin**.
- Gère les licences, les tenants et la configuration système de haut niveau.
- Réservé à l'équipe IBIG Soft et aux administrateurs techniques du déploiement.

### Admin (Administrateur)
- Accès complet aux modules métier : agences, agents, transactions, float, commissions, comptabilité, administration.
- Peut créer et modifier des utilisateurs et définir leurs rôles.
- Idéal pour le **gérant principal** du réseau.

### Superviseur / Manager
- Accès à tous les modules de pilotage (rapports, performances, commissions) et aux modules opérationnels.
- Ne peut pas modifier la configuration système ni les rôles des autres utilisateurs.
- Idéal pour un **responsable réseau** ou un **chef d'agence**.

### Agent
- Accès limité aux modules opérationnels : transactions, float, clients.
- Ne voit que les données liées à son agence et à ses propres opérations.
- Idéal pour les **agents de terrain** qui enregistrent les transactions.

## Attribuer un rôle à un utilisateur

1. Accédez au module **Administration** dans la barre latérale (visible uniquement pour les rôles Admin et supérieur).
2. Ouvrez la liste des utilisateurs.
3. Cliquez sur l'utilisateur à modifier.
4. Sélectionnez le **rôle** souhaité dans la liste déroulante.
5. Enregistrez.

> ⚠️ ATTENTION : Attribuez toujours le **rôle minimal** nécessaire à la mission de l'utilisateur. Évitez de donner des droits Admin à un agent opérationnel — c'est le principe du **moindre privilège**.

## Cas pratiques

- **Un agent voit la comptabilité** → son rôle est trop élevé → redescendez-le au rôle Agent.
- **Un superviseur ne peut pas accéder aux rapports** → vérifiez que son rôle est bien Superviseur et non Agent.
- **Un administrateur a quitté le réseau** → désactivez son compte immédiatement dans Administration.

## Révision périodique des accès

Planifiez une révision des accès **au moins une fois par trimestre** :
1. Listez tous les utilisateurs actifs.
2. Vérifiez que chaque rôle est toujours adapté à la mission actuelle.
3. Désactivez les comptes des personnes ayant quitté le réseau.

> Conseil : ne laissez jamais un compte actif pour une personne qui n'est plus dans l'organisation. Même un compte inactif est un risque de sécurité.`,
  },

  {
    slug: 'journal-audit',
    categorie: 'securite',
    titre: "Utiliser le journal d'audit",
    resume: "Consulter l'historique des actions utilisateurs pour la traçabilité et la conformité.",
    tempsLecture: 3,
    contenu: `## Qu'est-ce que le journal d'audit

Le **journal d'audit** (ou audit log) est un enregistrement chronologique et immuable de toutes les actions significatives réalisées dans GESTMONEY. Chaque entrée indique :

- **Qui** a réalisé l'action (utilisateur, rôle).
- **Quoi** a été fait (création, modification, suppression, connexion…).
- **Quand** (horodatage précis).
- **Sur quoi** (transaction, agent, paramètre modifié…).

Ce journal sert à **détecter les anomalies**, **résoudre les litiges** et **prouver la conformité** en cas de contrôle externe.

## Accéder au journal d'audit

1. Dans la barre latérale, accédez au module **Audit & Alertes** (visible pour les rôles Superviseur et supérieur).
2. La liste des événements s'affiche, du plus récent au plus ancien.

> Note : l'accès au journal d'audit est réservé aux profils autorisés. Les agents opérationnels n'y ont pas accès.

## Lire et interpréter le journal

### Colonnes principales
- **Date/heure** : quand l'action a eu lieu (UTC ou heure locale selon la configuration).
- **Utilisateur** : qui a réalisé l'action.
- **Type d'événement** : connexion, création d'agent, modification de transaction, changement de rôle…
- **Détail** : informations complémentaires sur l'action.

### Filtrer les événements
1. Filtrez par **période** (jour, semaine, mois).
2. Filtrez par **utilisateur** pour voir les actions d'une personne spécifique.
3. Filtrez par **type d'événement** pour cibler un type d'action.

## Cas d'usage pratiques

### Détecter une connexion suspecte
1. Filtrez les événements de type **Connexion**.
2. Repérez les connexions à des horaires inhabituels (nuit, week-end).
3. Vérifiez si l'adresse IP ou l'appareil correspondent à ceux habituellement utilisés.

### Investiguer une transaction contestée
1. Recherchez la transaction par son identifiant dans le journal.
2. Consultez les événements liés : qui l'a créée, si elle a été modifiée, par qui.
3. Le journal prouve l'historique complet de l'opération.

### Vérifier une modification de paramètre
1. Filtrez par **type d'événement** lié à la configuration.
2. Identifiez qui a modifié un barème ou un rôle utilisateur.
3. Contactez la personne pour obtenir une explication si la modification n'était pas attendue.

## Bonnes pratiques

- **Consultez le journal hebdomadairement** pour détecter les anomalies tôt.
- **Exportez régulièrement** le journal pour archivage (utile en cas de contrôle réglementaire).
- **Gardez le journal confidentiel** : il contient des informations sensibles sur les actions de vos équipes.

> Le journal d'audit est votre principale ligne de défense en cas de litige ou de fraude. Sa consultation régulière est une pratique de sécurité fondamentale dans un réseau Mobile Money.`,
  },
];

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Retourne les articles d'une catégorie donnée. */
export function articlesByCategorie(cat: Categorie): GuideArticle[] {
  return GUIDE_ARTICLES.filter((a) => a.categorie === cat);
}

/** Retourne un article par slug, ou undefined. */
export function articleBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.slug === slug);
}

/** Retourne [précédent, suivant] dans l'ordre global des articles. */
export function adjacentArticles(
  slug: string
): [GuideArticle | null, GuideArticle | null] {
  const idx = GUIDE_ARTICLES.findIndex((a) => a.slug === slug);
  if (idx === -1) return [null, null];
  return [
    idx > 0 ? GUIDE_ARTICLES[idx - 1] : null,
    idx < GUIDE_ARTICLES.length - 1 ? GUIDE_ARTICLES[idx + 1] : null,
  ];
}

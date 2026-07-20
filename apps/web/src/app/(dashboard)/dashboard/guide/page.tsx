'use client';
// =============================================================================
// GUIDE UTILISATEUR — GESTMONEY
//
// RÈGLE DE RÉDACTION DE CE FICHIER : on ne documente que ce qui existe et
// fonctionne réellement dans l'application. Chaque bouton, chaque champ et
// chaque onglet cité ici a été vérifié dans le code de la page concernée.
// Ce qui n'est pas disponible est signalé explicitement plutôt que passé sous
// silence — un guide qui décrit un bouton inexistant fait perdre du temps.
// =============================================================================
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, ChevronDown, ChevronRight, Download, PlayCircle,
  Rocket, Compass, ArrowLeftRight, Wallet, Vault, Building2, Users,
  UserRound, Package, Coins, TrendingUp, BarChart3, BookText,
  SlidersHorizontal, ShieldAlert, CreditCard, Bell, Settings, User,
  LifeBuoy, HelpCircle, CheckCircle2, AlertTriangle, Info, Ban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { exporterPdf } from '@/lib/exportPdf';
import { GmPageHeader, GmButton } from '@/components/gm';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  titre: string;
  objectif: string;
  roles: string[];
  contenu: string;
  conseils?: string[];
  avertissements?: string[];
  /** Ce qui n'existe pas encore dans le module — dit franchement. */
  nonDisponible?: string[];
  liensConnexes?: { label: string; href: string }[];
  tags: string[];
}

interface Section {
  id: string;
  titre: string;
  icone: React.ElementType;
  couleur: string;
  description: string;
  articles: Article[];
}

// ─── Contenu ─────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  // ══════════════════════════════════════════════════════════ DÉMARRAGE
  {
    id: 'demarrage',
    titre: 'Bien démarrer',
    icone: Rocket,
    couleur: '#009E00',
    description: "Vos premiers pas, dans l'ordre, sans rien oublier.",
    articles: [
      {
        id: 'a-quoi-sert-gestmoney',
        titre: 'À quoi sert GESTMONEY',
        objectif: "Comprendre ce que la plateforme fait pour votre activité Mobile Money.",
        roles: ['Tous'],
        tags: ['présentation', 'démarrage', 'mobile money'],
        contenu: `<p>GESTMONEY sert à <strong>tenir la comptabilité d'un réseau Mobile Money</strong> : ce que vos agents encaissent, ce que vous devez à chaque opérateur, ce qui reste en caisse, et ce que chacun a gagné.</p>
<p>Concrètement, la plateforme répond à quatre questions que vous vous posez tous les jours :</p>
<ul>
  <li><strong>Combien d'opérations aujourd'hui, et pour quel montant ?</strong> → Transactions, Tableau de bord</li>
  <li><strong>Ai-je encore assez de float chez Orange, Wave, MTN ?</strong> → Gestion Float</li>
  <li><strong>Ma caisse est-elle juste ce soir ?</strong> → Caisse</li>
  <li><strong>Combien dois-je à mes agents ce mois-ci ?</strong> → Commissions</li>
</ul>
<p>Tout le reste (agences, clients, stock, rapports, comptabilité) découle de ces quatre-là.</p>`,
        conseils: [
          "Si vous ne deviez consulter que deux écrans par jour : le Tableau de bord le matin, la Caisse le soir.",
        ],
      },
      {
        id: 'ordre-de-configuration',
        titre: "Dans quel ordre tout configurer",
        objectif: "Éviter de bloquer sur une étape faute d'avoir fait la précédente.",
        roles: ['Administrateur'],
        tags: ['configuration', 'démarrage', 'ordre', 'checklist'],
        contenu: `<p>L'ordre compte : un agent ne peut pas être rattaché à une agence qui n'existe pas encore.</p>
<ol>
  <li><strong>Créez vos agences</strong> (Agences &amp; PDV) — au minimum une, votre point de vente principal.</li>
  <li><strong>Créez vos agents</strong> (Agents) et rattachez-les à leur agence.</li>
  <li><strong>Enregistrez une opération test</strong> (Transactions) pour vérifier que tout circule.</li>
  <li><strong>Vérifiez le float</strong> (Gestion Float) et notez vos seuils d'alerte.</li>
  <li><strong>Contrôlez les commissions</strong> (Commissions) après quelques jours d'activité.</li>
</ol>
<p>Le <strong>Guide de démarrage</strong> affiché en haut du tableau de bord (pour les comptes administrateur) reprend cette liste sous forme de cases à cocher. Vous cochez vous-même chaque ligne quand elle est faite — ce n'est pas détecté automatiquement.</p>`,
        avertissements: [
          "Les cases du Guide de démarrage sont enregistrées dans votre navigateur, pas sur le serveur : elles ne suivent pas si vous changez d'appareil.",
        ],
        liensConnexes: [
          { label: 'Agences & PDV', href: '/dashboard/agences' },
          { label: 'Agents', href: '/dashboard/agents' },
        ],
      },
      {
        id: 'roles-et-acces',
        titre: 'Qui voit quoi : les rôles',
        objectif: "Comprendre pourquoi un collègue ne voit pas le même menu que vous.",
        roles: ['Tous'],
        tags: ['rôle', 'accès', 'permissions', 'menu'],
        contenu: `<p>Le menu de gauche s'adapte à votre rôle. Si une page dont on vous parle n'apparaît pas chez vous, c'est normal : votre compte n'y a pas accès.</p>
<ul>
  <li><strong>Administrateur / Super admin</strong> — tout, y compris Administration, Comptabilité et Audit.</li>
  <li><strong>Superviseur / Gérant</strong> — son réseau : transactions, agents, agences, rapports, paramètres.</li>
  <li><strong>Agent</strong> — l'essentiel du terrain : transactions, float, caisse, clients.</li>
  <li><strong>Auditeur</strong> — consultation : opérations et journal d'audit.</li>
</ul>
<p>Le filtrage du menu est un confort d'affichage. La vraie barrière est côté serveur : même en tapant l'adresse d'une page à la main, un compte non autorisé se voit refuser les données.</p>`,
        conseils: [
          "Le tableau de bord lui aussi change de contenu selon le rôle : un agent y voit « Mes transactions », un administrateur voit tout le réseau.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ NAVIGATION
  {
    id: 'navigation',
    titre: "Se repérer dans l'application",
    icone: Compass,
    couleur: '#3B82F6',
    description: 'Le menu, la barre du haut, et le téléphone.',
    articles: [
      {
        id: 'menu-gauche',
        titre: 'Le menu de gauche',
        objectif: 'Trouver rapidement le bon module.',
        roles: ['Tous'],
        tags: ['menu', 'sidebar', 'navigation', 'badge'],
        contenu: `<p>Les modules sont regroupés en quatre familles :</p>
<ul>
  <li><strong>Principal</strong> — Tableau de bord, Transactions, Gestion Float, Caisse</li>
  <li><strong>Réseau</strong> — Agences &amp; PDV, Agents, Clients, Stock</li>
  <li><strong>Finance &amp; Analyse</strong> — Commissions, Performances, Rapports &amp; BI, Comptabilité</li>
  <li><strong>Administration</strong> — Notifications, Administration, Audit &amp; Alertes, Paramètres, Abonnement, Mon profil, Support, Centre d'aide</li>
</ul>
<h4>Les pastilles de couleur</h4>
<p>Trois entrées seulement portent un compteur, et il se met à jour tout seul :</p>
<ul>
  <li><strong>Transactions</strong> — nombre d'opérations en attente de validation</li>
  <li><strong>Gestion Float</strong> — nombre d'alertes de solde en cours</li>
  <li><strong>Notifications</strong> — messages non lus (pastille rouge)</li>
</ul>
<p>Sur ordinateur, le bouton en bas du menu le réduit en colonne d'icônes ; ce choix est mémorisé.</p>`,
      },
      {
        id: 'mobile',
        titre: "Utiliser GESTMONEY sur téléphone",
        objectif: 'Travailler depuis le terrain, sans ordinateur.',
        roles: ['Tous'],
        tags: ['mobile', 'téléphone', 'terrain'],
        contenu: `<p>Sur téléphone, l'affichage se réorganise :</p>
<ul>
  <li>Le menu de gauche disparaît — ouvrez-le avec le <strong>bouton menu en haut à gauche</strong>.</li>
  <li>Une <strong>barre de navigation en bas de l'écran</strong> donne accès aux écrans les plus utilisés.</li>
  <li>Les tableaux <strong>défilent horizontalement</strong> : faites glisser le doigt pour voir les dernières colonnes (Statut, Actions).</li>
</ul>`,
        conseils: [
          "Sur un tableau, si vous ne voyez pas la colonne « Actions », faites glisser le tableau vers la gauche.",
        ],
      },
      {
        id: 'barre-du-haut',
        titre: 'La barre du haut',
        objectif: 'Notifications, langue, thème et compte.',
        roles: ['Tous'],
        tags: ['topbar', 'notifications', 'langue', 'thème'],
        contenu: `<p>De gauche à droite : le logo (retour au tableau de bord), la date du jour, le choix de langue <strong>français / anglais</strong>, le basculement <strong>clair / sombre</strong>, la <strong>cloche des notifications</strong> avec son compteur rouge, puis votre <strong>avatar</strong>.</p>
<p>L'avatar ouvre le menu de votre compte : accès au profil et déconnexion.</p>`,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ TABLEAU DE BORD
  {
    id: 'tableau-de-bord',
    titre: 'Tableau de bord',
    icone: BookOpen,
    couleur: '#009E00',
    description: "L'écran d'accueil, différent selon votre rôle.",
    articles: [
      {
        id: 'lire-le-tableau-de-bord',
        titre: 'Lire son tableau de bord',
        objectif: "Comprendre les chiffres affichés à l'ouverture.",
        roles: ['Tous'],
        tags: ['tableau de bord', 'kpi', 'accueil'],
        contenu: `<p>L'écran vous accueille par votre prénom et rappelle l'heure de la dernière mise à jour. Les cartes affichées dépendent de votre rôle :</p>
<ul>
  <li><strong>Administrateur</strong> — Transactions, Volume du jour, Agents, Agences, Commissions, Float opérateurs, Alertes</li>
  <li><strong>Gérant</strong> — Transactions agence, Volume agence, Mon équipe, Alerte float</li>
  <li><strong>Agent</strong> — Mes transactions, Mon float, Ma commission</li>
  <li><strong>Auditeur</strong> — Opérations auditées, Transactions du jour, Volume du jour</li>
</ul>
<h4>Les trois boutons en haut</h4>
<ol>
  <li><strong>🔄 Actualiser</strong> — recharge les chiffres sans recharger la page</li>
  <li><strong>+ Nouvelle transaction</strong> — raccourci vers la saisie d'une opération</li>
  <li><strong>📊 Rapports</strong> — ouvre Rapports &amp; BI</li>
</ol>`,
        avertissements: [
          "Si le sous-titre indique « données de démonstration », le serveur n'a pas répondu : les chiffres affichés sont des exemples, pas votre activité réelle. Actualisez, et prévenez le support si cela persiste.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ TRANSACTIONS
  {
    id: 'transactions',
    titre: 'Transactions',
    icone: ArrowLeftRight,
    couleur: '#009E00',
    description: 'Le journal de toutes vos opérations Mobile Money.',
    articles: [
      {
        id: 'enregistrer-transaction',
        titre: 'Enregistrer une opération',
        objectif: 'Saisir un dépôt, un retrait, un cash in ou un cash out.',
        roles: ['Agent', 'Gérant', 'Administrateur'],
        tags: ['transaction', 'dépôt', 'retrait', 'cash in', 'cash out', 'saisie'],
        contenu: `<p>Quatre boutons en haut de la page ouvrent directement le bon formulaire : <strong>+ Dépôt</strong>, <strong>+ Retrait</strong>, <strong>+ Cash In</strong>, <strong>+ Cash Out</strong>. Le type est donc choisi avant même d'ouvrir la fenêtre.</p>
<ol>
  <li>Cliquez sur le bouton correspondant au type d'opération.</li>
  <li>Choisissez l'<strong>opérateur</strong> — obligatoire.</li>
  <li>Saisissez le <strong>montant en FCFA</strong> — obligatoire, et strictement supérieur à zéro.</li>
  <li><strong>Téléphone client</strong> et <strong>Nom client</strong> — facultatifs, mais très utiles pour retrouver l'opération plus tard.</li>
  <li>Cliquez sur <strong>Valider la transaction</strong>.</li>
</ol>
<p>L'opération apparaît immédiatement en tête de la liste.</p>`,
        avertissements: [
          "Un montant à zéro ou négatif est refusé avec le message « Montant invalide ».",
        ],
        conseils: [
          "Renseignez le numéro du client même quand ce n'est pas obligatoire : c'est le seul moyen fiable de retrouver une opération contestée deux semaines plus tard.",
        ],
        liensConnexes: [{ label: 'Ouvrir les transactions', href: '/dashboard/transactions' }],
      },
      {
        id: 'statuts-transaction',
        titre: 'Les quatre statuts, et quoi faire',
        objectif: "Savoir réagir selon l'état d'une opération.",
        roles: ['Tous'],
        tags: ['statut', 'en attente', 'succès', 'échoué', 'annulé', 'valider'],
        contenu: `<table>
  <thead><tr><th>Statut</th><th>Ce que ça veut dire</th><th>Ce que vous faites</th></tr></thead>
  <tbody>
    <tr><td><strong>Succès</strong></td><td>L'opération est passée</td><td>Rien</td></tr>
    <tr><td><strong>En attente</strong></td><td>Pas encore confirmée</td><td>Un gérant peut la valider depuis la colonne Actions (bouton ✓)</td></tr>
    <tr><td><strong>Échoué</strong></td><td>L'opération n'est pas passée</td><td>Vérifier auprès de l'opérateur, puis ressaisir si nécessaire</td></tr>
    <tr><td><strong>Annulé</strong></td><td>Opération abandonnée</td><td>Rien — elle reste au journal pour la traçabilité</td></tr>
  </tbody>
</table>
<p>Le bouton de validation (✓) n'apparaît que sur les lignes <strong>En attente</strong>. Il apparaît aussi dans la fenêtre de détail, que l'on ouvre avec l'icône 👁.</p>`,
        nonDisponible: [
          "Une transaction ne se modifie pas et ne se supprime pas après saisie : c'est volontaire, un journal comptable ne se réécrit pas. En cas d'erreur, saisissez l'opération de correction.",
        ],
      },
      {
        id: 'filtrer-exporter-transactions',
        titre: 'Filtrer, trier et exporter',
        objectif: 'Retrouver une opération précise et sortir le journal.',
        roles: ['Tous'],
        tags: ['filtre', 'export', 'csv', 'recherche', 'tri'],
        contenu: `<h4>Les filtres disponibles</h4>
<ul>
  <li><strong>Date début</strong> et <strong>Date fin</strong></li>
  <li><strong>Type</strong> — Dépôt, Retrait, Cash In, Cash Out, Transfert, Paiement</li>
  <li><strong>Opérateur</strong></li>
  <li><strong>Statut</strong> — Succès, En attente, Échoué, Annulé</li>
  <li><strong>Recherche</strong> — par référence, agent ou client</li>
</ul>
<p>Le bouton <strong>Réinitialiser</strong> efface tous les filtres d'un coup. Les colonnes du tableau se trient en cliquant sur leur en-tête.</p>
<h4>Export</h4>
<p>Le bouton <strong>📥 Exporter CSV</strong> sort la liste au format tableur, lisible dans Excel comme dans LibreOffice.</p>`,
        avertissements: [
          "L'export reprend les transactions actuellement chargées à l'écran : appliquez d'abord vos filtres, et vérifiez le nombre de lignes obtenu avant de transmettre le fichier.",
        ],
        nonDisponible: [
          "Sur cette page, seul le CSV est proposé. Pour un PDF ou un Excel mis en forme, passez par Rapports & BI.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ FLOAT
  {
    id: 'float',
    titre: 'Gestion Float',
    icone: Wallet,
    couleur: '#F59E0B',
    description: 'Vos soldes chez chaque opérateur, et leur réapprovisionnement.',
    articles: [
      {
        id: 'comprendre-float',
        titre: 'Comprendre le float',
        objectif: "Savoir ce que représentent les jauges de couleur.",
        roles: ['Tous'],
        tags: ['float', 'solde', 'liquidité', 'seuil'],
        contenu: `<p>Le <strong>float</strong>, c'est l'argent électronique que vous détenez chez un opérateur. C'est lui qui limite ce que vous pouvez servir : sans float Orange, vous ne pouvez plus faire de retrait Orange, même si votre caisse est pleine de billets.</p>
<p>Chaque opérateur a sa carte, avec une jauge et un état :</p>
<ul>
  <li><strong>✓ OK</strong> — solde confortable</li>
  <li><strong>⚡ Faible</strong> — anticipez le réapprovisionnement</li>
  <li><strong>⚠ Critique</strong> — sous le seuil, un bandeau d'alerte s'affiche en haut de page</li>
</ul>
<p>La page indique aussi l'heure de la dernière mise à jour, juste sous le titre.</p>`,
        conseils: [
          "Float et caisse sont les deux faces d'une même pièce : un retrait client fait baisser votre caisse en espèces et monter votre float. Un dépôt fait l'inverse.",
        ],
      },
      {
        id: 'demander-reapprovisionnement',
        titre: 'Demander un réapprovisionnement',
        objectif: 'Faire remonter un besoin de float avant la rupture.',
        roles: ['Agent', 'Gérant', 'Administrateur'],
        tags: ['réapprovisionnement', 'float', 'demande'],
        contenu: `<ol>
  <li>Cliquez sur <strong>+ Réapprovisionnement</strong> en haut de page, ou sur <strong>+ Réapprovisionner</strong> directement sur la carte de l'opérateur concerné.</li>
  <li>Choisissez l'<strong>opérateur</strong> (déjà pré-rempli si vous êtes parti de sa carte).</li>
  <li>Saisissez le <strong>montant en XOF</strong> — obligatoire.</li>
  <li>Ajoutez un <strong>commentaire</strong> si le contexte le mérite (facultatif).</li>
  <li><strong>Envoyer la demande</strong>.</li>
</ol>
<p>La demande apparaît dans la section <strong>🔄 Demandes en cours</strong> et suit quatre états : <strong>⏳ En attente</strong>, <strong>↻ Approuvé</strong>, <strong>✓ Complété</strong>, <strong>✕ Rejeté</strong>.</p>
<p>La section <strong>📋 Mouvements du jour</strong> retrace chaque entrée et sortie de float avec l'heure, le montant, l'agent et le solde qui en résulte.</p>`,
        avertissements: [
          "Envoyer la demande ne crédite pas le float. Elle doit être approuvée puis réellement exécutée chez l'opérateur : tant que le statut n'est pas « Complété », l'argent n'est pas là.",
        ],
        nonDisponible: [
          "Les seuils d'alerte affichés en bas de page sont en lecture seule : ils se consultent mais ne se modifient pas depuis cette page.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ CAISSE
  {
    id: 'caisse',
    titre: 'Caisse',
    icone: Vault,
    couleur: '#10B981',
    description: 'Le journal des espèces et le contrôle de fin de journée.',
    articles: [
      {
        id: 'controle-caisse',
        titre: 'Faire son contrôle de caisse du soir',
        objectif: "Vérifier que l'argent physique correspond au journal.",
        roles: ['Agent', 'Gérant', 'Administrateur'],
        tags: ['caisse', 'écart', 'contrôle', 'fermeture', 'journal'],
        contenu: `<p>Quatre chiffres résument votre journée : <strong>Solde actuel</strong>, <strong>Entrées du jour</strong>, <strong>Sorties du jour</strong> et <strong>Écart</strong>.</p>
<p>L'écart est le chiffre à surveiller. Sous lui s'affiche une mention claire : <strong>Caisse équilibrée</strong>, <strong>Excédent</strong> ou <strong>Déficit</strong>.</p>
<h4>La routine du soir</h4>
<ol>
  <li>Cliquez sur <strong>Actualiser</strong> pour être sûr d'avoir tout.</li>
  <li>Comptez physiquement votre caisse.</li>
  <li>Comparez avec le <strong>Solde actuel</strong> affiché.</li>
  <li>Si les deux collent : c'est fini.</li>
  <li>Sinon, remontez le <strong>Journal de caisse</strong> ligne par ligne — la colonne « Solde après » vous montre à quel mouvement l'écart est né.</li>
</ol>`,
        conseils: [
          "Un déficit récurrent au même moment de la journée est rarement un vol : c'est presque toujours une opération saisie deux fois, ou pas saisie du tout.",
        ],
      },
      {
        id: 'ecriture-manuelle-caisse',
        titre: 'Passer une écriture manuelle',
        objectif: "Enregistrer un mouvement d'espèces qui ne vient pas d'une transaction.",
        roles: ['Agent', 'Gérant', 'Administrateur'],
        tags: ['écriture', 'manuelle', 'entrée', 'sortie', 'caisse'],
        contenu: `<p>Toutes les espèces qui bougent ne viennent pas d'une opération Mobile Money : approvisionnement du matin, frais de transport, achat de crédit… Ces mouvements se saisissent à la main.</p>
<ol>
  <li>Cliquez sur <strong>Écriture manuelle</strong>.</li>
  <li>Choisissez le <strong>Type</strong> : Entrée ou Sortie — obligatoire.</li>
  <li>Saisissez le <strong>Libellé</strong> — obligatoire, et c'est lui que vous relirez dans trois mois : soyez précis.</li>
  <li>Saisissez le <strong>Montant en FCFA</strong> — obligatoire.</li>
  <li>Choisissez une <strong>Catégorie</strong> : Dépôt, Retrait, Cash In, Cash Out, Réapprovisionnement, Commission, Approvisionnement ou Frais.</li>
  <li><strong>Enregistrer</strong>.</li>
</ol>`,
        avertissements: [
          "Ne passez pas d'écriture manuelle pour compenser un écart que vous n'expliquez pas : vous feriez disparaître le symptôme sans corriger la cause, et l'écart reviendra.",
        ],
        nonDisponible: [
          "Le bouton « Exporter » de la page Caisse n'est pas encore branché : il ne produit aucun fichier. Pour sortir vos mouvements, passez par Comptabilité ou Rapports & BI.",
          "Aucun filtre ni recherche sur le journal de caisse : il affiche la journée en cours.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ AGENCES
  {
    id: 'agences',
    titre: 'Agences & PDV',
    icone: Building2,
    couleur: '#EC4899',
    description: 'Vos points de vente et la couverture de votre réseau.',
    articles: [
      {
        id: 'creer-agence',
        titre: 'Créer une agence',
        objectif: 'Ouvrir un nouveau point de vente dans le système.',
        roles: ['Gérant', 'Administrateur'],
        tags: ['agence', 'point de vente', 'création', 'réseau'],
        contenu: `<ol>
  <li>Cliquez sur <strong>+ Nouvelle agence</strong>.</li>
  <li><strong>Nom de l'agence</strong> — obligatoire.</li>
  <li><strong>Code</strong> — obligatoire. C'est l'identifiant court que vous utiliserez partout ailleurs ; choisissez-le lisible et définitif (ex. <code>ABJ-TREICH-01</code>).</li>
  <li><strong>Ville</strong> — obligatoire.</li>
  <li><strong>Téléphone</strong>, <strong>Adresse</strong>, <strong>Responsable</strong> — facultatifs.</li>
  <li><strong>Créer l'agence</strong>.</li>
</ol>
<p>La page affiche ensuite vos agences sous forme de cartes, avec pour chacune le nombre d'agents, combien sont en ligne, le code et l'horaire d'ouverture. En haut : Agences actives, Agents au total, Villes couvertes, Agences inactives.</p>`,
        conseils: [
          "Le champ de recherche accepte le nom, la ville ou le code : sur un grand réseau, chercher par code est le plus rapide.",
        ],
      },
      {
        id: 'desactiver-agence',
        titre: 'Fermer une agence sans perdre son historique',
        objectif: "Retirer un point de vente du réseau actif.",
        roles: ['Gérant', 'Administrateur'],
        tags: ['désactiver', 'fermeture', 'agence'],
        contenu: `<p>Sur la carte de l'agence, le bouton <strong>⏸️ Désactiver</strong> la sort du réseau actif. Elle n'est pas supprimée : ses transactions passées restent au journal et dans vos rapports. Le bouton <strong>▶️ Activer</strong> fait le chemin inverse.</p>`,
        nonDisponible: [
          "Le bouton « 👁️ Voir détails » d'une carte agence n'ouvre encore aucune fiche détaillée.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ AGENTS
  {
    id: 'agents',
    titre: 'Agents',
    icone: Users,
    couleur: '#3B82F6',
    description: 'Les comptes de vos agents et leur activité du jour.',
    articles: [
      {
        id: 'creer-agent',
        titre: 'Créer un compte agent',
        objectif: "Donner un accès à un nouveau membre de l'équipe.",
        roles: ['Gérant', 'Administrateur'],
        tags: ['agent', 'création', 'compte', 'mot de passe'],
        contenu: `<ol>
  <li>Cliquez sur <strong>+ Créer un agent</strong>.</li>
  <li><strong>Prénom</strong>, <strong>Nom</strong>, <strong>Email</strong>, <strong>Téléphone</strong> — obligatoires.</li>
  <li><strong>Agence</strong> — à choisir dans la liste de vos agences existantes.</li>
  <li><strong>Mot de passe temporaire</strong> — c'est vous qui le définissez, et c'est vous qui devez le transmettre à l'agent.</li>
  <li><strong>✅ Créer l'agent</strong>.</li>
</ol>`,
        avertissements: [
          "Le mot de passe temporaire n'est envoyé nulle part automatiquement. Notez-le au moment de la création et remettez-le à l'agent de vive voix : vous ne pourrez pas le relire ensuite.",
          "Créez l'agence AVANT l'agent, sinon la liste des agences sera vide au moment de le rattacher.",
        ],
      },
      {
        id: 'suivre-agents',
        titre: 'Suivre et suspendre un agent',
        objectif: "Voir l'activité du jour et couper un accès si nécessaire.",
        roles: ['Gérant', 'Administrateur', 'Superviseur'],
        tags: ['performance', 'suspendre', 'activité', 'présence'],
        contenu: `<p>Le tableau donne, agent par agent : téléphone, agence, <strong>transactions du jour</strong>, <strong>volume du jour</strong>, <strong>commission</strong>, présence, statut et date d'inscription. Les colonnes Agent, Agence, Transactions et Volume se trient en cliquant sur leur en-tête.</p>
<h4>Filtres</h4>
<ul>
  <li><strong>Agence</strong></li>
  <li><strong>Statut</strong> — Actifs, Inactifs, En ligne</li>
  <li><strong>Recherche</strong> — nom, email ou téléphone</li>
</ul>
<p>Dans la colonne Actions, <strong>🚫 Suspendre</strong> coupe immédiatement l'accès d'un agent ; <strong>✅ Activer</strong> le rétablit.</p>`,
        avertissements: [
          "Les chiffres du tableau portent sur la JOURNÉE EN COURS. Pour juger un agent sur le mois, allez dans Performances ou Rapports & BI.",
        ],
        nonDisponible: [
          "Le bouton « 👁️ Voir » d'une ligne agent n'ouvre pas encore de fiche individuelle.",
          "Il n'existe pas de réinitialisation de mot de passe agent depuis cette page.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ CLIENTS
  {
    id: 'clients',
    titre: 'Clients',
    icone: UserRound,
    couleur: '#6366F1',
    description: 'Votre base clients et le suivi KYC.',
    articles: [
      {
        id: 'gerer-clients',
        titre: 'Enregistrer et retrouver un client',
        objectif: 'Tenir une base clients propre.',
        roles: ['Agent', 'Gérant', 'Administrateur'],
        tags: ['client', 'kyc', 'base', 'enregistrement'],
        contenu: `<p>Le sous-titre de la page résume la situation : nombre de clients enregistrés, combien sont actifs, et combien ont un <strong>KYC en attente</strong>.</p>
<h4>Créer un client</h4>
<ol>
  <li><strong>Nouveau client</strong>.</li>
  <li><strong>Prénom</strong>, <strong>Nom</strong>, <strong>Téléphone</strong> — obligatoires.</li>
  <li><strong>Email</strong> et <strong>Ville</strong> — facultatifs.</li>
  <li><strong>Enregistrer le client</strong>.</li>
</ol>
<h4>Retrouver un client</h4>
<p>Recherche par nom, téléphone ou email, plus deux filtres : <strong>statut</strong> (Actifs, Inactifs, Bloqués) et <strong>KYC</strong> (Vérifiés, En attente, Rejetés).</p>
<p>Le tableau affiche pour chacun : ville, opérateur, solde wallet, nombre de transactions, volume total, KYC, statut et date d'inscription.</p>`,
        nonDisponible: [
          "Les boutons « Voir » et « Vérifier KYC » de la colonne Actions ne sont pas encore branchés : le statut KYC se consulte mais ne se change pas depuis cette page.",
        ],
        conseils: [
          "Un même client saisi deux fois avec deux orthographes différentes fausse ses totaux : cherchez toujours par téléphone avant de créer une fiche.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ STOCK
  {
    id: 'stock',
    titre: 'Stock',
    icone: Package,
    couleur: '#F97316',
    description: 'SIM, terminaux, accessoires et consommables.',
    articles: [
      {
        id: 'mouvements-stock',
        titre: 'Enregistrer une entrée ou une sortie de stock',
        objectif: 'Tenir un inventaire juste par agence.',
        roles: ['Gérant', 'Administrateur'],
        tags: ['stock', 'inventaire', 'sim', 'entrée', 'sortie'],
        contenu: `<p>Quatre chiffres en haut : produits au catalogue, unités en stock, alertes de stock bas et valorisation totale.</p>
<h4>Saisir un mouvement</h4>
<ol>
  <li><strong>📥 Entrée stock</strong> ou <strong>📤 Sortie stock</strong> (ou les mêmes boutons sur la ligne du produit).</li>
  <li><strong>Produit</strong> — obligatoire, à choisir dans le catalogue.</li>
  <li><strong>Agence</strong> — obligatoire, à saisir à la main : c'est l'identifiant de l'agence.</li>
  <li><strong>Quantité</strong> — obligatoire, au moins 1.</li>
  <li><strong>Motif</strong> — obligatoire : Achat / réception, Vente, Retour, Casse / dommage, Vol / perte, Transfert ou Ajustement inventaire.</li>
  <li><strong>Référence</strong> et <strong>Notes</strong> — facultatifs.</li>
  <li><strong>Valider le mouvement</strong>.</li>
</ol>
<p>Le statut de chaque produit se calcule tout seul par rapport à son seuil : <strong>● OK</strong>, <strong>⚠️ Bas</strong>, <strong>🔴 Critique</strong>.</p>`,
        avertissements: [
          "Le champ « Agence » attend l'IDENTIFIANT de l'agence, pas son nom en clair. Récupérez-le sur la fiche de l'agence avant de saisir.",
          "Les boutons d'entrée et de sortie restent inactifs tant qu'aucun produit n'existe au catalogue. La sortie est bloquée si la quantité disponible est à zéro.",
        ],
        nonDisponible: [
          "Aucun filtre ni recherche sur cette page : ni par catégorie, ni par agence.",
          "Le catalogue produits ne se crée pas depuis cette page.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ COMMISSIONS
  {
    id: 'commissions',
    titre: 'Commissions',
    icone: Coins,
    couleur: '#10B981',
    description: 'Valider et payer ce que vous devez à vos agents.',
    articles: [
      {
        id: 'valider-payer-commissions',
        titre: 'Valider puis payer les commissions',
        objectif: 'Traiter la paie des agents sans se tromper.',
        roles: ['Gérant', 'Administrateur'],
        tags: ['commission', 'paiement', 'validation', 'agent'],
        contenu: `<p>Une commission passe par deux étapes, dans cet ordre : <strong>calculée → validée → payée</strong>. Le bouton proposé sur chaque ligne dépend de là où elle en est.</p>
<ol>
  <li>Choisissez la <strong>période</strong> dans la liste déroulante.</li>
  <li>Cochez les lignes concernées, ou utilisez <strong>☑️ Tout sélectionner</strong>.</li>
  <li>Cliquez sur <strong>✅ Valider</strong> pour les commissions calculées.</li>
  <li>Puis sur <strong>💳 Payer</strong> pour celles qui sont validées.</li>
  <li>Une fenêtre récapitule le nombre de lignes et le <strong>montant total</strong>. Relisez-le, puis <strong>✅ Confirmer</strong>.</li>
</ol>
<h4>Les trois onglets</h4>
<ul>
  <li><strong>💰 Commissions agents</strong> — le travail du mois</li>
  <li><strong>📅 Historique paiements</strong> — ce qui a déjà été réglé</li>
  <li><strong>🎯 Objectifs</strong> — avancement des paiements, commission la plus élevée, répartition par statut</li>
</ul>
<p>Le bouton <strong>📥 Exporter CSV</strong> sort la liste pour votre comptable.</p>`,
        avertissements: [
          "Le récapitulatif avant confirmation est votre dernier filet : lisez le montant total à voix haute avant de confirmer un paiement groupé.",
          "Si un bandeau « Données de démonstration » s'affiche, le service des commissions est injoignable — ne validez ni ne payez rien tant qu'il est là.",
        ],
        nonDisponible: [
          "Les taux et barèmes de commission ne se configurent pas depuis cette page.",
          "La liste des périodes est figée sur des mois de 2024 : elle n'est pas encore alimentée par vos exercices réels.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ PERFORMANCES
  {
    id: 'performances',
    titre: 'Performances',
    icone: TrendingUp,
    couleur: '#8B5CF6',
    description: 'Le classement de vos agents et vos indicateurs clés.',
    articles: [
      {
        id: 'lire-performances',
        titre: 'Lire la page Performances',
        objectif: 'Comparer ses agents et suivre ses objectifs.',
        roles: ['Gérant', 'Administrateur', 'Superviseur'],
        tags: ['performance', 'classement', 'objectif', 'taux de succès'],
        contenu: `<p>Quatre indicateurs en haut : <strong>Volume total</strong>, <strong>Nombre de transactions</strong>, <strong>Taux de succès</strong> et <strong>Ticket moyen</strong> (le montant moyen d'une opération).</p>
<p>Un sélecteur de période propose <strong>Cette semaine</strong>, <strong>Ce mois</strong> ou <strong>Ce trimestre</strong>.</p>
<p>En dessous : l'évolution des volumes, la performance par opérateur, le <strong>classement des agents</strong> (rang, volume, transactions, taux de succès, évolution), et trois cartes d'objectifs.</p>`,
        avertissements: [
          "Le graphique d'évolution affiche les 7 derniers jours quelle que soit la période choisie dans le sélecteur. Ne l'interprétez pas comme un graphique trimestriel.",
          "L'objectif de taux de succès affiché (95 %) est une valeur de référence fixe, pas un objectif que vous auriez paramétré.",
        ],
        nonDisponible: [
          "Aucun export sur cette page. Pour transmettre ces chiffres, passez par Rapports & BI.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ RAPPORTS
  {
    id: 'rapports',
    titre: 'Rapports & BI',
    icone: BarChart3,
    couleur: '#EC4899',
    description: 'Générer et transmettre vos chiffres consolidés.',
    articles: [
      {
        id: 'generer-rapport',
        titre: 'Générer un rapport',
        objectif: 'Produire un document à transmettre.',
        roles: ['Gérant', 'Administrateur', 'Auditeur'],
        tags: ['rapport', 'génération', 'bi', 'kpi'],
        contenu: `<ol>
  <li>Cliquez sur <strong>📊 Générer rapport</strong>.</li>
  <li>Choisissez le <strong>type</strong> : journalier, hebdomadaire ou mensuel.</li>
  <li>Choisissez la <strong>période</strong>.</li>
  <li>Validez — le rapport apparaît dans la liste <strong>Rapports générés</strong>.</li>
</ol>
<p>La page affiche aussi quatre indicateurs (chiffre d'affaires, transactions, nouveaux clients, ticket moyen) et un <strong>Aperçu rapide</strong> : répartition par opérateur, top agents, progression vers l'objectif.</p>`,
      },
      {
        id: 'exporter-rapport',
        titre: 'Exporter en CSV, XLSX ou PDF',
        objectif: 'Récupérer le fichier au bon format.',
        roles: ['Gérant', 'Administrateur', 'Auditeur'],
        tags: ['export', 'pdf', 'xlsx', 'csv'],
        contenu: `<p>Sur chaque ligne de la liste <strong>Rapports générés</strong>, trois boutons apparaissent une fois le rapport <em>disponible</em> : <strong>📥 CSV</strong>, <strong>📊 XLSX</strong> et <strong>📄 PDF</strong>.</p>
<p>Le bouton <strong>📄 Exporter PDF</strong> en haut de page produit une vue d'ensemble de la page courante.</p>
<p>Une recherche et un filtre par type (journalier / hebdomadaire / mensuel) permettent de retrouver un rapport ancien.</p>`,
        avertissements: [
          "Les exports CSV et XLSX d'une ligne contiennent la RÉPARTITION PAR OPÉRATEUR du rapport (opérateur, montant, part en %), et non le détail des transactions. Pour le détail ligne à ligne, exportez depuis la page Transactions.",
          "Le sélecteur de période en haut de page propose des libellés figés (Janvier 2024, Décembre 2023, T4 2023) : ils ne correspondent pas à votre exercice en cours.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ COMPTABILITÉ
  {
    id: 'comptabilite',
    titre: 'Comptabilité SYSCOHADA',
    icone: BookText,
    couleur: '#6366F1',
    description: 'Vos états comptables, générés depuis vos opérations.',
    articles: [
      {
        id: 'lire-comptabilite',
        titre: 'Les cinq onglets de la comptabilité',
        objectif: 'Savoir où trouver quel état.',
        roles: ['Administrateur', 'Comptable', 'Gérant'],
        tags: ['comptabilité', 'syscohada', 'bilan', 'balance', 'grand livre'],
        contenu: `<p>Les écritures sont produites automatiquement à partir de vos opérations, dans le <strong>plan comptable SYSCOHADA</strong>. Vous choisissez d'abord votre <strong>exercice fiscal</strong> en haut de page.</p>
<p>Quatre indicateurs : <strong>Produits (classe 7)</strong>, <strong>Charges (classe 6)</strong>, <strong>Résultat net</strong> et <strong>Trésorerie (classe 5)</strong>.</p>
<ul>
  <li><strong>Grand Livre</strong> — chaque écriture : date, référence, compte, libellé, débit, crédit. Un repère indique si l'écriture est <em>Auto</em> (issue d'une opération) ou <em>Manuelle</em>.</li>
  <li><strong>Balance</strong> — un récapitulatif par compte, avec la ligne TOTAUX. Un bandeau confirme si la balance est <strong>équilibrée</strong> ou non.</li>
  <li><strong>Compte de Résultat</strong> — produits face aux charges, et le résultat net de l'exercice.</li>
  <li><strong>Bilan</strong> — ACTIF (immobilisations, stocks, créances, trésorerie) face au PASSIF (capitaux propres, dettes).</li>
  <li><strong>Plan comptable</strong> — la liste des comptes utilisés, avec leur sens normal.</li>
</ul>`,
        conseils: [
          "Si la balance s'affiche déséquilibrée, ne cherchez pas dans le bilan : ouvrez le Grand Livre et remontez les écritures les plus récentes.",
        ],
        avertissements: [
          "Le message « Données comptables indisponibles » signifie que le service ne répond pas. Aucun chiffre de secours n'est inventé ici — c'est voulu.",
        ],
        nonDisponible: [
          "Aucun export sur cette page, et aucune saisie d'écriture manuelle depuis l'interface.",
          "Le TAFIRE, le tableau des flux de trésorerie, les annexes et la clôture d'exercice ne sont pas encore disponibles.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ ADMINISTRATION
  {
    id: 'administration',
    titre: 'Administration',
    icone: SlidersHorizontal,
    couleur: '#64748B',
    description: 'Utilisateurs, rôles et journal des actions.',
    articles: [
      {
        id: 'administration-utilisateurs',
        titre: 'Utilisateurs, rôles et journal',
        objectif: 'Vérifier qui a accès à quoi, et ce qui a été fait.',
        roles: ['Administrateur'],
        tags: ['administration', 'utilisateurs', 'rôles', 'audit', 'export'],
        contenu: `<p>La page est réservée aux rôles d'administration. Un autre rôle y verra la mention <em>Accès restreint</em> et une page vide.</p>
<p>Quatre chiffres en haut : utilisateurs au total, rôles configurés, actions auditées sur 24 h, alertes d'audit.</p>
<ul>
  <li><strong>👥 Utilisateurs</strong> — qui, quel rôle, dernière connexion, statut</li>
  <li><strong>🔐 Rôles &amp; permissions</strong> — une carte par rôle, avec le nombre d'utilisateurs et la liste de ses permissions</li>
  <li><strong>📋 Journal d'audit récent</strong> — date, action, ressource, utilisateur, adresse IP</li>
  <li><strong>🚨 Alertes de sécurité</strong> — cette section n'apparaît que s'il y a réellement quelque chose à signaler</li>
</ul>
<p>Les boutons <strong>📥 Exporter audit</strong> et <strong>📥 Exporter CSV</strong> produisent le même fichier : le journal d'audit au format CSV.</p>`,
        nonDisponible: [
          "Le seul format d'export proposé est le CSV.",
          "Pas de suivi de santé système, de latences ni de charge serveur : ces informations n'ont pas de source réelle et n'ont donc pas été affichées.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ AUDIT
  {
    id: 'audit',
    titre: 'Audit & Alertes',
    icone: ShieldAlert,
    couleur: '#EF4444',
    description: "Ce que la page signale — et ce qu'elle ne dit pas.",
    articles: [
      {
        id: 'comprendre-alertes-audit',
        titre: "Ce qu'une alerte veut dire (et ne veut pas dire)",
        objectif: 'Interpréter correctement un signalement.',
        roles: ['Administrateur', 'Auditeur'],
        tags: ['audit', 'alerte', 'sécurité', 'fraude', 'surveillance'],
        contenu: `<p>Point le plus important de cette page : <strong>il n'existe aucun moteur de détection de fraude dans GESTMONEY.</strong> Rien ici ne calcule un score de risque, une probabilité de fraude, ni ne juge un montant.</p>
<p>Ce que la page fait réellement : elle compte les actions par utilisateur sur la dernière heure, et signale les comptes dont le volume dépasse un seuil fixe. C'est tout. Le type d'alerte s'appelle d'ailleurs « activité excessive » — pas « fraude ».</p>
<h4>Comment réagir à une alerte</h4>
<ol>
  <li>Lisez le nombre d'actions et la période.</li>
  <li>Demandez-vous si c'est explicable : jour de marché, fin de mois, formation, rattrapage de saisie.</li>
  <li>Si oui, il n'y a rien à faire.</li>
  <li>Sinon, ouvrez le journal d'audit dans Administration pour voir CE QUI a été fait, pas seulement combien.</li>
</ol>
<p>La page affiche aussi les <strong>événements de sécurité des 7 derniers jours</strong> et les <strong>mouvements financiers audités</strong>. Le bouton <strong>🔄 Actualiser</strong> recharge l'ensemble.</p>`,
        avertissements: [
          "Une alerte n'est PAS une accusation. Un agent très productif un jour de forte affluence déclenchera exactement le même signalement qu'un comportement anormal. Ne confrontez jamais quelqu'un sur la seule base de cette page.",
        ],
        nonDisponible: [
          "Aucun scoring de fraude, aucune analyse de montants, aucun modèle prédictif.",
          "Les compteurs « Échecs de connexion » et « Comptes verrouillés » peuvent rester à zéro : le journal ne distingue pas encore ces événements.",
          "Aucun export sur cette page.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ ABONNEMENT
  {
    id: 'abonnement',
    titre: 'Abonnement & paiement',
    icone: CreditCard,
    couleur: '#F59E0B',
    description: 'Régler votre abonnement et suivre vos paiements.',
    articles: [
      {
        id: 'payer-abonnement',
        titre: 'Régler son abonnement',
        objectif: 'Payer et faire enregistrer le paiement.',
        roles: ['Administrateur'],
        tags: ['abonnement', 'paiement', 'code prépayé', 'licence', 'essai'],
        contenu: `<p>Votre compte démarre avec un <strong>essai de 14 jours</strong>. À son terme, une <strong>période de grâce de 7 jours</strong> vous laisse le temps de régulariser avant que l'accès ne soit restreint.</p>
<h4>Le moyen de paiement actif aujourd'hui</h4>
<p>À ce jour, <strong>seul le code prépayé est opérationnel</strong>. Les autres moyens (mobile money manuel, virement, espèces en agence, passerelle bancaire…) apparaissent dans la liste au fur et à mesure que votre administrateur les configure ; tant qu'ils ne le sont pas, ils ne sont pas proposés.</p>
<h4>Utiliser un code prépayé</h4>
<ol>
  <li>Ouvrez <strong>Abonnement &amp; paiement</strong>.</li>
  <li>Choisissez le moyen <strong>🎟️ Code prépayé</strong>.</li>
  <li>Saisissez votre code et cliquez sur <strong>Utiliser ce code</strong>.</li>
  <li>Le paiement apparaît ensuite dans <strong>🧾 Mes paiements</strong> (date, référence, montant, canal, statut).</li>
</ol>
<p>Pour un moyen de paiement manuel, la page affiche les <strong>instructions de paiement</strong>, puis vous créez le paiement et envoyez votre <strong>justificatif</strong>. Un administrateur le contrôle avant validation — ce n'est donc pas instantané.</p>`,
        avertissements: [
          "GESTMONEY ne vous demandera JAMAIS votre code secret Mobile Money ni votre mot de passe. Toute personne qui vous le demande au nom de GESTMONEY tente de vous escroquer. Ce rappel est affiché en permanence en haut de la page.",
          "Un badge « Test » à côté d'un moyen de paiement signifie qu'il est en configuration : un paiement passé par ce canal ne compte pas.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ NOTIFICATIONS
  {
    id: 'notifications',
    titre: 'Notifications',
    icone: Bell,
    couleur: '#EF4444',
    description: 'Vos alertes et messages du système.',
    articles: [
      {
        id: 'gerer-notifications',
        titre: 'Trier et traiter ses notifications',
        objectif: 'Ne pas rater une alerte importante.',
        roles: ['Tous'],
        tags: ['notification', 'alerte', 'non lu'],
        contenu: `<p>Cinq filtres en haut : <strong>Toutes</strong>, <strong>Non lues</strong> (avec son compteur), <strong>Alertes</strong>, <strong>Transactions</strong>, <strong>Système</strong>.</p>
<p>Sur chaque notification, au survol : <strong>✓ Marquer comme lue</strong> et <strong>🗑 Supprimer</strong>. Le bouton <strong>Tout marquer lu</strong> en haut vide le compteur d'un coup ; il est grisé s'il n'y a rien à lire.</p>
<p>La liste est paginée par 6.</p>`,
        avertissements: [
          "« Tout marquer lu » ne demande pas de confirmation. Parcourez la liste avant de cliquer.",
        ],
        nonDisponible: [
          "Le bouton « Paramètres » de cette page n'est pas encore branché. Les préférences de notification se trouvent dans Paramètres → onglet Notifications.",
          "Les notifications de type float et IA n'ont pas de filtre dédié : retrouvez-les via « Toutes ».",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ PARAMÈTRES
  {
    id: 'parametres',
    titre: 'Paramètres',
    icone: Settings,
    couleur: '#64748B',
    description: 'Profil, sécurité, notifications et apparence.',
    articles: [
      {
        id: 'onglets-parametres',
        titre: 'Les quatre onglets des paramètres',
        objectif: 'Savoir ce qui se règle où.',
        roles: ['Gérant', 'Administrateur'],
        tags: ['paramètres', 'sécurité', '2fa', 'thème', 'langue'],
        contenu: `<ul>
  <li><strong>Profil</strong> — photo, prénom, nom, email, téléphone, langue (français / anglais) et fuseau horaire (Abidjan, Dakar, Lagos, Nairobi).</li>
  <li><strong>Sécurité</strong> — changement de mot de passe, double authentification, et liste de vos sessions actives.</li>
  <li><strong>Notifications</strong> — un tableau croisant cinq catégories (Transactions, Float, Commissions, Fraude, Système) avec quatre canaux (Email, SMS, Push, In-app).</li>
  <li><strong>Apparence</strong> — thème (clair, sombre, système), densité d'affichage et langue.</li>
</ul>
<p>En bas de page, le bloc <strong>Guide de démarrage</strong> et son bouton <strong>Relancer le guide</strong> réaffichent l'accueil des nouveaux comptes.</p>`,
        avertissements: [
          "Le fuseau horaire conditionne l'heure inscrite sur toutes vos opérations. Réglez-le avant votre première journée d'activité, pas après.",
        ],
        nonDisponible: [
          "Cette page est encore en cours de branchement : les réglages que vous y faites ne sont pas enregistrés sur le serveur et sont perdus au rechargement. La double authentification et la liste des sessions y sont présentées à titre d'aperçu.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ PROFIL
  {
    id: 'profil',
    titre: 'Mon profil',
    icone: User,
    couleur: '#111111',
    description: 'Vos informations et votre activité récente.',
    articles: [
      {
        id: 'mon-profil',
        titre: 'Consulter son profil',
        objectif: 'Vérifier ses informations et relire son activité.',
        roles: ['Tous'],
        tags: ['profil', 'compte', 'activité', 'sessions'],
        contenu: `<p>La page affiche votre carte d'identité (initiales, rôle, statut, email, date d'inscription), trois chiffres — <strong>Transactions créées</strong>, <strong>Sessions</strong>, <strong>Dernière connexion</strong> — et l'<strong>historique de vos activités récentes</strong> (action, détail, date).</p>
<p>Le bouton <strong>Modifier le profil</strong> ouvre une fenêtre avec prénom, nom, email et téléphone.</p>`,
        conseils: [
          "L'historique d'activité est le moyen le plus simple de vérifier si quelqu'un d'autre a utilisé votre compte : une connexion à une heure où vous ne travailliez pas doit vous alerter.",
        ],
        nonDisponible: [
          "La fenêtre « Modifier le profil » n'enregistre pas encore vos changements.",
          "Ni la double authentification ni le changement de mot de passe ne se trouvent ici : ils sont dans Paramètres → Sécurité.",
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ AIDE
  {
    id: 'aide',
    titre: 'Aide, support et SARA',
    icone: LifeBuoy,
    couleur: '#009E00',
    description: 'Où poser une question quand ce guide ne suffit pas.',
    articles: [
      {
        id: 'ou-chercher',
        titre: 'Où chercher une réponse',
        objectif: 'Aller au bon endroit du premier coup.',
        roles: ['Tous'],
        tags: ['aide', 'faq', 'support', 'ticket'],
        contenu: `<ol>
  <li><strong>Ce guide</strong> — comment se servir d'un module, pas à pas.</li>
  <li><strong>FAQ</strong> — 100 questions courtes classées en 12 catégories, avec recherche.</li>
  <li><strong>Centre d'aide</strong> — les accès rapides et l'état des services.</li>
  <li><strong>Support</strong> — quand rien de tout cela ne répond : ouvrez un ticket.</li>
</ol>
<h4>Ouvrir un ticket</h4>
<ol>
  <li><strong>Nouveau ticket</strong>.</li>
  <li><strong>Titre du problème</strong> — obligatoire.</li>
  <li><strong>Catégorie</strong> : Problème technique, Transaction, Float, Solde, Agent, Accès, Facturation, Autre.</li>
  <li><strong>Priorité</strong> : Basse, Normale, Haute, Urgente.</li>
  <li><strong>Description détaillée</strong> — obligatoire. Indiquez la référence de l'opération, l'heure et le message d'erreur exact.</li>
</ol>`,
        conseils: [
          "Un ticket qui contient une référence de transaction et une heure précise est traité bien plus vite qu'un ticket qui dit « ça ne marche pas ».",
        ],
        liensConnexes: [
          { label: 'FAQ — 100 questions', href: '/dashboard/faq' },
          { label: "Centre d'aide", href: '/dashboard/aide' },
          { label: 'Ouvrir un ticket', href: '/dashboard/support' },
        ],
      },
      {
        id: 'sara',
        titre: "SARA : ce qu'il faut savoir",
        objectif: "Ne pas compter sur l'assistant pour l'instant.",
        roles: ['Tous'],
        tags: ['sara', 'ia', 'assistant'],
        contenu: `<p><strong>SARA n'est pas en service.</strong> Le bouton de l'assistant est présent dans l'interface, mais aucun moteur n'y est branché : il ne peut répondre à aucune question.</p>
<p>En attendant, ce guide et la FAQ couvrent l'essentiel, et le support prend le relais pour le reste.</p>`,
        nonDisponible: [
          "L'assistant SARA est hors ligne. Ne comptez pas dessus pour obtenir une réponse.",
        ],
      },
      {
        id: 'ecrans-superadmin',
        titre: 'Les écrans Super Admin',
        objectif: 'Savoir ce qui est réel et ce qui ne l\'est pas.',
        roles: ['Super admin'],
        tags: ['superadmin', 'maquette', 'prospects', 'licences'],
        contenu: `<p>Si votre compte est un compte <strong>Super admin</strong>, vous voyez une section supplémentaire dans le menu. Huit de ces écrans sont aujourd'hui des <strong>maquettes de présentation</strong> : prospects, offres, paiements, licences, analytics, emails, SARA et démonstrations.</p>
<p>Ils affichent des chiffres d'exemple, figés, qui ne viennent d'aucune base de données. Ils servent à montrer la forme que prendront ces modules, pas à travailler.</p>`,
        avertissements: [
          "Ne prenez aucune décision à partir des chiffres affichés sur ces huit écrans, et n'y saisissez rien d'important : rien n'y est enregistré.",
        ],
      },
    ],
  },
];

// ─── Carte d'article ─────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div
      className={clsx(
        'border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all',
        ouvert && 'shadow-sm',
      )}
    >
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-text-main">{article.titre}</p>
          <p className="text-xs text-text-muted mt-0.5">{article.objectif}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {article.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/08 text-text-muted"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        {ouvert ? (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>

      {ouvert && (
        <div className="border-t border-gray-100 dark:border-white/08 px-4 py-4 space-y-4">
          <div
            className="prose-guide text-sm text-text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.contenu }}
          />

          {article.conseils && article.conseils.length > 0 && (
            <div className="bg-[#009E00]/08 border border-[#009E00]/20 rounded-xl p-3 space-y-1.5">
              {article.conseils.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Info size={13} className="text-[#009E00] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#007a00] dark:text-[#4ade80]">{c}</p>
                </div>
              ))}
            </div>
          )}

          {article.avertissements && article.avertissements.length > 0 && (
            <div className="bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-xl p-3 space-y-1.5">
              {article.avertissements.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle
                    size={13}
                    className="text-[#b8960a] dark:text-[#FFD000] flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-[#92740a] dark:text-[#FFD000]">{a}</p>
                </div>
              ))}
            </div>
          )}

          {article.nonDisponible && article.nonDisponible.length > 0 && (
            <div className="bg-gray-100/70 dark:bg-white/05 border border-gray-200 dark:border-white/10 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                Pas encore disponible
              </p>
              {article.nonDisponible.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Ban size={13} className="text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted">{n}</p>
                </div>
              ))}
            </div>
          )}

          {article.liensConnexes && article.liensConnexes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {article.liensConnexes.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#009E00] hover:underline"
                >
                  {l.label} <ChevronRight size={11} />
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/05 text-text-muted rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [recherche, setRecherche] = useState('');
  const [sectionActive, setSectionActive] = useState<string | null>(null);
  const [visiteOuverte, setVisiteOuverte] = useState(false);

  const resultatsRecherche = useMemo(() => {
    if (!recherche.trim()) return [];
    const q = recherche.toLowerCase();
    const res: { section: Section; article: Article }[] = [];
    SECTIONS.forEach((section) => {
      section.articles.forEach((article) => {
        if (
          article.titre.toLowerCase().includes(q) ||
          article.tags.some((t) => t.includes(q)) ||
          article.contenu.toLowerCase().includes(q) ||
          article.objectif.toLowerCase().includes(q)
        ) {
          res.push({ section, article });
        }
      });
    });
    return res;
  }, [recherche]);

  const sectionsFiltrees = sectionActive
    ? SECTIONS.filter((s) => s.id === sectionActive)
    : SECTIONS;
  const totalArticles = SECTIONS.reduce((n, s) => n + s.articles.length, 0);

  const handleExportPdf = () => {
    const lignes = SECTIONS.flatMap((s) =>
      s.articles.map(
        (a) =>
          ({
            section: s.titre,
            article: a.titre,
            objectif: a.objectif,
            roles: a.roles.join(', '),
          }) as Record<string, unknown>,
      ),
    );
    exporterPdf(
      lignes,
      [
        { titre: 'Module', valeur: (r) => String(r.section) },
        { titre: 'Fiche', valeur: (r) => String(r.article) },
        { titre: 'Objectif', valeur: (r) => String(r.objectif) },
        { titre: 'Rôles', valeur: (r) => String(r.roles) },
      ],
      {
        titre: 'Guide Utilisateur GESTMONEY',
        sousTitre: `${totalArticles} fiches — ${SECTIONS.length} modules`,
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* La visite guidée est montée à la demande, en mode forcé. */}
      {visiteOuverte && (
        <OnboardingTour forceStart onClose={() => setVisiteOuverte(false)} />
      )}

      <GmPageHeader
        fil={['🏠 Accueil', "Centre d'aide", 'Guide utilisateur']}
        titre="📘 Guide utilisateur"
        sousTitre={`${totalArticles} fiches réparties sur ${SECTIONS.length} modules — tout ce qui est décrit ici existe et fonctionne`}
        actions={
          <>
            <GmButton onClick={() => setVisiteOuverte(true)}>
              <PlayCircle size={15} /> Relancer la visite
            </GmButton>
            <GmButton variante="outline" onClick={handleExportPdf}>
              <Download size={15} /> Exporter PDF
            </GmButton>
            <Link href="/dashboard/aide" className="gm-btn gm-btn-ghost">
              ← Centre d&apos;aide
            </Link>
          </>
        }
      />

      {/* Bandeau visite guidée */}
      <div className="bg-gradient-to-r from-[#009E00]/10 to-[#FFD000]/10 rounded-2xl border border-[#009E00]/20 p-4 sm:p-5 flex items-start gap-3">
        <PlayCircle size={20} className="text-[#009E00] flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="font-bold text-text-main text-sm">
            Première fois ici ? Commencez par la visite guidée
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Une quinzaine de bulles qui vous font le tour des écrans principaux. Les écrans
            auxquels votre compte n&apos;a pas accès sont automatiquement passés. Vous pouvez la
            relancer autant de fois que vous voulez.
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="gm-search-wrap">
        <Search size={16} className="gm-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="gm-search-input"
          placeholder="Rechercher… (ex : caisse, float, commission, code prépayé)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label="Rechercher dans le guide"
        />
      </div>

      {/* Résultats de recherche */}
      {recherche.trim() && (
        <div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {resultatsRecherche.length} résultat{resultatsRecherche.length !== 1 ? 's' : ''} pour
            &ldquo;{recherche}&rdquo;
          </p>
          {resultatsRecherche.length === 0 ? (
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-10 text-center">
              <p className="text-text-muted text-sm">
                Aucune fiche trouvée. Essayez un autre mot.
              </p>
              <Link
                href="/dashboard/faq"
                className="text-[#009E00] text-sm font-semibold mt-3 inline-flex items-center gap-1"
              >
                Voir la FAQ <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {resultatsRecherche.map(({ section, article }) => (
                <div
                  key={`${section.id}-${article.id}`}
                  className="bg-white dark:bg-white/03 rounded-xl border border-gray-100 dark:border-white/08 overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <section.icone size={13} style={{ color: section.couleur }} />
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                      {section.titre}
                    </span>
                  </div>
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!recherche.trim() && (
        <>
          {/* Filtres par module */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSectionActive(null)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                !sectionActive
                  ? 'bg-[#009E00] text-white'
                  : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-[#009E00] hover:text-[#009E00]',
              )}
            >
              Tous les modules
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionActive(sectionActive === s.id ? null : s.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                  sectionActive === s.id
                    ? 'text-white'
                    : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:text-text-main',
                )}
                style={sectionActive === s.id ? { backgroundColor: s.couleur } : {}}
              >
                <s.icone size={12} />
                {s.titre}
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sectionsFiltrees.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden"
              >
                <div
                  className="px-4 sm:px-6 py-5 flex items-center gap-3 sm:gap-4 border-b border-gray-100 dark:border-white/08"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: section.couleur,
                    borderLeftStyle: 'solid',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: section.couleur + '18' }}
                  >
                    <section.icone size={19} style={{ color: section.couleur }} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-text-main">{section.titre}</h2>
                    <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-1 rounded-full flex-shrink-0 hidden sm:inline">
                    {section.articles.length}
                  </span>
                </div>
                <div className="px-3 sm:px-4 py-3 space-y-1.5">
                  {section.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Bas de page */}
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-text-main">Toujours bloqué ?</h3>
              <p className="text-sm text-text-muted mt-1">
                La FAQ répond en une ligne ; le support répond au cas par cas.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/dashboard/faq" className="gm-btn gm-btn-outline">
                <HelpCircle size={14} /> FAQ
              </Link>
              <Link href="/dashboard/support" className="gm-btn gm-btn-primary">
                <CheckCircle2 size={14} /> Ouvrir un ticket
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, ChevronDown, ChevronRight, Download,
  Zap, Lock, Layout, Settings, ArrowLeftRight, Users,
  Building2, Wallet, DollarSign, UserCheck, BarChart3,
  Building, CreditCard, LifeBuoy, Bot, CheckCircle2, HelpCircle,
  AlertTriangle, Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { exporterPdf } from '@/lib/exportPdf';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  titre: string;
  objectif: string;
  roles: string[];
  contenu: string;
  conseils?: string[];
  avertissements?: string[];
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

// ─── Données ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'presentation',
    titre: 'Présentation GESTMONEY',
    icone: BookOpen,
    couleur: '#009E00',
    description: 'Comprendre l\'ERP SaaS Mobile Money pour l\'Afrique/OHADA.',
    articles: [
      {
        id: 'quest-ce-que-gestmoney',
        titre: 'Qu\'est-ce que GESTMONEY ?',
        objectif: 'Comprendre le positionnement et les fonctionnalités de la plateforme.',
        roles: ['Tous les rôles'],
        tags: ['présentation', 'gestmoney', 'erp', 'mobile money'],
        contenu: `<p>GESTMONEY est un <strong>ERP SaaS spécialisé Mobile Money</strong> conçu pour les opérateurs, réseaux d'agents et institutions financières opérant en Afrique subsaharienne et dans la zone OHADA.</p>
<h4>Fonctionnalités principales</h4>
<ul>
  <li><strong>Gestion des transactions</strong> — Dépôts, retraits, transferts sur tous les réseaux</li>
  <li><strong>Suivi du float</strong> — Monitoring en temps réel des soldes par opérateur</li>
  <li><strong>Gestion des agents</strong> — Réseau complet avec performances et commissions</li>
  <li><strong>Rapports & BI</strong> — Tableaux de bord KPI, exports PDF/XLSX/CSV</li>
  <li><strong>SARA IA</strong> — Assistance intelligente intégrée</li>
  <li><strong>Multi-tenant</strong> — Architecture SaaS sécurisée multi-sociétés</li>
</ul>
<h4>Opérateurs supportés</h4>
<p>Orange Money, Wave, MTN Mobile Money, Moov Money, Airtel Money, M-Pesa et tout opérateur configurable via API.</p>`,
        conseils: ['GESTMONEY est accessible depuis tous les navigateurs modernes et sur mobile (PWA).', 'L\'interface est disponible en français et en anglais.'],
      },
      {
        id: 'architecture-roles',
        titre: 'Architecture multi-tenant et rôles',
        objectif: 'Comprendre la hiérarchie des accès et la structure multi-tenant.',
        roles: ['ADMIN', 'MANAGER'],
        tags: ['multi-tenant', 'rôles', 'permissions', 'architecture'],
        contenu: `<p>GESTMONEY utilise une architecture <strong>multi-tenant</strong> : chaque société (tenant) dispose de ses propres données isolées.</p>
<h4>Hiérarchie des rôles</h4>
<table>
  <thead><tr><th>Rôle</th><th>Portée</th><th>Droits principaux</th></tr></thead>
  <tbody>
    <tr><td><strong>SUPER_ADMIN</strong></td><td>Toute la plateforme</td><td>Accès total, console SuperAdmin</td></tr>
    <tr><td><strong>ADMIN</strong></td><td>Un tenant</td><td>Gestion complète de la société</td></tr>
    <tr><td><strong>MANAGER</strong></td><td>Tenant</td><td>Agents, transactions, rapports</td></tr>
    <tr><td><strong>SUPERVISOR</strong></td><td>Agence(s)</td><td>Supervision des agents</td></tr>
    <tr><td><strong>AGENT</strong></td><td>Agence</td><td>Enregistrement des transactions</td></tr>
    <tr><td><strong>AUDITOR</strong></td><td>Tenant</td><td>Lecture seule, audit</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
  {
    id: 'connexion',
    titre: 'Connexion & Sécurité',
    icone: Lock,
    couleur: '#E60000',
    description: 'Se connecter, sécuriser son compte et gérer les accès.',
    articles: [
      {
        id: 'premiere-connexion',
        titre: 'Se connecter pour la première fois',
        objectif: 'Accéder à l\'application avec ses identifiants initiaux et les sécuriser.',
        roles: ['Tous les rôles'],
        tags: ['connexion', 'première fois', 'mot de passe', 'login'],
        contenu: `<p>Après la création de votre compte par un administrateur, vous recevez un email contenant vos identifiants temporaires.</p>
<ol>
  <li>Ouvrez le lien reçu ou naviguez vers <code>app.gestmoney.com</code></li>
  <li>Saisissez votre <strong>adresse email</strong> et le <strong>mot de passe temporaire</strong></li>
  <li>À la première connexion, définissez un <strong>nouveau mot de passe</strong> sécurisé (12 caractères min., maj., chiffres, symboles)</li>
  <li>Activez la <strong>double authentification (2FA)</strong> recommandée</li>
  <li>Vous êtes redirigé vers le tableau de bord</li>
</ol>`,
        conseils: ['Le mot de passe temporaire est valable 24 heures.', 'Utilisez ⌘K / Ctrl+K pour naviguer rapidement dans l\'application.'],
        liensConnexes: [{ label: 'Activer la 2FA', href: '#activer-2fa' }, { label: 'Guide de configuration initiale', href: '#wizard-onboarding' }],
      },
      {
        id: 'activer-2fa',
        titre: 'Activer la double authentification (2FA)',
        objectif: 'Sécuriser son compte avec un code TOTP en complément du mot de passe.',
        roles: ['Tous les rôles'],
        tags: ['2fa', 'sécurité', 'totp', 'google authenticator', 'authy'],
        contenu: `<ol>
  <li>Allez dans <strong>Paramètres → Sécurité → Double authentification</strong></li>
  <li>Cliquez sur <strong>Activer la 2FA</strong></li>
  <li>Scannez le <strong>QR code</strong> avec Google Authenticator, Authy ou Microsoft Authenticator</li>
  <li>Saisissez le <strong>code à 6 chiffres</strong> pour confirmer l'activation</li>
  <li>Conservez vos <strong>codes de secours</strong> dans un endroit sûr</li>
</ol>`,
        avertissements: ['Sans vos codes de secours, vous perdrez l\'accès en cas de perte de téléphone.'],
        conseils: ['La 2FA est obligatoire pour les rôles ADMIN et MANAGER.'],
      },
      {
        id: 'reinitialiser-mdp',
        titre: 'Réinitialiser son mot de passe',
        objectif: 'Récupérer l\'accès à son compte en cas d\'oubli du mot de passe.',
        roles: ['Tous les rôles'],
        tags: ['mot de passe', 'réinitialisation', 'oubli', 'récupération'],
        contenu: `<h4>Depuis la page de connexion :</h4>
<ol>
  <li>Cliquez sur <strong>Mot de passe oublié ?</strong></li>
  <li>Saisissez votre <strong>adresse email</strong></li>
  <li>Vous recevez un <strong>lien de réinitialisation</strong> valable 1 heure</li>
  <li>Cliquez sur le lien et définissez un nouveau mot de passe</li>
</ol>
<h4>Pour réinitialiser le mot de passe d'un agent (rôle MANAGER+) :</h4>
<ol>
  <li>Allez dans <strong>Agents → [Nom de l'agent]</strong></li>
  <li>Cliquez sur <strong>Actions → Réinitialiser le mot de passe</strong></li>
  <li>L'agent reçoit un email avec ses nouveaux identifiants</li>
</ol>`,
      },
    ],
  },
  {
    id: 'navigation',
    titre: 'Navigation & Interface',
    icone: Layout,
    couleur: '#3B82F6',
    description: 'Maîtriser l\'interface, la sidebar et la palette de commandes.',
    articles: [
      {
        id: 'palette-commandes',
        titre: 'Palette de commandes ⌘K',
        objectif: 'Naviguer rapidement dans l\'application sans utiliser la souris.',
        roles: ['Tous les rôles'],
        tags: ['palette', 'commandes', 'raccourcis', 'navigation', 'clavier'],
        contenu: `<p>La <strong>palette de commandes</strong> est accessible avec <kbd>⌘K</kbd> (Mac) ou <kbd>Ctrl+K</kbd> (Windows/Linux).</p>
<h4>Utilisation :</h4>
<ol>
  <li>Ouvrez la palette avec <kbd>⌘K</kbd></li>
  <li>Tapez le nom de la page ou fonctionnalité</li>
  <li>Utilisez <kbd>↑</kbd> <kbd>↓</kbd> pour naviguer dans les suggestions</li>
  <li>Appuyez sur <kbd>Entrée</kbd> pour accéder à la page sélectionnée</li>
  <li>Appuyez sur <kbd>Échap</kbd> pour fermer</li>
</ol>
<h4>Exemples de commandes rapides :</h4>
<ul>
  <li>"trans" → Page Transactions</li>
  <li>"agent" → Page Agents</li>
  <li>"float" → Gestion Float</li>
  <li>"rapport" → Rapports & BI</li>
  <li>"aide" → Centre d'aide</li>
</ul>`,
        conseils: ['La palette mémorise vos pages récentes pour un accès encore plus rapide.'],
      },
      {
        id: 'sidebar',
        titre: 'Navigation par la sidebar',
        objectif: 'Comprendre les éléments de la barre latérale et les badges en temps réel.',
        roles: ['Tous les rôles'],
        tags: ['sidebar', 'navigation', 'badges', 'notifications'],
        contenu: `<p>La <strong>barre latérale</strong> (sidebar) donne accès à tous les modules de GESTMONEY.</p>
<h4>Badges temps réel :</h4>
<ul>
  <li><span class="badge">Transactions</span> — Nombre de transactions en attente de validation</li>
  <li><span class="badge">Float</span> — Alerte si un opérateur est sous le seuil critique</li>
  <li><span class="badge">Notifications</span> — Nouvelles notifications non lues</li>
  <li><span class="badge">Support</span> — Tickets ouverts avec réponse en attente</li>
</ul>
<h4>Mode mobile :</h4>
<p>Sur mobile, la sidebar se rétracte. Utilisez l'icône menu en haut à gauche pour l'ouvrir.</p>`,
      },
    ],
  },
  {
    id: 'parametrage',
    titre: 'Paramétrage Initial',
    icone: Settings,
    couleur: '#8B5CF6',
    description: 'Configurer la société, les opérateurs et les paramètres de base.',
    articles: [
      {
        id: 'wizard-onboarding',
        titre: 'Guide de configuration initiale (Wizard)',
        objectif: 'Effectuer la configuration de démarrage en 4 étapes guidées.',
        roles: ['ADMIN'],
        tags: ['wizard', 'onboarding', 'configuration', 'démarrage'],
        contenu: `<p>À votre première connexion, un <strong>wizard de démarrage</strong> s'affiche automatiquement.</p>
<ol>
  <li><strong>Bienvenue</strong> — Présentation des fonctionnalités principales</li>
  <li><strong>Opérateurs</strong> — Activez les réseaux Mobile Money (Orange Money, Wave, MTN…)</li>
  <li><strong>Premier agent</strong> — Créez votre premier agent de terrain</li>
  <li><strong>Terminé</strong> — Accès au tableau de bord complet</li>
</ol>
<p>Vous pouvez relancer ce wizard à tout moment : <strong>Paramètres → Guide de démarrage</strong></p>`,
      },
      {
        id: 'configurer-operateurs',
        titre: 'Ajouter et configurer un opérateur Mobile Money',
        objectif: 'Activer un réseau Mobile Money pour pouvoir enregistrer des transactions.',
        roles: ['ADMIN'],
        tags: ['opérateur', 'mobile money', 'orange', 'wave', 'mtn', 'configuration'],
        contenu: `<p>Depuis <strong>Paramètres → Opérateurs</strong> :</p>
<ol>
  <li>Cliquez sur <strong>Ajouter un opérateur</strong></li>
  <li>Sélectionnez l'opérateur (Orange Money, Wave, MTN, Moov, Airtel…)</li>
  <li>Renseignez les <strong>informations de connexion API</strong> (clé API, secret) fournis par l'opérateur</li>
  <li>Définissez le <strong>seuil bas</strong> et le <strong>seuil critique</strong> de float</li>
  <li>Configurez les <strong>taux de commission</strong> pour cet opérateur</li>
  <li>Cliquez sur <strong>Activer l'opérateur</strong></li>
</ol>`,
        avertissements: ['Sans les credentials API de l\'opérateur, les transactions ne peuvent pas être synchronisées en temps réel.'],
      },
      {
        id: 'infos-societe',
        titre: 'Configurer les informations de la société',
        objectif: 'Renseigner les informations légales et visuelles de l\'entreprise.',
        roles: ['ADMIN'],
        tags: ['société', 'logo', 'informations', 'legal', 'paramètres'],
        contenu: `<p>Depuis <strong>Paramètres → Société</strong> :</p>
<ul>
  <li><strong>Nom de la société</strong> — Apparaît sur tous les documents générés</li>
  <li><strong>Logo</strong> — PNG/SVG, apparaît sur les PDF et reçus</li>
  <li><strong>Devise</strong> — XOF (FCFA) par défaut</li>
  <li><strong>Fuseau horaire</strong> — Critique pour les horodatages des transactions</li>
  <li><strong>Numéro RCCM / IFU</strong> — Pour les documents légaux</li>
  <li><strong>Adresse</strong> — Affichée sur les rapports PDF</li>
</ul>`,
      },
    ],
  },
  {
    id: 'transactions',
    titre: 'Transactions Mobile Money',
    icone: ArrowLeftRight,
    couleur: '#009E00',
    description: 'Enregistrer, valider et exporter les transactions.',
    articles: [
      {
        id: 'creer-transaction',
        titre: 'Enregistrer une nouvelle transaction',
        objectif: 'Créer un dépôt, retrait ou transfert Mobile Money dans le système.',
        roles: ['AGENT', 'MANAGER', 'ADMIN'],
        tags: ['transaction', 'dépôt', 'retrait', 'transfert', 'enregistrement'],
        contenu: `<p>Depuis <strong>Transactions → Nouvelle transaction</strong> :</p>
<ol>
  <li>Sélectionnez le <strong>type</strong> : Dépôt, Retrait ou Transfert</li>
  <li>Choisissez l'<strong>opérateur</strong> Mobile Money</li>
  <li>Saisissez le <strong>montant</strong> (en FCFA)</li>
  <li>Entrez le <strong>numéro du client</strong> (téléphone)</li>
  <li>Ajoutez la <strong>référence opérateur</strong> (code fourni par le réseau)</li>
  <li>Optionnel : Ajoutez une <strong>note interne</strong></li>
  <li>Cliquez sur <strong>Valider</strong> — La transaction est enregistrée et un reçu peut être imprimé</li>
</ol>`,
        conseils: ['Les transactions sont horodatées automatiquement avec votre fuseau horaire.', 'Vous pouvez imprimer le reçu immédiatement après validation.'],
        liensConnexes: [{ label: 'Comprendre les statuts', href: '#statuts-transaction' }],
      },
      {
        id: 'statuts-transaction',
        titre: 'Comprendre les statuts de transaction',
        objectif: 'Identifier l\'état d\'une transaction et savoir quoi faire selon le statut.',
        roles: ['Tous les rôles'],
        tags: ['statut', 'en attente', 'validé', 'rejeté', 'annulé'],
        contenu: `<table>
  <thead><tr><th>Statut</th><th>Signification</th><th>Action possible</th></tr></thead>
  <tbody>
    <tr><td><span class="badge-green">Validée</span></td><td>Traitée avec succès</td><td>Imprimer le reçu</td></tr>
    <tr><td><span class="badge-yellow">En attente</span></td><td>En cours de traitement</td><td>Attendre ou valider manuellement (MANAGER+)</td></tr>
    <tr><td><span class="badge-red">Rejetée</span></td><td>Fonds insuffisants, numéro invalide</td><td>Corriger et re-soumettre</td></tr>
    <tr><td><span class="badge-gray">Annulée</span></td><td>Annulée par l'opérateur ou le gestionnaire</td><td>Créer une nouvelle transaction</td></tr>
  </tbody>
</table>`,
        avertissements: ['Seul un MANAGER ou ADMIN peut valider manuellement une transaction en attente.'],
      },
      {
        id: 'export-transactions',
        titre: 'Exporter les transactions',
        objectif: 'Télécharger les transactions dans différents formats pour archivage ou comptabilité.',
        roles: ['MANAGER', 'ADMIN', 'AUDITOR'],
        tags: ['export', 'csv', 'pdf', 'xlsx', 'excel'],
        contenu: `<p>Depuis la page <strong>Transactions</strong>, utilisez les boutons d'export en haut à droite :</p>
<ul>
  <li><strong>CSV</strong> — Format tableur universel, compatible Excel / LibreOffice</li>
  <li><strong>XLSX</strong> — Format Excel natif avec en-tête GESTMONEY et mise en forme</li>
  <li><strong>PDF</strong> — Document formaté prêt à imprimer ou archiver</li>
</ul>
<p><strong>Important :</strong> Les exports respectent les filtres actifs (période, opérateur, statut, agence, agent).</p>
<h4>Procédure :</h4>
<ol>
  <li>Appliquez vos filtres (date, opérateur, statut…)</li>
  <li>Cliquez sur le bouton d'export souhaité</li>
  <li>Le fichier est téléchargé automatiquement</li>
</ol>`,
      },
    ],
  },
  {
    id: 'agents',
    titre: 'Gestion des Agents',
    icone: Users,
    couleur: '#3B82F6',
    description: 'Créer, gérer et suivre les performances de vos agents de terrain.',
    articles: [
      {
        id: 'creer-agent',
        titre: 'Ajouter un nouvel agent',
        objectif: 'Créer un compte agent pour un nouveau membre du réseau de terrain.',
        roles: ['MANAGER', 'ADMIN'],
        tags: ['agent', 'création', 'invitation', 'nouveau'],
        contenu: `<p>Depuis <strong>Agents → Ajouter un agent</strong> :</p>
<ol>
  <li>Renseignez le <strong>prénom, nom</strong> et <strong>adresse email</strong> de l'agent</li>
  <li>Saisissez son <strong>numéro de téléphone</strong></li>
  <li>Associez l'agent à une <strong>agence / point de vente</strong></li>
  <li>Définissez son <strong>rôle</strong> (AGENT ou SUPERVISOR)</li>
  <li>Cliquez sur <strong>Créer l'agent</strong></li>
</ol>
<p>GESTMONEY envoie automatiquement un <strong>email d'invitation</strong> avec ses identifiants temporaires. L'agent devra changer son mot de passe à sa première connexion.</p>`,
        conseils: ['L\'email d\'invitation est envoyé immédiatement. Si l\'agent ne le reçoit pas, vérifiez ses spams.'],
      },
      {
        id: 'performances-agents',
        titre: 'Suivre les performances d\'un agent',
        objectif: 'Consulter le volume de transactions, les commissions et le classement d\'un agent.',
        roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'],
        tags: ['performance', 'commission', 'classement', 'kpi', 'agent'],
        contenu: `<p>Depuis la fiche d'un agent (<strong>Agents → [Nom de l'agent]</strong>) :</p>
<ul>
  <li><strong>Volume de transactions</strong> — Du mois en cours et comparaison mensuelle</li>
  <li><strong>Montant total traité</strong> — Cumul des dépôts, retraits, transferts</li>
  <li><strong>Ticket moyen</strong> — Montant moyen par transaction</li>
  <li><strong>Commissions générées</strong> — Total des commissions sur la période</li>
  <li><strong>Classement réseau</strong> — Position parmi tous les agents du tenant</li>
</ul>
<p>Le tableau de bord affiche automatiquement le <strong>Top Agent du mois</strong> en page d'accueil.</p>`,
      },
    ],
  },
  {
    id: 'agences',
    titre: 'Gestion des Agences',
    icone: Building2,
    couleur: '#EC4899',
    description: 'Créer et gérer les points de vente et agences de votre réseau.',
    articles: [
      {
        id: 'creer-agence',
        titre: 'Créer une agence',
        objectif: 'Ouvrir un nouveau point de vente et l\'intégrer dans le réseau.',
        roles: ['ADMIN', 'MANAGER'],
        tags: ['agence', 'point de vente', 'création', 'réseau'],
        contenu: `<p>Depuis <strong>Agences → Nouvelle agence</strong> :</p>
<ol>
  <li>Renseignez le <strong>nom de l'agence</strong></li>
  <li>Saisissez l'<strong>adresse complète</strong> (ville, quartier)</li>
  <li>Désignez le <strong>responsable d'agence</strong> (SUPERVISOR)</li>
  <li>Associez les <strong>agents</strong> rattachés à cette agence</li>
  <li>Définissez les <strong>opérateurs actifs</strong> sur ce point de vente</li>
  <li>Cliquez sur <strong>Créer l'agence</strong></li>
</ol>`,
      },
    ],
  },
  {
    id: 'float',
    titre: 'Float & Liquidités',
    icone: Wallet,
    couleur: '#F59E0B',
    description: 'Surveiller et maintenir les soldes float de chaque opérateur.',
    articles: [
      {
        id: 'quest-ce-float',
        titre: 'Comprendre le float Mobile Money',
        objectif: 'Savoir ce qu\'est le float et pourquoi il doit être surveillé.',
        roles: ['Tous les rôles'],
        tags: ['float', 'solde', 'opérateur', 'liquidité'],
        contenu: `<p>Le <strong>float</strong> est le solde disponible que votre réseau détient chez chaque opérateur Mobile Money. Il représente votre capacité opérationnelle :</p>
<ul>
  <li><strong>Float élevé</strong> → Vous pouvez traiter plus de retraits et de transferts</li>
  <li><strong>Float bas</strong> → Vous devez réapprovisionner pour continuer les opérations</li>
</ul>
<p>GESTMONEY surveille les floats en <strong>temps réel</strong> et envoie des alertes automatiques par email et notification push quand un seuil est atteint.</p>`,
      },
      {
        id: 'configurer-seuils',
        titre: 'Configurer les seuils d\'alerte float',
        objectif: 'Définir les seuils d\'alerte pour éviter les ruptures de float.',
        roles: ['ADMIN', 'MANAGER'],
        tags: ['seuil', 'alerte', 'configuration', 'float', 'notification'],
        contenu: `<p>Depuis <strong>Gestion Float → Paramètres Float</strong> :</p>
<ol>
  <li>Sélectionnez l'<strong>opérateur</strong> à configurer</li>
  <li>Définissez le <strong>seuil bas</strong> (déclenchement de l'alerte)</li>
  <li>Définissez le <strong>seuil critique</strong> (alerte urgente + blocage optionnel des nouvelles transactions)</li>
  <li>Choisissez les <strong>destinataires des alertes</strong> (emails des gestionnaires)</li>
  <li>Activez/désactivez le <strong>blocage automatique</strong> en cas de seuil critique atteint</li>
</ol>`,
        avertissements: ['Un float en dessous du seuil critique peut entraîner le blocage automatique des retraits.'],
      },
    ],
  },
  {
    id: 'commissions',
    titre: 'Commissions',
    icone: DollarSign,
    couleur: '#10B981',
    description: 'Paramétrer et suivre les commissions par opérateur et par agent.',
    articles: [
      {
        id: 'configurer-commissions',
        titre: 'Configurer les commissions par opérateur',
        objectif: 'Définir les barèmes de commission pour chaque type d\'opération et opérateur.',
        roles: ['ADMIN'],
        tags: ['commission', 'barème', 'opérateur', 'configuration', 'taux'],
        contenu: `<p>Depuis <strong>Commissions → Barèmes</strong> :</p>
<ol>
  <li>Sélectionnez l'<strong>opérateur</strong></li>
  <li>Définissez le <strong>taux de commission</strong> par type d'opération (dépôt/retrait/transfert)</li>
  <li>Choisissez le mode : <strong>pourcentage</strong> du montant ou <strong>montant fixe</strong></li>
  <li>Définissez les <strong>paliers</strong> si les commissions sont progressives</li>
  <li>Activez le barème — Les commissions sont calculées automatiquement à chaque transaction</li>
</ol>`,
      },
      {
        id: 'rapport-commissions',
        titre: 'Consulter et exporter les commissions',
        objectif: 'Voir le détail des commissions par agent, agence ou opérateur.',
        roles: ['MANAGER', 'ADMIN'],
        tags: ['commission', 'rapport', 'export', 'agent', 'mensuel'],
        contenu: `<p>Depuis <strong>Commissions → Tableau de bord</strong> :</p>
<ul>
  <li><strong>Vue globale</strong> — Total des commissions du réseau sur la période</li>
  <li><strong>Par agent</strong> — Commissions individuelles avec classement</li>
  <li><strong>Par agence</strong> — Agrégation par point de vente</li>
  <li><strong>Par opérateur</strong> — Répartition par réseau Mobile Money</li>
</ul>
<p>Exportez en <strong>CSV, XLSX ou PDF</strong> depuis le bouton d'export en haut à droite.</p>`,
      },
    ],
  },
  {
    id: 'clients',
    titre: 'Clients',
    icone: UserCheck,
    couleur: '#6366F1',
    description: 'Gérer la base clients et l\'historique de leurs transactions.',
    articles: [
      {
        id: 'gestion-clients',
        titre: 'Gérer la base clients',
        objectif: 'Consulter et gérer les clients ayant effectué des transactions.',
        roles: ['MANAGER', 'ADMIN', 'AGENT'],
        tags: ['client', 'base de données', 'historique', 'numéro'],
        contenu: `<p>La page <strong>Clients</strong> liste automatiquement tous les clients ayant effectué au moins une transaction.</p>
<h4>Informations disponibles par client :</h4>
<ul>
  <li>Numéro de téléphone et nom (si renseigné)</li>
  <li>Nombre total de transactions</li>
  <li>Montant total échangé</li>
  <li>Date de la première et dernière transaction</li>
  <li>Opérateurs utilisés</li>
  <li>Historique complet des transactions</li>
</ul>`,
      },
    ],
  },
  {
    id: 'rapports',
    titre: 'Rapports & Exports',
    icone: BarChart3,
    couleur: '#EC4899',
    description: 'Générer des rapports de performance et exporter les données.',
    articles: [
      {
        id: 'generer-rapport',
        titre: 'Générer un rapport de performance',
        objectif: 'Créer un rapport complet sur une période donnée.',
        roles: ['MANAGER', 'ADMIN', 'AUDITOR'],
        tags: ['rapport', 'performance', 'kpi', 'mensuel', 'bi'],
        contenu: `<p>Depuis <strong>Rapports & BI</strong> :</p>
<ol>
  <li>Sélectionnez la <strong>période</strong> (mois, trimestre, année ou plage personnalisée)</li>
  <li>Cliquez sur <strong>Générer rapport</strong></li>
  <li>GESTMONEY calcule : KPIs, répartition par opérateur, classement agents, évolution CA</li>
  <li>Le rapport apparaît en quelques secondes dans l'historique</li>
  <li>Exportez en <strong>CSV, XLSX ou PDF</strong></li>
</ol>
<h4>KPIs inclus dans le rapport :</h4>
<ul>
  <li>Chiffre d'affaires total et variation vs période précédente</li>
  <li>Nombre de transactions et ticket moyen</li>
  <li>Nouveaux clients acquis</li>
  <li>Top agents et Top opérateurs</li>
  <li>Taux de rejet et taux de succès</li>
</ul>`,
      },
      {
        id: 'rapport-automatique',
        titre: 'Rapports automatiques mensuels',
        objectif: 'Configurer l\'envoi automatique de rapports par email chaque mois.',
        roles: ['ADMIN'],
        tags: ['automatique', 'email', 'planification', 'mensuel', 'rapport'],
        contenu: `<p>GESTMONEY génère automatiquement un <strong>rapport de synthèse</strong> le 1er de chaque mois.</p>
<h4>Pour configurer les destinataires :</h4>
<ol>
  <li>Allez dans <strong>Paramètres → Notifications → Rapports</strong></li>
  <li>Ajoutez les adresses email des destinataires</li>
  <li>Choisissez le format souhaité (PDF / XLSX)</li>
</ol>
<p>Le rapport email contient : CA et variation, nombre de transactions, meilleur agent, lien vers le rapport PDF complet.</p>`,
      },
    ],
  },
  {
    id: 'parametres',
    titre: 'Paramètres Société',
    icone: Building,
    couleur: '#64748B',
    description: 'Gérer les paramètres globaux de votre espace GESTMONEY.',
    articles: [
      {
        id: 'notifications-parametres',
        titre: 'Configurer les notifications',
        objectif: 'Choisir quelles alertes recevoir par email et dans l\'application.',
        roles: ['ADMIN', 'MANAGER'],
        tags: ['notifications', 'email', 'alertes', 'configuration'],
        contenu: `<p>Depuis <strong>Paramètres → Notifications</strong> :</p>
<ul>
  <li><strong>Alertes float</strong> — Email quand le float atteint les seuils configurés</li>
  <li><strong>Transactions en attente</strong> — Notification push et email</li>
  <li><strong>Rapports mensuels</strong> — Email automatique le 1er du mois</li>
  <li><strong>Tickets support</strong> — Notification de réponse</li>
  <li><strong>Connexions suspectes</strong> — Alerte email en cas de connexion depuis un nouvel appareil</li>
</ul>`,
      },
    ],
  },
  {
    id: 'abonnements',
    titre: 'Abonnements & Licences',
    icone: CreditCard,
    couleur: '#F59E0B',
    description: 'Gérer votre abonnement, mettre à jour la licence et consulter la facturation.',
    articles: [
      {
        id: 'plans-disponibles',
        titre: 'Plans et fonctionnalités',
        objectif: 'Comprendre les différents plans disponibles et leurs limites.',
        roles: ['ADMIN'],
        tags: ['plan', 'abonnement', 'licence', 'fonctionnalités', 'limites'],
        contenu: `<table>
  <thead><tr><th>Plan</th><th>Agents</th><th>Transactions/mois</th><th>IA SARA</th><th>Support</th></tr></thead>
  <tbody>
    <tr><td><strong>Starter</strong></td><td>Jusqu'à 5</td><td>1 000</td><td>Basique</td><td>Email 8h</td></tr>
    <tr><td><strong>Business</strong></td><td>Jusqu'à 25</td><td>10 000</td><td>Avancée</td><td>Email 4h</td></tr>
    <tr><td><strong>Enterprise</strong></td><td>Illimité</td><td>Illimité</td><td>Complète</td><td>Prioritaire 2h</td></tr>
  </tbody>
</table>
<p>Pour changer de plan : <strong>Paramètres → Abonnement → Changer de plan</strong></p>`,
      },
    ],
  },
  {
    id: 'support',
    titre: 'Support & Tickets',
    icone: LifeBuoy,
    couleur: '#EF4444',
    description: 'Contacter le support technique et gérer vos tickets.',
    articles: [
      {
        id: 'ouvrir-ticket',
        titre: 'Ouvrir un ticket de support',
        objectif: 'Signaler un problème technique ou une demande d\'assistance.',
        roles: ['Tous les rôles'],
        tags: ['ticket', 'support', 'problème', 'assistance', 'help'],
        contenu: `<p>Depuis <strong>Support → Nouveau ticket</strong> :</p>
<ol>
  <li>Renseignez le <strong>titre</strong> du problème (ex: "Transaction bloquée depuis 24h")</li>
  <li>Sélectionnez la <strong>catégorie</strong> (Technique, Transaction, Float, Agent, Facturation)</li>
  <li>Choisissez la <strong>priorité</strong> (Basse, Normale, Haute, Urgente)</li>
  <li>Décrivez le problème en détail : <em>étapes pour reproduire, messages d'erreur, références de transactions</em></li>
  <li>Joignez une capture d'écran si nécessaire</li>
  <li>Cliquez sur <strong>Envoyer le ticket</strong></li>
</ol>
<h4>Délais de réponse :</h4>
<ul>
  <li>Priorité Urgente : &lt; 2h en jours ouvrés</li>
  <li>Priorité Haute : &lt; 4h en jours ouvrés</li>
  <li>Priorité Normale : &lt; 8h en jours ouvrés</li>
</ul>`,
        liensConnexes: [{ label: 'Page Support', href: '/dashboard/support' }],
      },
    ],
  },
  {
    id: 'sara',
    titre: 'Assistant IA SARA',
    icone: Bot,
    couleur: '#8B5CF6',
    description: 'Utiliser SARA, votre assistant IA intégré à GESTMONEY.',
    articles: [
      {
        id: 'quest-ce-que-sara',
        titre: 'Qu\'est-ce que SARA ?',
        objectif: 'Comprendre les capacités et les limites de l\'assistant IA SARA.',
        roles: ['Tous les rôles'],
        tags: ['sara', 'ia', 'assistant', 'intelligence artificielle', 'chatbot'],
        contenu: `<p><strong>SARA</strong> (Smart Assistant for Real-time Assistance) est l'assistant IA intégré à GESTMONEY, disponible en bas à droite de l'écran.</p>
<h4>Ce que SARA peut faire :</h4>
<ul>
  <li>Répondre à vos questions sur les fonctionnalités de GESTMONEY</li>
  <li>Vous guider étape par étape dans les procédures</li>
  <li>Expliquer les statuts, erreurs et alertes</li>
  <li>Vous orienter vers le bon module ou la bonne documentation</li>
  <li>Répondre en français et en anglais</li>
</ul>
<h4>Limites actuelles :</h4>
<ul>
  <li>SARA ne peut pas effectuer d'actions à votre place (créer une transaction, ajouter un agent…)</li>
  <li>SARA ne connaît pas vos données spécifiques (montants exacts, noms de vos agents)</li>
</ul>`,
        conseils: ['Cliquez sur le bouton vert en bas à droite pour ouvrir SARA.', 'Soyez précis dans vos questions pour obtenir de meilleures réponses.'],
      },
      {
        id: 'utiliser-sara',
        titre: 'Bien utiliser SARA',
        objectif: 'Formuler des questions efficaces pour obtenir des réponses utiles.',
        roles: ['Tous les rôles'],
        tags: ['sara', 'questions', 'utilisation', 'conseils'],
        contenu: `<h4>Exemples de questions efficaces :</h4>
<ul>
  <li>"Comment enregistrer une transaction de retrait Wave ?"</li>
  <li>"Que faire quand mon float Orange Money est bas ?"</li>
  <li>"Comment exporter les transactions du mois en Excel ?"</li>
  <li>"Quelle est la différence entre un AGENT et un MANAGER ?"</li>
  <li>"Comment configurer une alerte de seuil float ?"</li>
</ul>
<h4>Suggestions contextuelles :</h4>
<p>SARA propose des suggestions de questions en début de conversation. Cliquez dessus pour démarrer rapidement.</p>`,
      },
    ],
  },
];

// ─── Composant Article ────────────────────────────────────────────────────────

function ArticleCard({ article, couleurSection }: { article: Article; couleurSection: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className={clsx('border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all', ouvert && 'shadow-sm')}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-text-main">{article.titre}</p>
          <p className="text-xs text-text-muted mt-0.5">{article.objectif}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {article.roles.map((r) => (
              <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/08 text-text-muted">{r}</span>
            ))}
          </div>
        </div>
        {ouvert
          ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
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
                  <AlertTriangle size={13} className="text-[#b8960a] dark:text-[#FFD000] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#92740a] dark:text-[#FFD000]">{a}</p>
                </div>
              ))}
            </div>
          )}

          {article.liensConnexes && article.liensConnexes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.liensConnexes.map((l) => (
                <a key={l.href} href={l.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#009E00] hover:underline">
                  {l.label} <ChevronRight size={11} />
                </a>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/05 text-text-muted rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function GuidePage() {
  const [recherche, setRecherche] = useState('');
  const [sectionActive, setSectionActive] = useState<string | null>(null);

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

  const sectionsFiltrees = sectionActive ? SECTIONS.filter((s) => s.id === sectionActive) : SECTIONS;
  const totalArticles = SECTIONS.reduce((n, s) => n + s.articles.length, 0);

  const handleExportPdf = () => {
    const lignes = SECTIONS.flatMap((s) =>
      s.articles.map((a) => ({
        section: s.titre,
        article: a.titre,
        roles: a.roles.join(', '),
        tags: a.tags.join(', '),
      }) as Record<string, unknown>)
    );
    exporterPdf(
      lignes,
      [
        { titre: 'Section', valeur: (r) => String(r.section) },
        { titre: 'Article', valeur: (r) => String(r.article) },
        { titre: 'Rôles', valeur: (r) => String(r.roles) },
        { titre: 'Mots-clés', valeur: (r) => String(r.tags) },
      ],
      { titre: 'Guide Utilisateur GESTMONEY', sousTitre: `${totalArticles} articles — Documentation complète` }
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#009E00]/10 flex items-center justify-center">
            <BookOpen size={20} className="text-[#009E00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Guide Utilisateur</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Documentation complète GESTMONEY — {totalArticles} articles · {SECTIONS.length} sections
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aide" className="flex items-center gap-2 text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors">
            ← Centre d&apos;aide
          </Link>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors"
          >
            <Download size={15} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher dans le guide… (ex: transaction, float, agent, 2FA)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#009E00]/30 focus:border-[#009E00] transition-all"
        />
        {recherche && (
          <button onClick={() => setRecherche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs">
            Effacer
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      {recherche.trim() && (
        <div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {resultatsRecherche.length} résultat{resultatsRecherche.length !== 1 ? 's' : ''} pour &ldquo;{recherche}&rdquo;
          </p>
          {resultatsRecherche.length === 0 ? (
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-10 text-center">
              <p className="text-text-muted text-sm">Aucun article trouvé. Essayez d&apos;autres mots-clés.</p>
              <Link href="/dashboard/faq" className="text-[#009E00] text-sm font-semibold mt-3 inline-flex items-center gap-1">
                Consulter la FAQ complète <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {resultatsRecherche.map(({ section, article }) => (
                <div key={article.id} className="bg-white dark:bg-white/03 rounded-xl border border-gray-100 dark:border-white/08 overflow-hidden">
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <section.icone size={13} style={{ color: section.couleur }} />
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{section.titre}</span>
                  </div>
                  <ArticleCard article={article} couleurSection={section.couleur} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation sections (si pas de recherche) */}
      {!recherche.trim() && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSectionActive(null)}
              className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', !sectionActive ? 'bg-[#009E00] text-white' : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-[#009E00] hover:text-[#009E00]')}
            >
              Toutes les sections
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionActive(sectionActive === s.id ? null : s.id)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', sectionActive === s.id ? 'text-white' : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:text-text-main')}
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
              <div key={section.id} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
                <div
                  className="px-6 py-5 flex items-center gap-4 border-b border-gray-100 dark:border-white/08"
                  style={{ borderLeftWidth: 4, borderLeftColor: section.couleur, borderLeftStyle: 'solid' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.couleur + '18' }}>
                    <section.icone size={19} style={{ color: section.couleur }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-text-main">{section.titre}</h2>
                    <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-1 rounded-full flex-shrink-0">
                    {section.articles.length} article{section.articles.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {section.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} couleurSection={section.couleur} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA bas de page */}
          <div className="bg-gradient-to-r from-[#009E00]/10 to-[#FFD000]/10 rounded-2xl border border-[#009E00]/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-text-main">Vous n&apos;avez pas trouvé la réponse ?</h3>
              <p className="text-sm text-text-muted mt-1">Consultez les 100 FAQ ou ouvrez un ticket de support.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/dashboard/faq"
                className="flex items-center gap-2 bg-white dark:bg-white/08 text-text-main text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/12 transition-colors"
              >
                <HelpCircle size={14} /> 100 FAQ
              </Link>
              <Link
                href="/dashboard/support"
                className="flex items-center gap-2 bg-[#009E00] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#007a00] transition-colors"
              >
                <CheckCircle2 size={14} /> Ouvrir un ticket
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

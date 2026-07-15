'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HelpCircle, Search, ChevronDown, ChevronRight, Tag, BookOpen, LifeBuoy } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FAQ {
  id: string;
  question: string;
  reponse: string;
  categorie: string;
  module: string;
  roles: string[];
  motsCles: string[];
}

// ─── 100 FAQ ────────────────────────────────────────────────────────────────

const FAQS: FAQ[] = [
  // ── Général (10) ──────────────────────────────────────────────────────────
  {
    id: 'g1',
    question: 'Qu\'est-ce que GESTMONEY ?',
    reponse: 'GESTMONEY est un ERP SaaS spécialisé Mobile Money conçu pour l\'Afrique subsaharienne et la zone OHADA. Il permet aux opérateurs, réseaux d\'agents et institutions financières de gérer les transactions Mobile Money (dépôts, retraits, transferts), le float, les agents, les commissions et les rapports depuis une interface centralisée accessible sur navigateur et mobile.',
    categorie: 'Général',
    module: 'Général',
    roles: ['Tous'],
    motsCles: ['gestmoney', 'présentation', 'erp', 'mobile money', 'saas', 'afrique'],
  },
  {
    id: 'g2',
    question: 'Quels navigateurs sont supportés ?',
    reponse: 'GESTMONEY fonctionne sur tous les navigateurs modernes : Chrome (recommandé), Firefox, Edge, Safari et Opera. La version minimale recommandée est Chrome 90+. L\'application est également disponible en tant que PWA (Progressive Web App) installable sur votre téléphone Android ou iPhone sans passer par un store.',
    categorie: 'Général',
    module: 'Général',
    roles: ['Tous'],
    motsCles: ['navigateur', 'chrome', 'firefox', 'mobile', 'pwa', 'compatibilité'],
  },
  {
    id: 'g3',
    question: 'GESTMONEY est-il disponible en anglais ?',
    reponse: 'Oui. GESTMONEY est disponible en français (langue par défaut) et en anglais. Pour changer la langue : allez dans Paramètres → Général → Langue, choisissez "English" et sauvegardez. L\'interface se met à jour immédiatement. L\'assistant IA SARA répond également dans les deux langues.',
    categorie: 'Général',
    module: 'Paramètres',
    roles: ['Tous'],
    motsCles: ['langue', 'anglais', 'français', 'internationalisation', 'i18n'],
  },
  {
    id: 'g4',
    question: 'Comment accéder à GESTMONEY sur mobile ?',
    reponse: 'GESTMONEY est accessible depuis le navigateur mobile de votre téléphone (Chrome, Safari). Pour une expérience optimale, installez-le comme PWA : sur Chrome Android, appuyez sur les 3 points → "Ajouter à l\'écran d\'accueil". Sur iPhone Safari, appuyez sur Partager → "Sur l\'écran d\'accueil". L\'application fonctionne ensuite comme une app native.',
    categorie: 'Général',
    module: 'Général',
    roles: ['Tous'],
    motsCles: ['mobile', 'pwa', 'téléphone', 'application', 'android', 'iphone'],
  },
  {
    id: 'g5',
    question: 'Quelle est la disponibilité (uptime) de GESTMONEY ?',
    reponse: 'GESTMONEY garantit une disponibilité de 99,5% par mois (SLA). La page d\'état des services est accessible depuis le Centre d\'aide. Des maintenances programmées sont annoncées au moins 48h à l\'avance par email et notification dans l\'application. Pour les incidents, le support est joignable à support@ibigsoft.com.',
    categorie: 'Général',
    module: 'Général',
    roles: ['Tous'],
    motsCles: ['uptime', 'disponibilité', 'sla', 'maintenance', 'incident'],
  },
  {
    id: 'g6',
    question: 'Comment contacter le support IBIG Soft ?',
    reponse: 'Plusieurs canaux sont disponibles : (1) Ticket de support dans l\'application (Support → Nouveau ticket) — recommandé, permet un suivi complet. (2) Email : support@ibigsoft.com — réponse sous 4h en jours ouvrés. (3) WhatsApp business pour les urgences (disponible sur le plan Enterprise). L\'assistant IA SARA peut également répondre à la plupart de vos questions 24h/24.',
    categorie: 'Général',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['support', 'contact', 'email', 'ticket', 'ibig soft', 'aide'],
  },
  {
    id: 'g7',
    question: 'Les données sont-elles sécurisées et confidentielles ?',
    reponse: 'Oui. GESTMONEY applique les meilleures pratiques de sécurité : chiffrement TLS 1.3 en transit, chiffrement AES-256 au repos, isolation multi-tenant stricte (vos données sont inaccessibles aux autres clients), journalisation de toutes les actions (audit log), et conformité RGPD/OHADA. Les serveurs sont hébergés dans des datacenters certifiés ISO 27001.',
    categorie: 'Général',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['sécurité', 'données', 'confidentialité', 'chiffrement', 'rgpd', 'conformité'],
  },
  {
    id: 'g8',
    question: 'Comment mettre à jour GESTMONEY ?',
    reponse: 'GESTMONEY étant un SaaS, les mises à jour sont automatiques et transparentes. Vous bénéficiez toujours de la dernière version sans aucune action de votre part. Les nouvelles fonctionnalités sont annoncées dans la section "Nouveautés" du Centre d\'aide et par email. Aucune installation ou maintenance n\'est requise de votre côté.',
    categorie: 'Général',
    module: 'Général',
    roles: ['Tous'],
    motsCles: ['mise à jour', 'version', 'saas', 'automatique', 'nouveautés'],
  },
  {
    id: 'g9',
    question: 'Puis-je utiliser GESTMONEY pour plusieurs sociétés ?',
    reponse: 'GESTMONEY utilise une architecture multi-tenant. Chaque société dispose d\'un espace isolé (tenant) avec ses propres données, agents et configurations. Si vous gérez plusieurs entités, chaque société doit avoir son propre abonnement. Un SUPER_ADMIN peut accéder à la console SuperAdmin pour superviser tous les tenants depuis une vue unifiée.',
    categorie: 'Général',
    module: 'Général',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    motsCles: ['multi-tenant', 'plusieurs sociétés', 'super admin', 'entités'],
  },
  {
    id: 'g10',
    question: 'Quels opérateurs Mobile Money sont supportés ?',
    reponse: 'GESTMONEY supporte nativement : Orange Money (CI, SN, CM, ML, BF, GN), Wave (SN, CI), MTN Mobile Money (CI, GH, CM, UG), Moov Money (CI, BF, TG, BJ), Airtel Money (UG, KE, TZ, NG), M-Pesa (KE, TZ, GH). Tout opérateur disposant d\'une API REST peut être intégré en mode personnalisé. Contactez le support pour les intégrations sur mesure.',
    categorie: 'Général',
    module: 'Transactions',
    roles: ['Tous'],
    motsCles: ['opérateur', 'orange money', 'wave', 'mtn', 'moov', 'airtel', 'mpesa'],
  },

  // ── Connexion / Sécurité (10) ─────────────────────────────────────────────
  {
    id: 'cs1',
    question: 'Comment réinitialiser mon mot de passe oublié ?',
    reponse: 'Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre adresse email et cliquez sur "Envoyer le lien". Vous recevrez un email contenant un lien de réinitialisation valable 1 heure. Cliquez sur ce lien, choisissez un nouveau mot de passe (minimum 12 caractères, avec majuscules, chiffres et symboles), puis reconnectez-vous avec vos nouveaux identifiants.',
    categorie: 'Connexion / Sécurité',
    module: 'Authentification',
    roles: ['Tous'],
    motsCles: ['mot de passe', 'oublié', 'réinitialisation', 'email', 'connexion'],
  },
  {
    id: 'cs2',
    question: 'Comment activer la double authentification (2FA) ?',
    reponse: 'Allez dans Paramètres → Sécurité → Double authentification, puis cliquez sur "Activer la 2FA". Scannez le QR code avec une application authenticator (Google Authenticator, Authy ou Microsoft Authenticator). Saisissez le code à 6 chiffres affiché par l\'application pour confirmer l\'activation. À chaque connexion future, vous devrez saisir ce code en plus de votre mot de passe. Conservez impérativement vos codes de secours.',
    categorie: 'Connexion / Sécurité',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['2fa', 'double authentification', 'totp', 'google authenticator', 'sécurité'],
  },
  {
    id: 'cs3',
    question: 'Ma session a expiré, que faire ?',
    reponse: 'Les sessions GESTMONEY expirent après 8 heures d\'inactivité par mesure de sécurité. Reconnectez-vous simplement avec vos identifiants. Si vous avez activé la 2FA, vous devrez aussi saisir votre code. Pour prolonger votre session, assurez-vous de rester actif dans l\'application. Sur les postes partagés, il est recommandé de vous déconnecter manuellement après chaque utilisation.',
    categorie: 'Connexion / Sécurité',
    module: 'Authentification',
    roles: ['Tous'],
    motsCles: ['session', 'expirée', 'déconnexion', 'reconnexion', 'inactivité'],
  },
  {
    id: 'cs4',
    question: 'Comment changer mon adresse email de connexion ?',
    reponse: 'Pour changer votre email : Paramètres → Mon profil → Informations personnelles → Modifier l\'email. Saisissez votre nouvel email et votre mot de passe actuel pour confirmer. Un email de vérification est envoyé à la nouvelle adresse. Cliquez sur le lien de vérification pour finaliser le changement. L\'ancienne adresse n\'est plus utilisable après confirmation.',
    categorie: 'Connexion / Sécurité',
    module: 'Profil',
    roles: ['Tous'],
    motsCles: ['email', 'adresse', 'modifier', 'changer', 'profil'],
  },
  {
    id: 'cs5',
    question: 'Mon compte est bloqué, que faire ?',
    reponse: 'Un compte se bloque après 5 tentatives de connexion échouées consécutives (protection anti-brute force). Le déblocage est automatique après 30 minutes. Pour un déblocage immédiat : contactez votre administrateur GESTMONEY qui peut débloquer le compte depuis Paramètres → Utilisateurs → [votre compte] → Actions → Débloquer. En cas d\'urgence, contactez support@ibigsoft.com.',
    categorie: 'Connexion / Sécurité',
    module: 'Authentification',
    roles: ['Tous'],
    motsCles: ['compte bloqué', 'tentatives', 'déblocage', 'brute force', 'admin'],
  },
  {
    id: 'cs6',
    question: 'Comment changer mon mot de passe (sans l\'avoir oublié) ?',
    reponse: 'Allez dans Paramètres → Sécurité → Changer le mot de passe. Saisissez votre mot de passe actuel, puis entrez et confirmez le nouveau mot de passe. Le nouveau mot de passe doit contenir au minimum 12 caractères dont au moins une majuscule, un chiffre et un symbole spécial. Cliquez sur "Enregistrer". Votre nouvelle session continue sans interruption.',
    categorie: 'Connexion / Sécurité',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['mot de passe', 'changer', 'modifier', 'sécurité', 'paramètres'],
  },
  {
    id: 'cs7',
    question: 'Puis-je me connecter depuis plusieurs navigateurs ou appareils simultanément ?',
    reponse: 'Oui, GESTMONEY permet les sessions simultanées sur plusieurs appareils. Cependant, pour les rôles ADMIN et MANAGER, une alerte email est envoyée lors d\'une connexion depuis un nouvel appareil. Vous pouvez consulter et révoquer les sessions actives dans Paramètres → Sécurité → Sessions actives. Il est recommandé de ne pas partager vos identifiants avec d\'autres personnes.',
    categorie: 'Connexion / Sécurité',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['multi-appareils', 'sessions', 'navigateurs', 'simultané', 'connexion'],
  },
  {
    id: 'cs8',
    question: 'Comment désactiver la 2FA si j\'ai perdu mon téléphone ?',
    reponse: 'Si vous avez perdu votre téléphone et ne pouvez plus accéder à votre application authenticator, utilisez un de vos codes de secours (fournis lors de l\'activation de la 2FA). Sur la page de connexion, après votre email et mot de passe, cliquez sur "Utiliser un code de secours". Si vous n\'avez plus ces codes, contactez d\'urgence support@ibigsoft.com avec votre preuve d\'identité.',
    categorie: 'Connexion / Sécurité',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['2fa', 'perte téléphone', 'codes secours', 'désactiver', 'récupération'],
  },
  {
    id: 'cs9',
    question: 'Comment réinitialiser le mot de passe d\'un agent ?',
    reponse: 'Un MANAGER ou ADMIN peut réinitialiser le mot de passe d\'un agent depuis : Agents → [Nom de l\'agent] → Actions → Réinitialiser le mot de passe. Un email est automatiquement envoyé à l\'agent avec un lien de réinitialisation valable 24 heures. L\'agent devra définir un nouveau mot de passe à sa prochaine connexion. Il est impossible de voir le mot de passe actuel d\'un agent (stocké en hash).',
    categorie: 'Connexion / Sécurité',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['mot de passe agent', 'réinitialisation', 'manager', 'email'],
  },
  {
    id: 'cs10',
    question: 'Comment consulter le journal d\'audit des connexions et actions ?',
    reponse: 'Le journal d\'audit est accessible pour les rôles ADMIN et AUDITOR dans Paramètres → Journal d\'audit. Il liste toutes les actions effectuées dans l\'application : connexions, transactions créées, modifications de paramètres, réinitialisations de mot de passe, avec date, heure, utilisateur et adresse IP. Ce journal est immuable et peut être exporté en CSV pour archivage.',
    categorie: 'Connexion / Sécurité',
    module: 'Sécurité',
    roles: ['ADMIN', 'AUDITOR'],
    motsCles: ['journal audit', 'logs', 'historique actions', 'connexions', 'traçabilité'],
  },

  // ── Utilisateurs / Permissions (10) ──────────────────────────────────────
  {
    id: 'up1',
    question: 'Quelle est la différence entre un AGENT et un MANAGER ?',
    reponse: 'Un AGENT peut uniquement enregistrer des transactions (dépôts, retraits, transferts) et consulter ses propres performances. Un MANAGER a un accès élargi : il peut valider/rejeter des transactions en attente, ajouter et gérer des agents, consulter les rapports de tout le réseau, configurer les commissions et exporter les données. Le MANAGER peut aussi réinitialiser les mots de passe des agents.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Permissions',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['agent', 'manager', 'différence', 'rôles', 'permissions', 'droits'],
  },
  {
    id: 'up2',
    question: 'Comment ajouter un nouvel utilisateur dans GESTMONEY ?',
    reponse: 'Pour ajouter un utilisateur : Agents → Ajouter un agent (pour un agent/supervisor de terrain) ou Paramètres → Utilisateurs → Inviter un utilisateur (pour un manager/admin/auditor). Renseignez le prénom, nom, email et rôle. GESTMONEY envoie automatiquement un email d\'invitation avec les identifiants temporaires. L\'utilisateur doit changer son mot de passe à sa première connexion.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Agents',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['ajouter utilisateur', 'invitation', 'créer compte', 'nouvel agent'],
  },
  {
    id: 'up3',
    question: 'Comment modifier le rôle d\'un utilisateur ?',
    reponse: 'Pour modifier le rôle d\'un utilisateur (nécessite le rôle ADMIN) : Paramètres → Utilisateurs → [Nom de l\'utilisateur] → Modifier → Rôle. Sélectionnez le nouveau rôle et sauvegardez. Le changement prend effet immédiatement : si l\'utilisateur est connecté, ses droits changent dès sa prochaine action. Note : un ADMIN ne peut pas modifier le rôle d\'un autre ADMIN sans passer par un SUPER_ADMIN.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Paramètres',
    roles: ['ADMIN'],
    motsCles: ['rôle', 'modifier', 'changer', 'permissions', 'droits', 'admin'],
  },
  {
    id: 'up4',
    question: 'Comment désactiver le compte d\'un agent qui a quitté l\'entreprise ?',
    reponse: 'Pour désactiver un compte sans le supprimer (les données et historiques sont conservés) : Agents → [Nom de l\'agent] → Actions → Désactiver le compte. L\'agent ne pourra plus se connecter. Ses transactions passées restent visibles dans les rapports. Si vous souhaitez réactiver le compte plus tard : même menu → Réactiver. La désactivation est recommandée plutôt que la suppression pour conserver l\'audit trail.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['désactiver', 'compte agent', 'quitter', 'départ', 'désactivation'],
  },
  {
    id: 'up5',
    question: 'Un agent peut-il voir les transactions des autres agents ?',
    reponse: 'Non. Un AGENT ne voit que ses propres transactions et ses propres performances. Il ne peut pas accéder aux données des autres agents ni aux rapports globaux. Un SUPERVISOR d\'agence peut voir les transactions des agents de son agence. Un MANAGER peut voir toutes les transactions du réseau. Un AUDITOR a une vue en lecture seule de toutes les données.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Permissions',
    roles: ['Tous'],
    motsCles: ['agent', 'visibilité', 'transactions autres', 'isolation', 'permissions'],
  },
  {
    id: 'up6',
    question: 'Qu\'est-ce que le rôle AUDITOR et quand l\'utiliser ?',
    reponse: 'L\'AUDITOR est un rôle en lecture seule conçu pour les contrôleurs internes, experts-comptables ou auditeurs externes. Il peut consulter toutes les transactions, rapports, journaux d\'audit et données du réseau sans pouvoir modifier quoi que ce soit. C\'est le rôle idéal pour donner un accès de consultation à un cabinet d\'audit ou à votre service de conformité sans risque de modification accidentelle.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Permissions',
    roles: ['ADMIN'],
    motsCles: ['auditor', 'auditeur', 'lecture seule', 'contrôle', 'conformité'],
  },
  {
    id: 'up7',
    question: 'Peut-on limiter les montants de transaction qu\'un agent peut traiter ?',
    reponse: 'Oui. Un ADMIN peut définir des limites de transaction par agent ou par agence depuis : Agents → [Nom de l\'agent] → Paramètres → Limites. Il est possible de définir : un montant maximum par transaction, un plafond journalier et un plafond mensuel. Les transactions dépassant ces limites sont automatiquement bloquées et signalées au superviseur.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Agents',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['limite', 'plafond', 'montant maximum', 'agent', 'restriction'],
  },
  {
    id: 'up8',
    question: 'Comment attribuer un agent à une agence spécifique ?',
    reponse: 'Lors de la création d\'un agent, vous choisissez l\'agence à laquelle il est rattaché. Pour modifier l\'agence d\'un agent existant : Agents → [Nom de l\'agent] → Modifier → Agence. Sélectionnez la nouvelle agence et sauvegardez. Un agent peut être rattaché à une seule agence à la fois. Le transfert d\'agence est enregistré dans le journal d\'audit.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['agence', 'rattacher', 'agent', 'transfert', 'point de vente'],
  },
  {
    id: 'up9',
    question: 'Quelle est la différence entre un SUPERVISOR et un MANAGER ?',
    reponse: 'Le SUPERVISOR supervise une ou plusieurs agences spécifiques : il voit les transactions et les agents de ses agences, peut valider des transactions en attente dans son périmètre. Le MANAGER a une portée globale sur tout le réseau du tenant : il gère tous les agents, toutes les agences, les commissions, les configurations et accède à tous les rapports. Le MANAGER peut également créer/supprimer des SUPERVISOR.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Permissions',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['supervisor', 'manager', 'différence', 'agence', 'périmètre'],
  },
  {
    id: 'up10',
    question: 'Comment voir la liste de tous les utilisateurs actifs ?',
    reponse: 'La liste complète des utilisateurs est accessible dans Paramètres → Utilisateurs (pour ADMIN) ou Agents (pour MANAGER). Vous pouvez filtrer par rôle, statut (actif/inactif), agence ou date de création. La liste inclut : nom, email, rôle, agence, date de dernière connexion et statut du compte. Elle est exportable en CSV pour la gestion RH.',
    categorie: 'Utilisateurs / Permissions',
    module: 'Paramètres',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['liste utilisateurs', 'actifs', 'utilisateurs', 'gestion', 'rh'],
  },

  // ── Paramètres (10) ───────────────────────────────────────────────────────
  {
    id: 'p1',
    question: 'Comment ajouter un nouvel opérateur Mobile Money ?',
    reponse: 'Allez dans Paramètres → Opérateurs → Ajouter un opérateur. Sélectionnez l\'opérateur dans la liste ou choisissez "Personnalisé". Renseignez les credentials API fournis par l\'opérateur (clé API, secret, URL d\'endpoint). Configurez les seuils de float et les taux de commission. Cliquez sur "Tester la connexion" pour valider, puis sur "Activer". L\'opérateur apparaît dans tous les formulaires de transaction.',
    categorie: 'Paramètres',
    module: 'Opérateurs',
    roles: ['ADMIN'],
    motsCles: ['opérateur', 'ajouter', 'api', 'configuration', 'mobile money'],
  },
  {
    id: 'p2',
    question: 'Comment modifier le logo de ma société sur les PDF et rapports ?',
    reponse: 'Allez dans Paramètres → Société → Logo. Cliquez sur "Changer le logo" et téléchargez votre fichier PNG ou SVG (taille recommandée : 400x100px, fond transparent). Cliquez sur "Enregistrer". Le nouveau logo apparaît immédiatement sur les nouveaux PDF, rapports et reçus générés. Les anciens documents ne sont pas rétroactivement modifiés.',
    categorie: 'Paramètres',
    module: 'Paramètres Société',
    roles: ['ADMIN'],
    motsCles: ['logo', 'société', 'pdf', 'rapports', 'image', 'branding'],
  },
  {
    id: 'p3',
    question: 'Comment configurer le fuseau horaire ?',
    reponse: 'Le fuseau horaire est critique : il affecte l\'horodatage de toutes les transactions et la date de génération des rapports. Pour le configurer : Paramètres → Société → Fuseau horaire. Sélectionnez votre fuseau (ex: "Africa/Abidjan" pour la Côte d\'Ivoire, "Africa/Dakar" pour le Sénégal). Attention : modifier le fuseau après des transactions crée des décalages dans les rapports historiques.',
    categorie: 'Paramètres',
    module: 'Paramètres Société',
    roles: ['ADMIN'],
    motsCles: ['fuseau horaire', 'timezone', 'heure', 'configuration', 'afrique'],
  },
  {
    id: 'p4',
    question: 'Comment configurer les notifications email ?',
    reponse: 'Allez dans Paramètres → Notifications → Email. Vous pouvez configurer les alertes pour : float bas/critique (avec destinataires spécifiques), transactions en attente, rapports mensuels automatiques, nouveaux tickets de support, et connexions depuis nouveaux appareils. Chaque type d\'alerte peut être activé/désactivé indépendamment et envoyé à des adresses email différentes.',
    categorie: 'Paramètres',
    module: 'Notifications',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['notifications', 'email', 'alertes', 'configuration', 'paramètres'],
  },
  {
    id: 'p5',
    question: 'Comment configurer la devise affichée dans GESTMONEY ?',
    reponse: 'La devise est configurée au niveau de la société dans Paramètres → Société → Devise. GESTMONEY supporte : XOF (FCFA — défaut pour UEMOA), XAF (FCFA — Afrique Centrale), GHS (Cedi Ghana), NGN (Naira Nigeria), KES (Shilling Kenya), UGX (Shilling Ouganda). La devise affichée affecte l\'interface, les rapports et les PDF. Note : les montants ne sont pas convertis, seul le symbole change.',
    categorie: 'Paramètres',
    module: 'Paramètres Société',
    roles: ['ADMIN'],
    motsCles: ['devise', 'fcfa', 'xof', 'monnaie', 'symbole', 'currency'],
  },
  {
    id: 'p6',
    question: 'Comment activer ou désactiver un opérateur temporairement ?',
    reponse: 'Pour désactiver temporairement un opérateur (maintenance, problème technique) : Paramètres → Opérateurs → [Nom de l\'opérateur] → Désactiver. Les agents ne pourront plus créer de transactions sur cet opérateur. Les transactions existantes ne sont pas affectées. Pour réactiver : même procédure → Activer. Pensez à notifier vos agents du changement.',
    categorie: 'Paramètres',
    module: 'Opérateurs',
    roles: ['ADMIN'],
    motsCles: ['désactiver opérateur', 'maintenance', 'temporaire', 'activer', 'bloquer'],
  },
  {
    id: 'p7',
    question: 'Comment configurer les barèmes de commission ?',
    reponse: 'Les commissions se configurent dans Commissions → Barèmes. Pour chaque opérateur, définissez : le type (pourcentage ou montant fixe), le taux par type d\'opération (dépôt/retrait/transfert), et optionnellement des paliers (ex: 0,5% pour 0-100k FCFA, 1% pour 100k-1M FCFA). Les commissions sont calculées automatiquement à chaque transaction validée et agrégées dans les rapports de commissions.',
    categorie: 'Paramètres',
    module: 'Commissions',
    roles: ['ADMIN'],
    motsCles: ['commission', 'barème', 'taux', 'opérateur', 'configuration', 'palier'],
  },
  {
    id: 'p8',
    question: 'Comment relancer le wizard d\'onboarding ?',
    reponse: 'Le wizard de configuration initiale peut être relancé à tout moment depuis Paramètres → Guide de démarrage → Relancer le guide. Cela affiche à nouveau les 4 étapes de démarrage (Bienvenue, Opérateurs, Premier agent, Terminé). Utile pour la formation de nouveaux administrateurs ou pour reconfigurer rapidement les paramètres de base.',
    categorie: 'Paramètres',
    module: 'Paramètres',
    roles: ['ADMIN'],
    motsCles: ['wizard', 'onboarding', 'guide démarrage', 'relancer', 'configuration'],
  },
  {
    id: 'p9',
    question: 'Comment intégrer une API externe à GESTMONEY ?',
    reponse: 'GESTMONEY dispose d\'une API REST complète pour l\'intégration avec des systèmes tiers (comptabilité, CRM, BI). La documentation API est accessible dans Paramètres → API → Documentation. Pour générer une clé API : Paramètres → API → Créer une clé. Chaque clé a une portée (lecture/écriture), une date d\'expiration optionnelle et peut être révoquée à tout moment. Les appels API sont tracés dans le journal d\'audit.',
    categorie: 'Paramètres',
    module: 'API',
    roles: ['ADMIN'],
    motsCles: ['api', 'intégration', 'clé api', 'rest', 'externe', 'documentation'],
  },
  {
    id: 'p10',
    question: 'Comment configurer les messages de reçu de transaction ?',
    reponse: 'Les reçus de transaction peuvent être personnalisés dans Paramètres → Transactions → Modèle de reçu. Vous pouvez modifier : le pied de page (message de remerciement, mentions légales), les coordonnées de l\'agence affichées, l\'ajout de votre logo, et le format (thermique 58mm/80mm ou A5/A4). Ces paramètres s\'appliquent à tous les reçus générés par les agents.',
    categorie: 'Paramètres',
    module: 'Transactions',
    roles: ['ADMIN'],
    motsCles: ['reçu', 'impression', 'modèle', 'personnalisation', 'transaction'],
  },

  // ── Transactions (10) ─────────────────────────────────────────────────────
  {
    id: 't1',
    question: 'Comment enregistrer une transaction Mobile Money ?',
    reponse: 'Depuis Transactions → Nouvelle transaction : (1) Choisissez le type (Dépôt, Retrait ou Transfert), (2) Sélectionnez l\'opérateur, (3) Saisissez le montant en FCFA, (4) Entrez le numéro de téléphone du client, (5) Ajoutez la référence de l\'opérateur (code fourni par le réseau), (6) Optionnel : ajoutez une note interne, (7) Cliquez sur "Valider". La transaction est enregistrée et un reçu peut être imprimé immédiatement.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['AGENT', 'MANAGER', 'ADMIN'],
    motsCles: ['transaction', 'enregistrer', 'dépôt', 'retrait', 'transfert', 'mobile money'],
  },
  {
    id: 't2',
    question: 'Que faire si une transaction reste bloquée en "En attente" ?',
    reponse: 'Vérifiez d\'abord : (1) Le solde float de l\'opérateur concerné — un float insuffisant peut bloquer les retraits. (2) La référence opérateur — une référence invalide ou déjà utilisée bloque la transaction. Si le problème persiste, un MANAGER peut forcer la validation ou le rejet depuis Transactions → [Référence] → Actions → Valider manuellement / Rejeter. En cas de doute, contactez l\'opérateur avec la référence de transaction.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['Tous'],
    motsCles: ['transaction bloquée', 'en attente', 'float', 'référence', 'valider manuellement'],
  },
  {
    id: 't3',
    question: 'Peut-on annuler une transaction déjà validée ?',
    reponse: 'Une transaction validée ne peut pas être annulée directement dans GESTMONEY (elle est déjà traitée côté opérateur). Pour corriger une erreur : (1) Créez une transaction inverse (si c\'était un dépôt en erreur, créez un retrait du même montant). (2) Notez le motif de correction dans le champ "Note interne". (3) Pour des situations complexes (doublon, erreur de montant), contactez le support opérateur et ouvrez un ticket support GESTMONEY.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['annuler', 'transaction validée', 'correction', 'inverse', 'erreur'],
  },
  {
    id: 't4',
    question: 'Comment rechercher une transaction spécifique ?',
    reponse: 'Dans la page Transactions, utilisez la barre de recherche et les filtres disponibles : référence opérateur, numéro de téléphone client, montant exact, période (date début/fin), type (dépôt/retrait/transfert), opérateur, statut, agent, agence. Vous pouvez combiner plusieurs filtres. Pour retrouver une transaction par numéro de référence : utilisez ⌘K → tapez la référence → sélectionnez la transaction dans les suggestions.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['Tous'],
    motsCles: ['recherche', 'transaction', 'référence', 'filtre', 'retrouver'],
  },
  {
    id: 't5',
    question: 'Comment imprimer un reçu de transaction ?',
    reponse: 'Après la validation d\'une transaction, un bouton "Imprimer le reçu" apparaît immédiatement. Vous pouvez aussi imprimer le reçu d\'une transaction passée depuis Transactions → [Référence] → Imprimer le reçu. Le format d\'impression est configurable (thermique 58mm, 80mm, ou A5). Pour les imprimantes thermiques Bluetooth, GESTMONEY supporte l\'impression directe via la PWA mobile.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['AGENT', 'MANAGER'],
    motsCles: ['reçu', 'impression', 'imprimante', 'thermique', 'bluetooth'],
  },
  {
    id: 't6',
    question: 'Quel est le montant maximum par transaction ?',
    reponse: 'Le montant maximum par transaction dépend de deux limites : (1) La limite de l\'opérateur Mobile Money (ex: 1 000 000 FCFA pour un retrait Wave standard). (2) La limite configurée par votre administrateur dans GESTMONEY (Agents → Limites). Si une transaction dépasse la limite, elle est bloquée avec un message d\'erreur précisant la limite applicable. Contactez votre ADMIN pour ajuster les limites si nécessaire.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['Tous'],
    motsCles: ['montant maximum', 'limite', 'plafond', 'transaction', 'opérateur'],
  },
  {
    id: 't7',
    question: 'Comment importer des transactions en masse ?',
    reponse: 'GESTMONEY supporte l\'import en masse via CSV ou XLSX depuis Transactions → Importer. Téléchargez d\'abord le modèle de fichier ("Télécharger le modèle CSV"). Remplissez les colonnes requises (type, opérateur, montant, numéro client, référence, date). Chargez le fichier et cliquez sur "Valider l\'import". GESTMONEY vérifie chaque ligne et signale les erreurs avant l\'import définitif.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['import', 'en masse', 'csv', 'xlsx', 'batch', 'import groupé'],
  },
  {
    id: 't8',
    question: 'Comment configurer les alertes sur les grosses transactions ?',
    reponse: 'Pour recevoir une alerte quand une transaction dépasse un seuil : Paramètres → Notifications → Transactions → Alertes de montant. Définissez le montant seuil (ex: 500 000 FCFA). À chaque transaction dépassant ce montant, les gestionnaires désignés reçoivent un email et une notification dans l\'application. Utile pour la conformité et la surveillance anti-fraude.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['alerte transaction', 'gros montant', 'seuil', 'conformité', 'surveillance'],
  },
  {
    id: 't9',
    question: 'Comment voir le total des transactions par période ?',
    reponse: 'Plusieurs façons d\'obtenir les totaux par période : (1) Tableau de bord — widget "Transactions du jour/mois". (2) Rapports & BI — générez un rapport pour la période souhaitée. (3) Page Transactions — appliquez le filtre de période et consultez le récapitulatif en bas du tableau. (4) Export CSV/XLSX avec filtre de période pour un traitement externe dans Excel.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['MANAGER', 'ADMIN', 'AUDITOR'],
    motsCles: ['total transactions', 'période', 'récapitulatif', 'bilan', 'mois'],
  },
  {
    id: 't10',
    question: 'Quelle est la différence entre un dépôt, un retrait et un transfert ?',
    reponse: 'Dans GESTMONEY : (1) Dépôt — Un client dépose de l\'argent sur son compte Mobile Money (le float de l\'agent augmente). (2) Retrait — Un client retire de l\'argent depuis son compte Mobile Money (le float de l\'agent diminue). (3) Transfert — Envoi d\'argent d\'un numéro à un autre sans passage de cash (sans impact direct sur le float de l\'agent). Chaque type a un taux de commission potentiellement différent.',
    categorie: 'Transactions',
    module: 'Transactions',
    roles: ['Tous'],
    motsCles: ['dépôt', 'retrait', 'transfert', 'différence', 'type transaction', 'float'],
  },

  // ── Agents / Agences (10) ─────────────────────────────────────────────────
  {
    id: 'aa1',
    question: 'Comment ajouter un nouvel agent dans le réseau ?',
    reponse: 'Depuis Agents → Ajouter un agent : (1) Renseignez prénom, nom, email et téléphone. (2) Associez-le à une agence. (3) Choisissez son rôle (AGENT ou SUPERVISOR). (4) Définissez ses limites de transaction si nécessaire. (5) Cliquez sur "Créer l\'agent". Un email d\'invitation est automatiquement envoyé avec ses identifiants temporaires valables 48h. L\'agent devra changer son mot de passe à sa première connexion.',
    categorie: 'Agents / Agences',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['ajouter agent', 'créer', 'invitation', 'nouveau', 'réseau'],
  },
  {
    id: 'aa2',
    question: 'Comment consulter les performances d\'un agent ?',
    reponse: 'Depuis Agents → [Nom de l\'agent] : accédez à la fiche de performance avec le volume de transactions, montant total traité, ticket moyen, commissions générées et classement par rapport au réseau. Le tableau de bord principal affiche le Top Agent du mois. La page Performances présente le classement global avec graphiques d\'évolution. Un agent peut consulter ses propres performances mais pas celles des autres.',
    categorie: 'Agents / Agences',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'],
    motsCles: ['performances', 'agent', 'classement', 'kpi', 'statistiques', 'top agent'],
  },
  {
    id: 'aa3',
    question: 'Combien d\'agents peut-on créer dans GESTMONEY ?',
    reponse: 'Le nombre d\'agents dépend de votre plan : Starter (5 agents max), Business (25 agents max), Enterprise (illimité). Si vous atteignez la limite, GESTMONEY vous notifie et vous invite à upgrader votre plan. Les agents inactifs (désactivés) comptent dans le quota. Pour libérer des places, vous pouvez supprimer les comptes d\'agents définitivement partis (attention : la suppression est irréversible).',
    categorie: 'Agents / Agences',
    module: 'Agents',
    roles: ['ADMIN'],
    motsCles: ['nombre agents', 'limite', 'quota', 'plan', 'maximum'],
  },
  {
    id: 'aa4',
    question: 'Comment créer une nouvelle agence (point de vente) ?',
    reponse: 'Depuis Agences → Nouvelle agence : (1) Renseignez le nom de l\'agence. (2) Saisissez l\'adresse (ville, quartier, rue). (3) Désignez le superviseur responsable de l\'agence. (4) Associez les agents rattachés. (5) Activez les opérateurs disponibles sur ce point de vente. (6) Cliquez sur "Créer l\'agence". L\'agence apparaît dans les filtres de rapports et les formulaires de création d\'agents.',
    categorie: 'Agents / Agences',
    module: 'Agences',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['agence', 'créer', 'point de vente', 'nouveau', 'superviseur'],
  },
  {
    id: 'aa5',
    question: 'Comment voir le classement des agents du mois ?',
    reponse: 'Le classement des agents est disponible dans : (1) Tableau de bord — widget "Top agents" en page d\'accueil (Top 3 du mois). (2) Page Performances — classement complet avec volumes, montants et commissions. (3) Rapports & BI — le rapport mensuel inclut toujours le classement complet. Le classement peut être basé sur le volume (nombre de transactions) ou le montant total traité, selon les paramètres configurés.',
    categorie: 'Agents / Agences',
    module: 'Performances',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['classement agents', 'top agent', 'mois', 'performances', 'ranking'],
  },
  {
    id: 'aa6',
    question: 'Un agent peut-il être rattaché à plusieurs agences ?',
    reponse: 'Non, dans la version actuelle de GESTMONEY, un agent est rattaché à une seule agence à la fois. Si un agent travaille sur plusieurs points de vente en rotation, la solution recommandée est de le rattacher à l\'agence principale et d\'utiliser les notes de transaction pour identifier le point de vente de chaque opération. Le multi-agence par agent est une fonctionnalité prévue dans les prochaines versions.',
    categorie: 'Agents / Agences',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['agent', 'plusieurs agences', 'multi-agence', 'limitation', 'rotation'],
  },
  {
    id: 'aa7',
    question: 'Comment suivre les transactions d\'une agence spécifique ?',
    reponse: 'Pour filtrer les transactions par agence : (1) Page Transactions → Filtre "Agence" → sélectionnez l\'agence souhaitée. (2) Rapports & BI → Générez un rapport avec le filtre d\'agence activé. (3) Agences → [Nom de l\'agence] → onglet "Transactions" — affiche toutes les transactions de cette agence. Les exports respectent également le filtre d\'agence.',
    categorie: 'Agents / Agences',
    module: 'Agences',
    roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'],
    motsCles: ['transactions agence', 'filtrer', 'point de vente', 'suivi'],
  },
  {
    id: 'aa8',
    question: 'Comment gérer l\'absence d\'un agent (congé, maladie) ?',
    reponse: 'Pour gérer temporairement l\'absence d\'un agent : (1) Si l\'absence est courte (quelques jours), aucune action requise — les autres agents de l\'agence continuent les transactions. (2) Si l\'absence est longue, désactivez le compte de l\'agent (Agents → [Agent] → Désactiver) pour éviter toute utilisation non autorisée de ses identifiants. (3) Les transactions enregistrées pendant l\'absence par substitution seront attribuées à l\'agent qui les a réellement saisies.',
    categorie: 'Agents / Agences',
    module: 'Agents',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['absence agent', 'congé', 'désactiver', 'remplacement', 'temporaire'],
  },
  {
    id: 'aa9',
    question: 'Comment supprimer définitivement une agence ?',
    reponse: 'Pour supprimer une agence (irréversible) : Agences → [Nom de l\'agence] → Actions → Supprimer l\'agence. ATTENTION : la suppression est impossible si des agents actifs sont rattachés à cette agence ou si des transactions récentes y sont associées. Avant de supprimer : transférez les agents vers une autre agence, et assurez-vous que toutes les transactions sont finalisées. Il est souvent préférable de désactiver plutôt que de supprimer.',
    categorie: 'Agents / Agences',
    module: 'Agences',
    roles: ['ADMIN'],
    motsCles: ['supprimer agence', 'fermeture', 'désactivation', 'irréversible'],
  },
  {
    id: 'aa10',
    question: 'Comment comparer les performances de deux agences ?',
    reponse: 'Pour comparer des agences : (1) Rapports & BI → Générez un rapport avec le groupe "Par agence". (2) Page Agences → vue liste avec les KPIs de chaque agence (volume, montant, commissions). (3) Exportez en XLSX et utilisez les graphiques Excel pour une comparaison visuelle. La future version de GESTMONEY inclura un module de comparaison graphique multi-agences intégré.',
    categorie: 'Agents / Agences',
    module: 'Agences',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['comparer agences', 'performances', 'benchmark', 'rapport', 'kpi'],
  },

  // ── Float / Commissions (10) ──────────────────────────────────────────────
  {
    id: 'fc1',
    question: 'Qu\'est-ce que le float et pourquoi est-ce important ?',
    reponse: 'Le float est le solde que votre réseau détient chez chaque opérateur Mobile Money. Il représente votre capacité opérationnelle : un float élevé permet plus de retraits pour vos clients. Si le float est bas, les agents ne peuvent plus traiter les retraits (les fonds ne sont pas disponibles). GESTMONEY surveille les floats en temps réel et envoie des alertes automatiques. Une gestion proactive du float est essentielle pour la continuité des opérations.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['Tous'],
    motsCles: ['float', 'solde opérateur', 'capacité', 'liquidité', 'retrait'],
  },
  {
    id: 'fc2',
    question: 'Comment définir les seuils d\'alerte float ?',
    reponse: 'Dans Gestion Float → Paramètres Float → [Opérateur] : définissez le Seuil bas (premier niveau d\'alerte, ex: 500 000 FCFA) et le Seuil critique (alerte urgente + blocage optionnel des retraits, ex: 100 000 FCFA). Pour chaque seuil, choisissez les destinataires des alertes email. GESTMONEY envoie aussi des notifications push dans l\'application. Les seuils sont configurables par opérateur indépendamment.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['ADMIN', 'MANAGER'],
    motsCles: ['seuil float', 'alerte', 'configuration', 'bas', 'critique'],
  },
  {
    id: 'fc3',
    question: 'Comment enregistrer un approvisionnement (rechargement) de float ?',
    reponse: 'Un rechargement de float s\'enregistre dans Gestion Float → Approvisionner : sélectionnez l\'opérateur, saisissez le montant rechargé, la date de l\'opération et la référence du rechargement (numéro de virement ou référence opérateur). Cliquez sur "Valider". Le nouveau solde est mis à jour et l\'historique des rechargements est conservé pour la comptabilité. Les alertes de bas float cessent dès que le seuil est dépassé.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['rechargement float', 'approvisionnement', 'recharger', 'solde', 'opérateur'],
  },
  {
    id: 'fc4',
    question: 'Comment voir l\'historique du float par opérateur ?',
    reponse: 'L\'historique complet du float est accessible dans Gestion Float → Historique. Filtrez par opérateur et période pour visualiser : l\'évolution du solde, les rechargements effectués, les alertes déclenchées. Un graphique d\'évolution du float est disponible sur la page de chaque opérateur. Exportez l\'historique en CSV pour votre comptabilité de trésorerie.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['MANAGER', 'ADMIN', 'AUDITOR'],
    motsCles: ['historique float', 'évolution', 'graphique', 'opérateur', 'trésorerie'],
  },
  {
    id: 'fc5',
    question: 'Comment les commissions sont-elles calculées ?',
    reponse: 'Les commissions sont calculées automatiquement selon le barème configuré : taux × montant de la transaction (si mode pourcentage) ou montant fixe par transaction. Si des paliers sont définis, GESTMONEY applique le taux correspondant à la tranche du montant. Le calcul se fait à la validation de chaque transaction. Les commissions sont agrégées par agent, agence et opérateur dans des rapports dédiés.',
    categorie: 'Float / Commissions',
    module: 'Commissions',
    roles: ['Tous'],
    motsCles: ['calcul commission', 'taux', 'palier', 'automatique', 'pourcentage'],
  },
  {
    id: 'fc6',
    question: 'Quand les commissions sont-elles versées aux agents ?',
    reponse: 'GESTMONEY calcule et affiche les commissions en temps réel, mais leur versement réel aux agents (en espèces, virement ou Mobile Money) est géré manuellement par votre organisation selon votre politique interne (hebdomadaire, mensuelle, etc.). GESTMONEY vous donne le rapport des commissions dues à chaque agent pour la période, que vous pouvez exporter en XLSX pour faciliter le traitement.',
    categorie: 'Float / Commissions',
    module: 'Commissions',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['versement commission', 'paiement agent', 'période', 'mensuel', 'traitement'],
  },
  {
    id: 'fc7',
    question: 'Le float peut-il être négatif dans GESTMONEY ?',
    reponse: 'GESTMONEY empêche le float d\'aller en négatif si le blocage automatique est activé (seuil critique → blocage des retraits). Si le blocage automatique n\'est pas activé, théoriquement le float peut sembler négatif dans GESTMONEY si des transactions ont été enregistrées sans vérification du solde réel. Dans ce cas, un rechargement d\'urgence est nécessaire et une réconciliation avec l\'opérateur doit être effectuée.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['float négatif', 'dépassement', 'blocage', 'réconciliation', 'urgence'],
  },
  {
    id: 'fc8',
    question: 'Comment faire la réconciliation entre le float GESTMONEY et le solde réel opérateur ?',
    reponse: 'Pour réconcilier : (1) Obtenez le relevé de solde réel de l\'opérateur (via son application ou portail agent). (2) Comparez avec le solde affiché dans GESTMONEY pour cet opérateur. (3) Si écart : vérifiez les transactions des dernières 24h et identifiez les transactions non encore synchronisées ou les rechargements non encore enregistrés. (4) Corrigez le solde manuellement dans Gestion Float → Ajustement de solde avec justification.',
    categorie: 'Float / Commissions',
    module: 'Float',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['réconciliation', 'solde réel', 'écart', 'ajustement', 'rapprochement'],
  },
  {
    id: 'fc9',
    question: 'Les commissions changent-elles si le barème est modifié en cours de mois ?',
    reponse: 'Non, les commissions déjà calculées sur des transactions passées ne sont pas recalculées rétroactivement. Un changement de barème s\'applique uniquement aux nouvelles transactions créées après la date de modification. Pour éviter toute confusion, il est recommandé de modifier les barèmes en début de mois. GESTMONEY journalise toutes les modifications de barème avec la date et l\'auteur du changement.',
    categorie: 'Float / Commissions',
    module: 'Commissions',
    roles: ['ADMIN'],
    motsCles: ['modification barème', 'rétroactif', 'commissions', 'date', 'calcul'],
  },
  {
    id: 'fc10',
    question: 'Comment voir les commissions dues à un agent spécifique ?',
    reponse: 'Depuis Commissions → Par agent → [Nom de l\'agent] : consultez le détail des commissions par période, par opérateur et par type de transaction. Vous voyez le montant total dû, le détail transaction par transaction, et la comparaison avec le mois précédent. Ce rapport est exportable en PDF (format fiche de commission prête à être remise à l\'agent) ou en XLSX pour le traitement comptable.',
    categorie: 'Float / Commissions',
    module: 'Commissions',
    roles: ['MANAGER', 'ADMIN', 'SUPERVISOR'],
    motsCles: ['commissions agent', 'détail', 'fiche commission', 'export', 'montant dû'],
  },

  // ── Rapports / Exports (10) ───────────────────────────────────────────────
  {
    id: 're1',
    question: 'Comment exporter les transactions en Excel ?',
    reponse: 'Depuis la page Transactions : (1) Appliquez vos filtres (période, opérateur, agence, statut). (2) Cliquez sur le bouton "Exporter XLSX" en haut à droite. (3) Le fichier Excel est téléchargé automatiquement avec en-tête GESTMONEY, mise en forme et formules de totaux. Vous pouvez aussi exporter au format CSV (compatible Excel) pour un fichier plus léger. Les exports depuis Rapports & BI incluent des graphiques intégrés.',
    categorie: 'Rapports / Exports',
    module: 'Exports',
    roles: ['MANAGER', 'ADMIN', 'AUDITOR'],
    motsCles: ['export excel', 'xlsx', 'csv', 'transactions', 'télécharger'],
  },
  {
    id: 're2',
    question: 'Comment générer un rapport PDF mensuel ?',
    reponse: 'Depuis Rapports & BI : (1) Sélectionnez la période (mois en cours ou mois précédent). (2) Cliquez sur "Générer rapport". (3) GESTMONEY calcule les KPIs et génère le rapport (quelques secondes). (4) Dans l\'historique des rapports, cliquez sur le rapport généré → "Exporter PDF". Le PDF inclut : logo de votre société, KPIs, graphiques, classement agents, répartition par opérateur.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['rapport pdf', 'mensuel', 'générer', 'kpi', 'graphique'],
  },
  {
    id: 're3',
    question: 'Peut-on programmer l\'envoi automatique de rapports par email ?',
    reponse: 'Oui. GESTMONEY génère automatiquement un rapport de synthèse le 1er de chaque mois et l\'envoie par email. Pour configurer : Paramètres → Notifications → Rapports. Ajoutez les adresses email des destinataires, choisissez le format (PDF, XLSX ou les deux) et l\'heure d\'envoi souhaitée. Les rapports automatiques incluent : CA, variations, top agents, lien vers le rapport complet.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['ADMIN'],
    motsCles: ['rapport automatique', 'email', 'planification', 'mensuel', 'programmé'],
  },
  {
    id: 're4',
    question: 'Quels formats d\'export sont disponibles dans GESTMONEY ?',
    reponse: 'GESTMONEY supporte 3 formats d\'export : (1) CSV — format texte universel, compatible avec tous les tableurs, idéal pour l\'import dans d\'autres logiciels. (2) XLSX — format Excel natif avec mise en forme, en-tête GESTMONEY et formules de totaux automatiques. (3) PDF — document formaté avec logo, graphiques et présentation professionnelle, idéal pour archivage et partage. Chaque export respecte les filtres actifs au moment de l\'export.',
    categorie: 'Rapports / Exports',
    module: 'Exports',
    roles: ['Tous'],
    motsCles: ['format export', 'csv', 'xlsx', 'pdf', 'différence'],
  },
  {
    id: 're5',
    question: 'Comment comparer les performances de deux périodes ?',
    reponse: 'Dans Rapports & BI, sélectionnez "Comparaison de périodes" (disponible en haut de page). Choisissez la période principale (ex: juillet 2026) et la période de référence (ex: juin 2026). GESTMONEY affiche les variations en valeur et en pourcentage pour chaque KPI : CA, transactions, nouveaux clients, commissions. Les variations positives sont en vert, négatives en rouge.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['comparaison', 'périodes', 'variation', 'kpi', 'évolution'],
  },
  {
    id: 're6',
    question: 'Que signifient les KPIs du tableau de bord ?',
    reponse: 'Les KPIs principaux : (1) CA Total — Somme des montants de toutes les transactions validées de la période. (2) Transactions — Nombre total d\'opérations. (3) Ticket moyen — CA Total ÷ Nombre de transactions. (4) Taux de succès — % de transactions validées vs total (validées + rejetées + annulées). (5) Nouveaux clients — Clients dont c\'est la première transaction sur la période. (6) Commissions — Total des commissions générées.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['Tous'],
    motsCles: ['kpi', 'tableau de bord', 'ca', 'ticket moyen', 'taux succès', 'signification'],
  },
  {
    id: 're7',
    question: 'Comment exporter toutes les données GESTMONEY (sauvegarde complète) ?',
    reponse: 'Pour exporter l\'intégralité de vos données : Paramètres → Données → Exporter mes données. GESTMONEY prépare une archive ZIP contenant : toutes vos transactions (CSV), la liste des agents (CSV), les rapports générés (PDF), les journaux d\'audit (CSV). La préparation peut prendre quelques minutes. Vous recevez un email avec le lien de téléchargement valable 24h. Cette fonctionnalité est disponible uniquement pour les ADMIN.',
    categorie: 'Rapports / Exports',
    module: 'Exports',
    roles: ['ADMIN'],
    motsCles: ['export complet', 'sauvegarde', 'toutes données', 'archive', 'zip'],
  },
  {
    id: 're8',
    question: 'Comment générer un rapport par opérateur spécifique ?',
    reponse: 'Dans Rapports & BI : (1) Sélectionnez la période. (2) Dans le filtre "Grouper par", choisissez "Opérateur". (3) Cliquez sur "Générer rapport". Le rapport affiche les KPIs pour chaque opérateur séparément : CA, transactions, commissions, float moyen. Vous pouvez aussi filtrer sur un seul opérateur pour un rapport mono-opérateur. Exportez en XLSX pour une analyse approfondie.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['rapport opérateur', 'par opérateur', 'filtrer', 'orange', 'wave', 'mtn'],
  },
  {
    id: 're9',
    question: 'Les rapports incluent-ils les transactions annulées et rejetées ?',
    reponse: 'Par défaut, les rapports de performance (CA, commissions) n\'incluent que les transactions à statut "Validée". Les transactions annulées et rejetées sont exclues du CA mais sont incluses dans les statistiques de "Taux de succès" et "Taux de rejet". Pour un rapport incluant tous les statuts (utile pour l\'audit), utilisez le filtre "Statut → Tous" dans la page Transactions et exportez.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['Tous'],
    motsCles: ['annulées', 'rejetées', 'rapport', 'inclure', 'statut', 'taux rejet'],
  },
  {
    id: 're10',
    question: 'Comment partager un rapport avec un partenaire externe ?',
    reponse: 'Pour partager un rapport : (1) Générez le rapport dans Rapports & BI. (2) Exportez-le en PDF. (3) Partagez le fichier PDF par email ou via votre système de partage habituel. Si le partenaire a besoin d\'un accès récurrent, envisagez de créer un compte AUDITOR pour lui (accès lecture seule). Évitez de partager vos identifiants personnels. GESTMONEY ne dispose pas encore de liens de partage public de rapport.',
    categorie: 'Rapports / Exports',
    module: 'Rapports',
    roles: ['MANAGER', 'ADMIN'],
    motsCles: ['partager rapport', 'externe', 'pdf', 'partenaire', 'auditor'],
  },

  // ── Abonnements / Licences (5) ────────────────────────────────────────────
  {
    id: 'al1',
    question: 'Quels sont les différents plans disponibles ?',
    reponse: 'GESTMONEY propose 3 plans : (1) Starter — jusqu\'à 5 agents, 1000 transactions/mois, SARA IA basique, support email 8h. Idéal pour les petits réseaux débutants. (2) Business — jusqu\'à 25 agents, 10 000 transactions/mois, SARA IA avancée, exports illimités, support email 4h. Pour les réseaux en croissance. (3) Enterprise — illimité, SARA IA complète, API access, support prioritaire 2h, SLA 99,9%. Pour les grandes structures. Contactez sales@ibigsoft.com pour un devis personnalisé.',
    categorie: 'Abonnements / Licences',
    module: 'Abonnements',
    roles: ['ADMIN'],
    motsCles: ['plans', 'starter', 'business', 'enterprise', 'abonnement', 'tarif'],
  },
  {
    id: 'al2',
    question: 'Comment upgrader vers un plan supérieur ?',
    reponse: 'Pour upgrader votre plan : Paramètres → Abonnement → Changer de plan. Sélectionnez le plan cible et cliquez sur "Upgrader". L\'upgrade est effectif immédiatement. La facturation au prorata est calculée automatiquement pour la période restante du mois en cours. Vous recevrez une facture de l\'ajustement par email. En cas de questions sur la facturation, contactez billing@ibigsoft.com.',
    categorie: 'Abonnements / Licences',
    module: 'Abonnements',
    roles: ['ADMIN'],
    motsCles: ['upgrader', 'changer plan', 'upgrade', 'montée en gamme', 'facturation'],
  },
  {
    id: 'al3',
    question: 'Comment télécharger mes factures GESTMONEY ?',
    reponse: 'Toutes vos factures sont disponibles dans Paramètres → Abonnement → Historique de facturation. Cliquez sur une facture pour la télécharger en PDF. Les factures incluent : description de la prestation, période, montant HT et TTC, et les informations légales de IBIG Soft. Pour des factures antérieures ou en cas de litige, contactez billing@ibigsoft.com.',
    categorie: 'Abonnements / Licences',
    module: 'Abonnements',
    roles: ['ADMIN'],
    motsCles: ['facture', 'télécharger', 'historique', 'facturation', 'comptabilité'],
  },
  {
    id: 'al4',
    question: 'Que se passe-t-il si je dépasse les limites de mon plan ?',
    reponse: 'Si vous atteignez la limite d\'agents ou de transactions de votre plan, GESTMONEY vous envoie des alertes progressives (à 80%, 90% et 100% de la limite). Une fois la limite atteinte : les nouveaux agents ne peuvent plus être créés (mais les existants continuent de fonctionner) et les transactions au-delà du quota mensuel peuvent être bloquées selon la configuration. Il est recommandé d\'upgrader avant d\'atteindre les limites.',
    categorie: 'Abonnements / Licences',
    module: 'Abonnements',
    roles: ['ADMIN'],
    motsCles: ['dépassement limite', 'quota', 'blocage', 'upgrade', 'alertes'],
  },
  {
    id: 'al5',
    question: 'Comment résilier mon abonnement GESTMONEY ?',
    reponse: 'Pour résilier : Paramètres → Abonnement → Résilier l\'abonnement. La résiliation prend effet à la fin de la période de facturation en cours (pas de remboursement prorata). Avant la résiliation, exportez toutes vos données (Paramètres → Données → Exporter) car l\'accès sera coupé à la date de fin. Après résiliation, vos données sont conservées 90 jours puis supprimées définitivement. Contactez support@ibigsoft.com pour toute question.',
    categorie: 'Abonnements / Licences',
    module: 'Abonnements',
    roles: ['ADMIN'],
    motsCles: ['résiliation', 'annuler abonnement', 'fin de contrat', 'données', 'export'],
  },

  // ── Support / Tickets (5) ─────────────────────────────────────────────────
  {
    id: 'st1',
    question: 'Comment ouvrir un ticket de support ?',
    reponse: 'Depuis Support → Nouveau ticket : (1) Renseignez le titre du problème. (2) Sélectionnez la catégorie (Technique, Transaction, Float, Agent, Facturation, Autre). (3) Choisissez la priorité (Basse/Normale/Haute/Urgente). (4) Décrivez le problème en détail avec les étapes pour le reproduire, les messages d\'erreur et les références concernées. (5) Joignez une capture d\'écran si utile. (6) Cliquez sur "Envoyer". Un numéro de ticket vous est attribué et vous pouvez suivre l\'avancement.',
    categorie: 'Support / Tickets',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['ticket', 'support', 'ouvrir', 'problème', 'assistance'],
  },
  {
    id: 'st2',
    question: 'Quels sont les délais de réponse du support ?',
    reponse: 'Les délais de réponse sont garantis selon la priorité et le plan : Priorité Urgente — 2h (tous les plans) / Priorité Haute — 4h ouvrées / Priorité Normale — 8h ouvrées / Priorité Basse — 24h ouvrées. Les heures ouvrées sont du lundi au vendredi, 8h-18h UTC+0. Pour les plans Enterprise, le support prioritaire est disponible 7j/7. Les tickets du weekend sont traités en priorité le lundi matin.',
    categorie: 'Support / Tickets',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['délai réponse', 'sla', 'support', 'priorité', 'heures ouvrées'],
  },
  {
    id: 'st3',
    question: 'Comment suivre l\'avancement d\'un ticket de support ?',
    reponse: 'Depuis Support → [Numéro du ticket] : consultez l\'historique des échanges, le statut actuel (Ouvert, En cours, En attente, Résolu, Fermé) et les réponses du support. Vous êtes notifié par email à chaque réponse. Vous pouvez ajouter des informations complémentaires ou des pièces jointes directement dans le fil de conversation du ticket. Les tickets résolus restent consultables pendant 1 an.',
    categorie: 'Support / Tickets',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['suivi ticket', 'statut', 'avancement', 'réponse support', 'historique'],
  },
  {
    id: 'st4',
    question: 'Puis-je escalader un ticket en cas d\'urgence critique ?',
    reponse: 'Pour escalader un ticket : (1) Changez la priorité à "Urgente" dans le ticket existant. (2) Envoyez un email à support@ibigsoft.com avec le numéro du ticket et la mention "ESCALADE URGENTE" dans l\'objet. (3) Sur le plan Enterprise, utilisez le numéro WhatsApp d\'urgence indiqué dans Paramètres → Support → Contact d\'urgence. Les escalades sont traitées en priorité absolue.',
    categorie: 'Support / Tickets',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['escalade', 'urgence', 'priorité', 'critique', 'support'],
  },
  {
    id: 'st5',
    question: 'Que faire si le support n\'a pas résolu mon problème ?',
    reponse: 'Si après plusieurs échanges le problème n\'est pas résolu : (1) Demandez dans le ticket à être escaladé vers l\'équipe technique senior. (2) Mentionnez explicitement le délai écoulé et l\'impact opérationnel. (3) Contactez directement votre Account Manager IBIG Soft si vous êtes sur un plan Business ou Enterprise. (4) Pour les litiges, écrivez à ceo@ibigsoft.com en copie de votre ticket. GESTMONEY s\'engage à résoudre tous les tickets dans les délais SLA.',
    categorie: 'Support / Tickets',
    module: 'Support',
    roles: ['Tous'],
    motsCles: ['non résolu', 'escalade senior', 'litige', 'account manager', 'sla'],
  },

  // ── SARA IA (5) ───────────────────────────────────────────────────────────
  {
    id: 'si1',
    question: 'Qu\'est-ce que SARA et comment y accéder ?',
    reponse: 'SARA (Smart Assistant for Real-time Assistance) est l\'assistant IA intégré à GESTMONEY. Cliquez sur le bouton vert avec l\'icône robot en bas à droite de n\'importe quelle page du tableau de bord pour ouvrir SARA. Elle répond en temps réel à vos questions sur les fonctionnalités, procédures et dépannage. SARA est disponible 24h/24, 7j/7 et répond en français et en anglais.',
    categorie: 'SARA IA',
    module: 'SARA IA',
    roles: ['Tous'],
    motsCles: ['sara', 'assistant ia', 'chatbot', 'accéder', 'bouton'],
  },
  {
    id: 'si2',
    question: 'Que peut (et ne peut pas) faire SARA ?',
    reponse: 'SARA peut : répondre aux questions sur les fonctionnalités de GESTMONEY, vous guider étape par étape dans les procédures, expliquer les statuts et erreurs, vous orienter vers le bon module, et proposer des solutions de dépannage. SARA ne peut pas : effectuer des actions à votre place (créer une transaction, modifier un paramètre), accéder à vos données spécifiques (montants de votre float, noms de vos agents), ni remplacer le support humain pour les problèmes complexes.',
    categorie: 'SARA IA',
    module: 'SARA IA',
    roles: ['Tous'],
    motsCles: ['sara', 'capacités', 'limites', 'que peut faire', 'fonctionnalités ia'],
  },
  {
    id: 'si3',
    question: 'SARA répond-elle en anglais ?',
    reponse: 'Oui. SARA détecte automatiquement la langue de votre question et répond dans la même langue. Posez votre question en français → SARA répond en français. Posez votre question en English → SARA answers in English. Vous pouvez aussi mélanger les langues dans la même conversation. SARA est optimisée pour le français (langue principale) et l\'anglais (langue secondaire). D\'autres langues seront ajoutées dans les prochaines versions.',
    categorie: 'SARA IA',
    module: 'SARA IA',
    roles: ['Tous'],
    motsCles: ['sara', 'anglais', 'langue', 'multilingue', 'détection langue'],
  },
  {
    id: 'si4',
    question: 'Les conversations avec SARA sont-elles confidentielles ?',
    reponse: 'Oui. Vos conversations avec SARA restent privées. Les échanges sont associés à votre compte utilisateur et ne sont pas accessibles par d\'autres utilisateurs ni par les agents IBIG Soft (sauf dans le cadre d\'un support technique explicitement autorisé par vous). Les conversations ne sont pas utilisées pour entraîner des modèles d\'IA tiers sans votre consentement. L\'historique SARA est conservé pour la durée de votre session uniquement.',
    categorie: 'SARA IA',
    module: 'SARA IA',
    roles: ['Tous'],
    motsCles: ['sara', 'confidentialité', 'vie privée', 'historique', 'données ia'],
  },
  {
    id: 'si5',
    question: 'SARA peut-elle signaler automatiquement un problème au support ?',
    reponse: 'Pas encore directement, mais SARA peut vous guider pour ouvrir un ticket de support en 2 clics. Lors d\'une conversation SARA, tapez "signaler un problème" ou "ouvrir un ticket" et SARA vous propose de pré-remplir un ticket de support avec le contexte de votre question. Cette fonctionnalité de création automatique de ticket via SARA est en cours de développement pour la version 2.2.',
    categorie: 'SARA IA',
    module: 'SARA IA',
    roles: ['Tous'],
    motsCles: ['sara', 'signaler problème', 'ticket automatique', 'support', 'ia'],
  },

  // ── Sauvegarde (5) ────────────────────────────────────────────────────────
  {
    id: 'sb1',
    question: 'À quelle fréquence les données sont-elles sauvegardées ?',
    reponse: 'GESTMONEY effectue des sauvegardes automatiques à 3 niveaux : (1) En temps réel — toutes les transactions sont sauvegardées instantanément dans une base de données répliquée. (2) Snapshot horaire — sauvegarde complète de la base toutes les heures, conservée 7 jours. (3) Sauvegarde quotidienne — conservée 30 jours. (4) Sauvegarde hebdomadaire — conservée 6 mois. En cas d\'incident, la perte de données maximale est de 1 heure.',
    categorie: 'Sauvegarde',
    module: 'Sécurité',
    roles: ['ADMIN'],
    motsCles: ['sauvegarde', 'backup', 'fréquence', 'rétention', 'automatique'],
  },
  {
    id: 'sb2',
    question: 'Comment restaurer des données supprimées accidentellement ?',
    reponse: 'En cas de suppression accidentelle de données : (1) Contactez immédiatement le support technique (support@ibigsoft.com ou ticket prioritaire URGENTE). (2) Précisez les données concernées (type, période, identifiants). (3) IBIG Soft effectue la restauration depuis la dernière sauvegarde disponible (maximum 1h de perte). (4) La restauration est effectuée dans un environnement de test avant application en production. Délai estimé : 2 à 4h selon la complexité.',
    categorie: 'Sauvegarde',
    module: 'Sécurité',
    roles: ['ADMIN'],
    motsCles: ['restauration', 'données supprimées', 'récupération', 'backup', 'urgence'],
  },
  {
    id: 'sb3',
    question: 'Pendant combien de temps mes données sont-elles conservées ?',
    reponse: 'Données en compte actif : conservées indéfiniment tant que votre abonnement est actif. Données après résiliation : conservées 90 jours après la fin de l\'abonnement, puis supprimées définitivement. Journaux d\'audit : conservés 5 ans conformément aux exigences OHADA. Il est fortement recommandé d\'exporter toutes vos données avant de résilier votre abonnement. L\'export complet est accessible dans Paramètres → Données → Exporter.',
    categorie: 'Sauvegarde',
    module: 'Sécurité',
    roles: ['Tous'],
    motsCles: ['rétention données', 'durée conservation', 'résiliation', 'ohada', 'légal'],
  },
  {
    id: 'sb4',
    question: 'Comment exporter toutes mes données GESTMONEY ?',
    reponse: 'Pour un export complet : Paramètres → Données → Exporter mes données → "Tout exporter". GESTMONEY prépare une archive ZIP avec : transactions (CSV), agents (CSV), agences (CSV), rapports (PDF), commissions (CSV), journaux d\'audit (CSV). La préparation prend 5 à 30 minutes selon le volume. Vous recevez un email avec le lien de téléchargement valable 24h. Cette opération est réservée aux ADMIN.',
    categorie: 'Sauvegarde',
    module: 'Exports',
    roles: ['ADMIN'],
    motsCles: ['export complet', 'toutes données', 'archive', 'zip', 'gdpr'],
  },
  {
    id: 'sb5',
    question: 'GESTMONEY est-il conforme au RGPD et aux réglementations OHADA ?',
    reponse: 'Oui. GESTMONEY est conçu pour la conformité réglementaire : (1) RGPD — droit à l\'effacement, export des données personnelles, registre des traitements. (2) OHADA — conservation des journaux comptables 5 ans, traçabilité des transactions. (3) UMOA/BCEAO — conformité avec les directives de monnaie électronique de l\'UEMOA. (4) ISO 27001 — sécurité de l\'information (infrastructure hébergeur). Pour un rapport de conformité, contactez compliance@ibigsoft.com.',
    categorie: 'Sauvegarde',
    module: 'Sécurité',
    roles: ['ADMIN'],
    motsCles: ['rgpd', 'ohada', 'conformité', 'bceao', 'réglementaire', 'lgpd'],
  },
];

// ─── Catégories avec comptages ───────────────────────────────────────────────

const CATEGORIES_UNIQUES = Array.from(new Set(FAQS.map((f) => f.categorie)));

// ─── Composant FAQ Item ──────────────────────────────────────────────────────

function FaqItem({ faq }: { faq: FAQ }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className={clsx('border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all', ouvert && 'shadow-sm ring-1 ring-[#009E00]/15')}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <HelpCircle size={15} className={clsx('flex-shrink-0 mt-0.5 transition-colors', ouvert ? 'text-[#009E00]' : 'text-text-muted')} />
        <span className="flex-1 text-sm font-semibold text-text-main leading-snug">{faq.question}</span>
        {ouvert
          ? <ChevronDown size={15} className="text-[#009E00] flex-shrink-0 mt-0.5" />
          : <ChevronRight size={15} className="text-text-muted flex-shrink-0 mt-0.5" />}
      </button>
      {ouvert && (
        <div className="border-t border-gray-100 dark:border-white/08 px-4 py-4">
          <p className="text-sm text-text-muted leading-relaxed pl-6">{faq.reponse}</p>
          <div className="flex flex-wrap items-center gap-3 mt-4 pl-6">
            <div className="flex flex-wrap gap-1">
              {faq.roles.map((r) => (
                <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#009E00]/10 text-[#007a00] dark:text-[#4ade80]">{r}</span>
              ))}
            </div>
            <span className="text-[10px] text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">{faq.module}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2 pl-6">
            {faq.motsCles.slice(0, 4).map((m) => (
              <span key={m} className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-gray-50 dark:bg-white/05"># {m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function FaqPage() {
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState<string>('Toutes');

  const faqFiltrees = useMemo(() => {
    let result = FAQS;
    if (categorie !== 'Toutes') {
      result = result.filter((f) => f.categorie === categorie);
    }
    if (recherche.trim().length >= 2) {
      const q = recherche.toLowerCase();
      result = result.filter((f) =>
        f.question.toLowerCase().includes(q) ||
        f.reponse.toLowerCase().includes(q) ||
        f.motsCles.some((m) => m.includes(q)) ||
        f.module.toLowerCase().includes(q)
      );
    }
    return result;
  }, [recherche, categorie]);

  const comptesParCategorie = useMemo(() => {
    const acc: Record<string, number> = { Toutes: FAQS.length };
    CATEGORIES_UNIQUES.forEach((c) => {
      acc[c] = FAQS.filter((f) => f.categorie === c).length;
    });
    return acc;
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <HelpCircle size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">FAQ — Questions fréquentes</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {FAQS.length} questions réelles organisées en {CATEGORIES_UNIQUES.length} catégories
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aide" className="text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors">
            ← Centre d&apos;aide
          </Link>
          <Link href="/dashboard/guide" className="flex items-center gap-1.5 text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors">
            <BookOpen size={14} /> Guide complet
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher dans les 100 FAQ… (ex: mot de passe, float, export, commission)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
        {recherche && (
          <button onClick={() => setRecherche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs">
            Effacer
          </button>
        )}
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {(['Toutes', ...CATEGORIES_UNIQUES]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategorie(cat)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              categorie === cat
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-blue-400 hover:text-blue-500'
            )}
          >
            <Tag size={11} />
            {cat}
            <span className={clsx('text-[10px] px-1 py-0.5 rounded-full', categorie === cat ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10')}>
              {comptesParCategorie[cat] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div>
        {recherche.trim().length >= 2 || categorie !== 'Toutes' ? (
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {faqFiltrees.length} résultat{faqFiltrees.length !== 1 ? 's' : ''}
            {categorie !== 'Toutes' && ` dans "${categorie}"`}
            {recherche.trim().length >= 2 && ` pour "${recherche}"`}
          </p>
        ) : null}

        {faqFiltrees.length === 0 ? (
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
            <HelpCircle size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm">Aucune FAQ trouvée pour cette recherche.</p>
            <Link href="/dashboard/support" className="text-blue-500 text-sm font-semibold mt-3 inline-block hover:underline">
              Ouvrir un ticket de support →
            </Link>
          </div>
        ) : categorie !== 'Toutes' || recherche.trim().length >= 2 ? (
          <div className="space-y-1.5">
            {faqFiltrees.map((faq) => (
              <FaqItem key={faq.id} faq={faq} />
            ))}
          </div>
        ) : (
          /* Vue par catégories si pas de filtre actif */
          <div className="space-y-8">
            {CATEGORIES_UNIQUES.map((cat) => {
              const faqsCat = FAQS.filter((f) => f.categorie === cat);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-base font-bold text-text-main">{cat}</h2>
                    <span className="text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">
                      {faqsCat.length} question{faqsCat.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {faqsCat.map((faq) => (
                      <FaqItem key={faq.id} faq={faq} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA bas de page */}
      <div className="bg-gradient-to-r from-blue-50 to-[#009E00]/05 dark:from-blue-900/10 dark:to-[#009E00]/05 rounded-2xl border border-blue-100 dark:border-blue-900/20 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-text-main">Votre question n&apos;est pas ici ?</h3>
          <p className="text-sm text-text-muted mt-1">Consultez le guide complet ou ouvrez un ticket — notre équipe répond sous 4h.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/dashboard/guide"
            className="flex items-center gap-2 bg-white dark:bg-white/08 text-text-main text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/12 transition-colors"
          >
            <BookOpen size={14} /> Guide complet
          </Link>
          <Link
            href="/dashboard/support"
            className="flex items-center gap-2 bg-[#009E00] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#007a00] transition-colors"
          >
            <LifeBuoy size={14} /> Ouvrir un ticket
          </Link>
        </div>
      </div>
    </div>
  );
}

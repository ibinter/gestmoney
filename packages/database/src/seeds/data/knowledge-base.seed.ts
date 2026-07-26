import { PrismaClient } from "@prisma/client";

export interface KnowledgeEntry {
  slug: string;
  titre: string;
  categorie: string;
  source: string;
  mots_cles: string[];
  langue: string;
  contenu: string;
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // GUIDE — 12 ARTICLES
  // ═══════════════════════════════════════════════════════════════════════

  {
    slug: "guide-premiere-connexion",
    titre: "Première connexion et configuration initiale",
    categorie: "demarrage",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "connexion", "login", "mot de passe", "password", "configuration",
      "démarrage", "compte", "première fois", "navigateur", "profil",
      "langue", "sécurité", "provisoire",
    ],
    contenu: `Pour commencer avec GESTMONEY, votre administrateur crée votre compte et vous transmet une adresse e-mail et un mot de passe provisoire. GESTMONEY fonctionne entièrement dans le navigateur (Chrome, Edge ou Firefox recommandés) — aucune installation n'est nécessaire.

Étapes de la première connexion :
1. Ouvrez GESTMONEY dans votre navigateur à l'URL fournie par votre organisation.
2. Saisissez votre adresse e-mail et le mot de passe provisoire.
3. Cliquez sur "Se connecter" pour accéder au tableau de bord.
4. Dès la première session, changez votre mot de passe : Mon profil → Sécurité → Changer le mot de passe (nouveau mot de passe robuste, min. 8 caractères, lettres + chiffres + symboles).
5. Complétez votre profil (nom, téléphone, rôle) dans Mon profil.
6. Sélectionnez votre langue FR/EN dans la barre supérieure — le choix est mémorisé.

Bonnes pratiques de sécurité : utilisez un mot de passe unique, déconnectez-vous sur tout poste partagé, ne laissez pas votre session ouverte sans surveillance.

FAQ première connexion : si vous ne recevez pas le mot de passe, vérifiez les courriers indésirables puis contactez votre administrateur. L'erreur "Compte inactif" signifie que la licence est peut-être expirée — contactez le support. Seul l'administrateur peut modifier les rôles.`,
  },

  {
    slug: "guide-creer-agence",
    titre: "Créer votre première agence",
    categorie: "demarrage",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "agence", "point de vente", "pdv", "créer", "agences", "boutique",
      "kiosque", "localisation", "responsable", "nommage", "suspendre",
    ],
    contenu: `Dans GESTMONEY, tout part de l'agence : chaque agent, float et rapport se rattachent à un point de vente. Avant d'enregistrer une transaction, il faut au moins une agence active.

Créer une agence :
1. Dans la barre latérale, cliquez sur Agences & PDV.
2. Cliquez sur "Nouvelle agence".
3. Saisissez un nom clair et unique (ex. "Agence Cocody Centre").
4. Indiquez la localisation (quartier, rue ou ville).
5. Désignez un responsable référent.
6. Cliquez sur Enregistrer.

L'agence apparaît avec le statut Active et est disponible pour y rattacher des agents.

Points d'attention : le nom est modifiable mais gardez-le stable pour les historiques. Vous pouvez suspendre une agence sans la supprimer — ses données restent accessibles. Convention de nommage recommandée : ville + quartier + type de PDV.`,
  },

  {
    slug: "guide-ajouter-agent",
    titre: "Ajouter et configurer un agent",
    categorie: "demarrage",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "agent", "créer agent", "profil agent", "rattacher", "agence",
      "float départ", "seuil alerte", "activer", "suspendre agent",
      "téléphone", "opérations", "terrain",
    ],
    contenu: `Un agent est la personne qui réalise les opérations Mobile Money sur le terrain. Dans GESTMONEY, chaque opération est enregistrée au nom d'un agent identifié. L'agent doit être rattaché à une agence active.

Créer un profil agent :
1. Dans la barre latérale, cliquez sur Agents.
2. Cliquez sur "Nouvel agent".
3. Saisissez le prénom, le nom et le numéro de téléphone.
4. Sélectionnez l'agence de rattachement dans la liste déroulante.
5. Cliquez sur Enregistrer.

Préparer le float de départ :
1. Accédez au module Float & liquidité.
2. Cliquez sur Nouveau réapprovisionnement.
3. Sélectionnez l'agent, saisissez le montant initial en XOF.
4. Validez : le float est crédité immédiatement.

Configurer l'alerte de float bas : dans la fiche agent, champ "Seuil d'alerte de float", saisissez un montant (ex. 50 000 XOF). Quand le float passe sous ce seuil, le tableau de bord signale l'alerte en orange.

Attention : si l'agence de rattachement est suspendue, l'agent ne peut plus enregistrer d'opérations.`,
  },

  {
    slug: "guide-enregistrer-transaction",
    titre: "Enregistrer une transaction Mobile Money",
    categorie: "transactions",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "transaction", "dépôt", "retrait", "cash-in", "cash-out",
      "enregistrer", "saisir", "opérateur", "montant", "XOF", "valider",
      "nouvelle transaction", "mobile money",
    ],
    contenu: `GESTMONEY gère deux types principaux de transactions Mobile Money :
- Dépôt (cash-in) : le client remet des espèces, vous chargez son compte Mobile Money. Le float électronique diminue, les espèces augmentent.
- Retrait (cash-out) : le client retire des espèces depuis son compte Mobile Money. Le float électronique augmente, les espèces diminuent.

Pré-requis : l'agent doit être actif avec un float suffisant ; l'opérateur (Orange Money, MTN MoMo, Wave…) doit être configuré.

Enregistrer un dépôt :
1. Barre latérale → Transactions → Nouvelle transaction.
2. Choisissez le type Dépôt.
3. Sélectionnez l'agent, le client (par nom ou numéro de téléphone) et l'opérateur.
4. Saisissez le montant en XOF (strictement positif).
5. Vérifiez le récapitulatif (montant, frais, commission).
6. Cliquez sur Valider pour enregistrer.

Enregistrer un retrait : même procédure, type Retrait. Vérifiez que l'agent dispose de suffisamment d'espèces en caisse avant de remettre au client.

Après validation : la transaction apparaît dans la liste avec horodatage, agent, montant et commission. Le float de l'agent est mis à jour automatiquement.

Conseil : saisissez les transactions au fil de l'eau, immédiatement après chaque opération — une saisie différée augmente les risques d'erreur.`,
  },

  {
    slug: "guide-valider-annuler-transaction",
    titre: "Valider ou annuler une transaction",
    categorie: "transactions",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "valider", "annuler", "corriger", "transaction", "statut",
      "en attente", "annulée", "validée", "correction", "doublon",
      "erreur transaction", "opération inverse",
    ],
    contenu: `Cycle de vie d'une transaction dans GESTMONEY :
- En attente : créée mais pas encore confirmée.
- Validée : opération enregistrée, float impacté, commission calculée.
- Annulée : opération annulée avant validation.

Une fois validée, une transaction ne peut plus être effacée. Toute correction se fait par une opération complémentaire tracée.

Valider une transaction en attente :
1. Transactions → filtrez par statut En attente.
2. Ouvrez la transaction et vérifiez les informations.
3. Cliquez sur Valider pour confirmer.

Annuler une transaction en attente :
1. Ouvrez la transaction au statut En attente.
2. Cliquez sur Annuler → confirmez.
3. Le statut passe à Annulée, le float n'est pas impacté.

Corriger une transaction déjà validée : créez une transaction corrective dans le sens inverse pour neutraliser l'impact sur le float, puis documentez dans le module Comptabilité.

Cas pratiques :
- Mauvais montant validé : transaction inverse du même montant + nouvelle opération correcte.
- Mauvais opérateur : même approche.
- Doublon : vérifiez l'historique avant toute correction pour éviter une 3e opération non voulue.`,
  },

  {
    slug: "guide-gestion-float",
    titre: "Gérer la flotte (float) des agents",
    categorie: "transactions",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "float", "liquidité", "réapprovisionnement", "seuil", "alerte float",
      "solde", "float bas", "critique", "espèces", "électronique",
      "rupture", "pic activité", "reconciliation",
    ],
    contenu: `Le float est la liquidité disponible qu'un agent peut mobiliser pour opérer : float électronique (unités Mobile Money) et espèces en caisse.

Surveiller les soldes :
1. Module Float & liquidité → liste des agents avec solde actuel et indicateur (vert = OK, orange = seuil bas, rouge = critique).
2. Triez par solde croissant pour identifier les agents prioritaires.
3. Cliquez sur un agent pour consulter l'historique des mouvements.

Seuils d'alerte : fiche agent → champ "Seuil d'alerte de float" → saisissez un montant (représentant au moins une demi-journée de tampon). Enregistrez.

Réapprovisionner un agent :
1. Float & liquidité → Nouveau réapprovisionnement.
2. Sélectionnez l'agent, saisissez le montant en XOF.
3. Validez : le float est mis à jour immédiatement.

Anticiper les pics d'activité : jours de marché (lundis et jeudis dans beaucoup de zones) → float ×2 ; fin de mois (versement des salaires) → augmentez les espèces en caisse ; veille de jours fériés → anticipez.

Réconciliation : comparez le float théorique (GESTMONEY) avec le comptage réel des espèces. Tout écart doit être documenté dans le module Comptabilité. Enregistrez TOUS les mouvements pour éviter les écarts.`,
  },

  {
    slug: "guide-rapports-journaliers",
    titre: "Générer les rapports journaliers",
    categorie: "rapports",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "rapport", "journalier", "exporter", "csv", "xlsx", "pdf",
      "synthèse", "activité", "agent", "agence", "clôture",
      "performances", "indicateurs", "taux utilisation",
    ],
    contenu: `Les rapports journaliers résument l'activité de la journée : nombre de transactions, volumes en XOF, commissions générées, par agent et par agence.

Générer un rapport journalier :
1. Barre latérale → Rapports & BI.
2. Sélectionnez la vue Journalier et la date souhaitée.
3. Choisissez l'agence (ou toutes) et le type d'opération si nécessaire.
4. Lisez le nombre total de transactions, le volume total XOF et les commissions par agent.
5. Cliquez sur Exporter (CSV, XLSX ou PDF selon les options disponibles).

Rapprocher avec la caisse : après génération, comparez au comptage physique. Tout écart doit être investigué avant la clôture. Utilisez le module Comptabilité pour les ajustements.

Indicateurs clés à surveiller :
- Taux d'utilisation du float : si un agent a consommé 90 % en une journée, anticipez le réapprovisionnement.
- Écart entre commissions théoriques et affichées : vérifiez les opérateurs sélectionnés.
- Agent à zéro transaction : absence, panne ou problème de float ?

Conseil : générez le rapport chaque soir avant la clôture journalière.`,
  },

  {
    slug: "guide-comptabilite-ohada",
    titre: "Comprendre la comptabilité OHADA dans GESTMONEY",
    categorie: "rapports",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "ohada", "syscohada", "comptabilité", "clôture", "écritures",
      "grand livre", "balance", "bilan", "résultat", "fiscal",
      "ajustement", "rapprochement", "taxe", "tva", "expert comptable",
    ],
    contenu: `GESTMONEY s'appuie sur le référentiel SYSCOHADA pour structurer les écritures comptables générées par votre activité Mobile Money.

Comptes clés :
- Float électronique : actif circulant (comptes de trésorerie ou de créances selon la convention opérateur).
- Commissions : produits d'exploitation (classe 7 du SYSCOHADA), ventilées automatiquement par opérateur et par période.
- Espèces en caisse : compte 57 du SYSCOHADA.

Clôture journalière :
1. Avant de clôturer : vérifiez que toutes les transactions sont enregistrées et que la caisse est rapprochée.
2. Dans le module Comptabilité → Clôture de journée.
3. Attention : ne clôturez pas avec un écart de caisse non expliqué.

Écritures d'ajustement (après clôture) : identifiez l'écriture erronée, créez une écriture d'ajustement dans le sens inverse dans le module Comptabilité (avec commentaire), signée par le responsable.

Rapprochement avec les relevés opérateurs : exportez le rapport mensuel (Rapports & BI), comparez les volumes et commissions ligne par ligne, signalez tout écart à l'opérateur.`,
  },

  {
    slug: "guide-configurer-operateurs",
    titre: "Configurer les opérateurs Mobile Money",
    categorie: "configuration",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "opérateur", "orange money", "mtn momo", "wave", "moov money",
      "airtel money", "configurer", "barème", "commission opérateur",
      "désactiver opérateur", "canal", "ajouter opérateur",
    ],
    contenu: `Les opérateurs Mobile Money sont les canaux via lesquels vos clients déposent et retirent de l'argent : Orange Money, MTN MoMo, Wave, Moov Money, Free Money, etc. GESTMONEY doit les connaître pour associer chaque transaction au bon canal, calculer les commissions et produire des rapports ventilés.

Accéder à la gestion des opérateurs : barre latérale → Opérateurs (section Réseau). Ce module est réservé aux rôles administrateur et superviseur.

Ajouter un opérateur :
1. Cliquez sur Nouvel opérateur.
2. Saisissez le nom (ex. "Orange Money CI"), le pays/zone et le code interne si applicable.
3. Enregistrez. L'opérateur est disponible dans la liste de saisie des transactions.

Configurer les barèmes de commission : fiche opérateur → section Barème de commission → saisissez les tranches de montant et les taux correspondants (conformes à votre contrat avec l'opérateur).

Désactiver un opérateur : fiche opérateur → basculez sur Inactif. Il n'apparaît plus dans la saisie des transactions, mais les transactions historiques restent accessibles dans les rapports.

Opérateurs supportés par GESTMONEY : Orange Money, MTN MoMo, Wave, Moov Money, Airtel Money, T-Money, Express Union, Wizall, Djamo, et autres selon configuration.`,
  },

  {
    slug: "guide-commissions",
    titre: "Paramétrer les plans de commission",
    categorie: "configuration",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "commission", "barème", "plan commission", "taux", "reversement",
      "objectifs", "agent commission", "calculer", "période", "mensuel",
      "tranche", "brute", "nette", "marge réseau",
    ],
    contenu: `Dans un réseau Mobile Money, la commission est calculée en pourcentage du montant de la transaction avec des tranches progressives selon les barèmes de l'opérateur.

GESTMONEY distingue :
- Commission brute : ce que l'opérateur verse.
- Commission agent : la part reversée à l'agent (fraction de la commission brute).
- Marge réseau : ce qui reste après reversement à l'agent.

Accéder aux plans : barre latérale → Commissions → Paramètres (réservé aux administrateurs).

Créer un plan de commission :
1. Sélectionnez l'opérateur concerné.
2. Définissez les tranches de montant (ex. 0–50 000 XOF, 50 001–100 000 XOF, etc.).
3. Pour chaque tranche, indiquez le taux commission brute et le taux commission agent.
4. Créez des plans distincts pour dépôts et retraits si vos contrats le prévoient.

Reversement des commissions : module Commissions → filtrez par agent et période → exportez le récapitulatif via Rapports & BI. Établissez un calendrier fixe (ex. tous les vendredis).

Vérifications périodiques : chaque mois, rapprochez les commissions GESTMONEY avec les relevés de l'opérateur. Mettez à jour les barèmes dès tout changement.`,
  },

  {
    slug: "guide-roles-permissions",
    titre: "Comprendre les rôles et permissions",
    categorie: "securite",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "rôle", "permissions", "rbac", "accès", "super admin", "admin",
      "superviseur", "manager", "agent rôle", "droits", "moindre privilège",
      "attribuer rôle", "modifier rôle", "désactiver compte",
    ],
    contenu: `GESTMONEY applique un contrôle d'accès basé sur les rôles (RBAC). Chaque utilisateur a un rôle qui détermine les modules visibles et les actions possibles. Ce filtrage s'applique à la fois à l'interface et aux données côté serveur.

Rôles disponibles :
- Super Admin : accès total, y compris la Console SuperAdmin. Gère les licences et tenants. Réservé à l'équipe IBIG Soft.
- Admin (Administrateur) : accès complet aux modules métier. Peut créer et modifier des utilisateurs et définir leurs rôles. Idéal pour le gérant principal.
- Superviseur / Manager : accès à tous les modules de pilotage et opérationnels. Ne peut pas modifier la configuration système ni les rôles d'autres utilisateurs.
- Agent : accès limité aux modules opérationnels (transactions, float, clients). Ne voit que les données de son agence et ses propres opérations.

Attribuer un rôle : Administration → liste des utilisateurs → cliquez sur l'utilisateur → sélectionnez le rôle → Enregistrez.

Règle du moindre privilège : attribuez toujours le rôle minimal nécessaire à la mission. Ne donnez pas des droits Admin à un agent opérationnel.

Révision périodique : au moins une fois par trimestre, listez les utilisateurs actifs, vérifiez les rôles et désactivez les comptes des personnes ayant quitté le réseau.`,
  },

  {
    slug: "guide-journal-audit",
    titre: "Utiliser le journal d'audit",
    categorie: "securite",
    source: "guide",
    langue: "fr",
    mots_cles: [
      "audit", "journal", "log", "traçabilité", "conformité", "historique",
      "qui", "quand", "action", "connexion suspecte", "modifier paramètre",
      "transaction contestée", "sécurité", "export audit",
    ],
    contenu: `Le journal d'audit est un enregistrement chronologique et immuable de toutes les actions significatives réalisées dans GESTMONEY. Chaque entrée indique qui a réalisé l'action, quoi a été fait, quand (horodatage précis) et sur quoi (transaction, agent, paramètre…).

Accéder : barre latérale → Audit & Alertes (visible pour les rôles Superviseur et supérieur). La liste s'affiche du plus récent au plus ancien.

Filtres disponibles : par période, par utilisateur, par type d'événement.

Cas d'usage pratiques :
- Connexion suspecte : filtrez les événements de type Connexion, repérez les horaires inhabituels (nuit, week-end) et vérifiez l'appareil/IP.
- Transaction contestée : recherchez la transaction par ID dans le journal, consultez qui l'a créée et si elle a été modifiée.
- Modification de paramètre : filtrez par type d'événement lié à la configuration pour identifier qui a modifié un barème ou un rôle.

Note importante : la page Audit & Alertes signale uniquement un volume d'activité inhabituel ("activité excessive"). Elle ne calcule AUCUN score de risque et n'est PAS un moteur de détection de fraude. Une alerte n'est PAS une accusation.

Bonnes pratiques : consultez le journal hebdomadairement, exportez régulièrement pour archivage, gardez-le confidentiel.`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FAQ — 12 ENTRÉES
  // ═══════════════════════════════════════════════════════════════════════

  {
    slug: "faq-connexion-probleme",
    titre: "Je n'arrive pas à me connecter",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "connexion", "login", "mot de passe oublié", "compte bloqué",
      "accès refusé", "erreur connexion", "identifiants", "problème connexion",
    ],
    contenu: `Causes courantes d'un échec de connexion et solutions :

1. Mot de passe incorrect : vérifiez que le verrouillage des majuscules n'est pas activé. Après 5 tentatives échouées, le compte peut être verrouillé temporairement.
2. Email incorrect : vérifiez l'adresse exacte fournie par votre administrateur (pas d'espace, bon domaine).
3. Compte inactif ou suspendu : contactez votre administrateur. Si la licence est expirée, le support IBIG Soft peut intervenir.
4. Mot de passe expiré : contactez votre administrateur pour réinitialiser.
5. Problème de réseau : vérifiez votre connexion internet.

Si vous êtes administrateur et avez perdu l'accès, contactez l'équipe IBIG Soft : gestmoney@ibigsoft.com ou +225 27 22 27 60 14 (Lun-Sam 8h-18h).

Note : GESTMONEY ne dispose pas de lien "Mot de passe oublié" public — la réinitialisation se fait via l'administrateur ou le support.`,
  },

  {
    slug: "faq-transaction-echouee",
    titre: "Ma transaction a échoué ou est bloquée en attente",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "transaction échouée", "bloquée", "en attente", "erreur transaction",
      "float insuffisant", "opérateur", "statut transaction", "débloquer",
    ],
    contenu: `Causes d'une transaction en échec ou bloquée en attente :

Transaction en statut "En attente" :
- Votre configuration nécessite une validation manuelle par un gérant ou superviseur.
- Solution : le gérant doit accéder à Transactions → filtrer par "En attente" → ouvrir la transaction et cliquer sur Valider.

Transaction en statut "Échoué" :
- Float insuffisant : l'agent n'avait pas assez de liquidité électronique. Réapprovisionnez le float puis re-saisissez l'opération.
- Problème côté opérateur : Orange Money, MTN MoMo, Wave ou autre service momentanément indisponible. Réessayez dans quelques minutes.
- Montant invalide : le montant saisi était nul ou négatif.

Corriger une transaction échouée : créez une nouvelle transaction correcte. Les transactions échouées restent dans l'historique pour traçabilité.

Si le problème persiste, ouvrez un ticket support avec la référence de l'opération, l'heure et le message d'erreur exact : gestmoney@ibigsoft.com ou +225 27 22 27 60 14.`,
  },

  {
    slug: "faq-float-bas",
    titre: "Que faire quand le float est bas ou épuisé ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "float bas", "float épuisé", "rupture float", "alerte float",
      "réapprovisionner", "liquidité insuffisante", "orange", "mtn", "wave",
    ],
    contenu: `Quand le float est bas ou épuisé, l'agent ne peut plus réaliser de dépôts (cash-in). C'est l'alerte la plus critique dans la gestion quotidienne d'un réseau Mobile Money.

Actions immédiates :
1. Accédez au module Float & liquidité pour vérifier les soldes de tous les agents.
2. Les indicateurs de couleur : vert = OK, orange = seuil bas, rouge = critique.
3. Pour réapprovisionner : Float & liquidité → Nouveau réapprovisionnement → sélectionnez l'agent → montant en XOF → Validez.

Prévention :
- Configurez des seuils d'alerte dans la fiche de chaque agent (fiche agent → "Seuil d'alerte de float").
- Anticipez les pics d'activité : jours de marché, fins de mois, veilles de fêtes.
- Consultez le tableau de bord chaque matin pour repérer les agents à risque.

Un réapprovisionnement non tracé crée un écart en comptabilité — enregistrez TOUS les mouvements dans GESTMONEY.`,
  },

  {
    slug: "faq-commissions-calcul",
    titre: "Comment sont calculées les commissions des agents ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "calcul commission", "comment calculer", "commission agent",
      "taux commission", "barème", "reversement", "paiement agent",
      "commission brute", "commission nette",
    ],
    contenu: `Les commissions dans GESTMONEY sont calculées automatiquement lors de chaque transaction selon les plans de commission configurés.

Structure de la commission :
- Commission brute : ce que l'opérateur (Orange Money, MTN MoMo, Wave, etc.) verse pour l'opération.
- Commission agent : la part reversée à l'agent (généralement un pourcentage de la commission brute, ex. 70 %).
- Commission agence : la part conservée par l'agence.
- Marge réseau : le solde restant.

Ces pourcentages sont configurés dans le module Commissions → Paramètres → Plan de commission.

Cycle de validation des commissions :
1. Calculée : la commission est calculée automatiquement après chaque transaction.
2. Validée : le superviseur ou admin confirme la commission pour la période.
3. Payée : le paiement est enregistré après reversement physique à l'agent.

Pour voir les commissions d'une période : Commissions → sélectionnez la période et l'agent → exportez le récapitulatif.

Note : les barèmes de commission configurables dans l'interface sont actuellement en cours de développement pour les périodes de 2025. Contactez le support si vous avez besoin d'une configuration spécifique.`,
  },

  {
    slug: "faq-rapport-exporter",
    titre: "Comment exporter les rapports ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "exporter", "export", "rapport", "csv", "xlsx", "excel", "pdf",
      "télécharger", "rapports bi", "données", "générer rapport",
    ],
    contenu: `GESTMONEY permet d'exporter les données via le module Rapports & BI.

Générer et exporter un rapport :
1. Barre latérale → Rapports & BI.
2. Cliquez sur le bouton "Générer rapport".
3. Choisissez le type de rapport : journalier, hebdomadaire ou mensuel.
4. Sélectionnez la période et les agences concernées.
5. Choisissez le format d'export : CSV, XLSX (Excel) ou PDF.
6. Cliquez sur Générer → le fichier est disponible au téléchargement.

Modules avec export CSV direct : Transactions (bouton Exporter dans la liste filtrée), Commissions (onglet Historique paiements), Administration (journal d'audit).

Limitation importante : le bouton "Exporter" de la page Caisse ne produit pas encore de fichier. Pour les données de caisse, utilisez le module Rapports & BI.

Les rapports exportés peuvent être archivés localement, transmis à votre direction ou déposés chez votre expert-comptable.`,
  },

  {
    slug: "faq-roles-acces",
    titre: "Pourquoi je ne vois pas certains modules ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "module invisible", "accès refusé", "droits", "rôle", "permission",
      "ne voit pas", "menu grisé", "module manquant", "barre latérale",
    ],
    contenu: `Si vous ne voyez pas certains modules dans la barre latérale, c'est dû au système de rôles RBAC de GESTMONEY.

Chaque rôle a accès à des modules spécifiques :
- Agent : Transactions, Float, Clients (seulement ses propres données).
- Superviseur/Manager : + Rapports, Performances, Commissions, Agences.
- Admin : + Administration, Audit, Comptabilité, tous les modules métier.
- Super Admin : accès complet + Console SuperAdmin.

Solutions :
1. Vérifiez votre rôle actuel dans Mon profil (ou en haut à droite de l'interface).
2. Si votre rôle semble inadapté à votre mission, contactez votre administrateur pour qu'il le modifie.
3. Si vous êtes admin mais ne voyez pas un module, vérifiez que votre compte est bien actif et que la licence est valide.

Seul un administrateur ou un Super Admin peut modifier les rôles. Depuis Administration → Utilisateurs → sélectionnez l'utilisateur → modifiez le rôle.`,
  },

  {
    slug: "faq-abonnement-grace",
    titre: "Qu'est-ce que la période de grâce d'abonnement ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "période grâce", "abonnement expiré", "accès limité", "renouveler",
      "paiement abonnement", "essai expiré", "licence", "restriction",
    ],
    contenu: `La période de grâce est une fenêtre de 7 jours après l'expiration de l'essai gratuit ou d'un abonnement impayé. Pendant cette période, l'accès reste ouvert pour vous laisser le temps de régulariser votre situation.

Que se passe-t-il pendant la période de grâce ?
- L'accès à GESTMONEY est maintenu.
- Des notifications vous rappellent d'effectuer le renouvellement.
- Après 7 jours sans paiement, l'accès peut être restreint.

Comment renouveler :
1. Accédez au module Abonnement & paiement dans la barre latérale.
2. Choisissez votre forfait : Starter (9 900 XOF/mois), Essentiel (19 900 XOF/mois), Professional (39 900 XOF/mois) ou Enterprise (sur devis).
3. Sélectionnez le moyen de paiement. À ce jour, le code prépayé (voucher) est le moyen opérationnel disponible ; les autres s'activent selon la configuration de l'administrateur.
4. 2 mois offerts sur l'abonnement annuel.

Pour toute question sur votre abonnement ou votre situation de paiement, contactez : gestmoney@ibigsoft.com ou +225 27 22 27 60 14 (Lun-Sam 8h-18h).`,
  },

  {
    slug: "faq-2fa-securite",
    titre: "Comment sécuriser mon compte avec la 2FA ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "2fa", "double authentification", "sécurité compte", "google authenticator",
      "code sécurité", "authentification", "sessions", "sécuriser",
    ],
    contenu: `La double authentification (2FA) ajoute une couche de sécurité à votre compte GESTMONEY.

Accéder aux paramètres de sécurité : Mon profil → onglet Sécurité.

Ce que vous pouvez faire :
- Changer votre mot de passe (actif et persistant).
- Activer la 2FA (fonctionnalité en cours de déploiement — affichée en aperçu).
- Consulter la liste de vos sessions actives (affichée en aperçu).

Note importante : les paramètres de la page Paramètres (hors mot de passe) ne sont pas encore persistés au rechargement. La 2FA et la liste des sessions sont présentées à titre d'aperçu dans cette version.

Bonnes pratiques de sécurité en attendant :
- Utilisez un mot de passe unique et robuste (min. 8 caractères, lettres + chiffres + symboles).
- Déconnectez-vous systématiquement sur un poste partagé.
- Ne partagez jamais votre mot de passe.
- GESTMONEY ne demande JAMAIS votre code secret Mobile Money ni votre mot de passe.

Pour signaler une activité suspecte sur votre compte, contactez immédiatement : gestmoney@ibigsoft.com.`,
  },

  {
    slug: "faq-kyc-client",
    titre: "Comment vérifier l'identité d'un client (KYC) ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "kyc", "vérification identité", "client", "pièce identité",
      "document", "créer client", "statut kyc", "valider kyc", "cnI",
    ],
    contenu: `KYC signifie "Know Your Customer" — c'est la vérification d'identité des clients, obligatoire dans les services financiers mobiles.

Créer un client :
1. Barre latérale → Clients → bouton Nouveau client.
2. Renseignez : prénom, nom, numéro de téléphone.
3. Enregistrez.

Compléter le KYC d'un client :
1. Ouvrez la fiche du client dans le module Clients.
2. Ajoutez les informations : type de document (CNI, passeport, permis…), numéro de document, photos (recto, verso, selfie).
3. Soumettez pour vérification.

Statuts KYC : En attente → En cours → Validé / Refusé.

Note : les boutons "Voir" et "Vérifier KYC" de la liste des clients ne sont pas encore tous fonctionnels dans cette version. La création et la recherche de clients (par nom, téléphone, statut KYC) sont actives.

Pour les recherches : utilisez les filtres de la liste (statut client, statut KYC, recherche par nom/téléphone).`,
  },

  {
    slug: "faq-support-ticket",
    titre: "Comment contacter le support ou ouvrir un ticket ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "support", "ticket", "contacter", "aide", "problème", "assistance",
      "email support", "téléphone support", "horaires", "escalade",
    ],
    contenu: `GESTMONEY dispose d'un centre de support dédié.

Ouvrir un ticket depuis l'application :
1. Barre latérale → Support ou Aide.
2. Cliquez sur "Nouveau ticket".
3. Décrivez votre problème : module concerné, navigateur, appareil, heure de l'incident, message d'erreur exact.
4. Soumettez le ticket.

Contact direct de l'équipe IBIG Soft :
- Email : gestmoney@ibigsoft.com
- Téléphone : +225 27 22 27 60 14
- Disponibilité : Lundi–Samedi, 8h–18h (heure d'Abidjan)

Informations utiles à inclure dans votre demande :
- Référence de l'opération concernée (si applicable)
- Heure et date de l'incident
- Message d'erreur exact affiché
- Navigateur utilisé et version
- Rôle de l'utilisateur affecté

Pour un suivi en cours, connectez-vous à votre espace client et consultez l'onglet "Mes tickets" dans le module Support.`,
  },

  {
    slug: "faq-stock-inventaire",
    titre: "Comment gérer l'inventaire dans le module Stock ?",
    categorie: "faq",
    source: "faq",
    langue: "fr",
    mots_cles: [
      "stock", "inventaire", "sim", "terminaux", "accessoires", "entrée stock",
      "sortie stock", "seuil stock", "bas", "critique", "agence stock",
    ],
    contenu: `Le module Stock permet de gérer l'inventaire physique par agence : cartes SIM, terminaux, accessoires, consommables.

Accéder : barre latérale → Stock.

Consulter l'inventaire :
- Liste des produits avec quantité disponible et statut : OK / Bas / Critique (selon le seuil défini).
- Filtrez par agence pour voir l'inventaire d'un point de vente spécifique.

Enregistrer une entrée de stock :
1. Cliquez sur "Entrée stock" (réception de marchandises).
2. Sélectionnez le produit, l'agence et la quantité reçue.
3. Indiquez le motif (commande, transfert…).
4. Validez.

Enregistrer une sortie de stock :
1. Cliquez sur "Sortie stock" (utilisation, casse, perte…).
2. Sélectionnez le produit, l'agence et la quantité sortie.
3. Indiquez le motif.
4. Validez.

Note : la création de nouveaux produits dans le catalogue depuis la page Stock n'est pas encore disponible dans cette version. Contactez votre administrateur ou le support IBIG Soft pour ajouter des produits au catalogue.`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TARIFS — 4 ENTRÉES
  // ═══════════════════════════════════════════════════════════════════════

  {
    slug: "tarifs-starter",
    titre: "Forfait Starter — 9 900 XOF/mois",
    categorie: "tarifs",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "starter", "tarif", "prix", "9900", "9 900", "abonnement", "forfait",
      "démarrer", "petit réseau", "formule",
    ],
    contenu: `Le forfait Starter de GESTMONEY est disponible à 9 900 XOF par mois.

Il convient aux petits réseaux Mobile Money qui débutent ou gèrent un nombre limité d'opérations.

Toutes les offres GESTMONEY incluent :
- Essai gratuit de 14 jours sans carte bancaire.
- Période de grâce de 7 jours après expiration en cas d'impayé.
- 2 mois offerts sur l'abonnement annuel.
- Support par email et téléphone (Lun-Sam 8h-18h).

Pour comparer les forfaits ou passer au forfait Essentiel (19 900 XOF/mois), Professionnel (39 900 XOF/mois) ou Enterprise (sur devis), contactez notre équipe commerciale : gestmoney@ibigsoft.com ou +225 27 22 27 60 14.`,
  },

  {
    slug: "tarifs-pro-enterprise",
    titre: "Forfaits Essentiel, Professional et Enterprise",
    categorie: "tarifs",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "essentiel", "professional", "enterprise", "tarif", "prix",
      "19900", "39900", "devis", "abonnement", "formule", "pro",
      "moyen réseau", "grand réseau", "sur mesure",
    ],
    contenu: `GESTMONEY propose 4 forfaits adaptés à la taille de votre réseau Mobile Money :

1. Starter : 9 900 XOF/mois — petit réseau, démarrage.
2. Essentiel : 19 900 XOF/mois — réseau en croissance.
3. Professional : 39 900 XOF/mois — réseau établi avec besoins avancés.
4. Enterprise : sur devis — grands réseaux, besoins spécifiques, accompagnement dédié.

Conditions communes :
- Essai gratuit de 14 jours sans carte bancaire.
- 2 mois offerts sur l'abonnement annuel.
- Période de grâce de 7 jours en cas d'impayé.

Moyens de paiement acceptés : Mobile Money, passerelles (CinetPay, Moneroo, FedaPay, Paystack, Stripe, PayPal), virement national et international, transfert d'argent, espèces en agence, chèque, cryptomonnaie, code prépayé, paiement à la livraison. (Les moyens disponibles varient selon le pays et la configuration de l'administrateur. À ce jour, le code prépayé est le moyen opérationnel principal.)

Pour un devis Enterprise ou une démonstration : gestmoney@ibigsoft.com ou +225 27 22 27 60 14 (Lun-Sam 8h-18h).`,
  },

  {
    slug: "tarifs-essai-gratuit",
    titre: "Essai gratuit 14 jours — sans carte bancaire",
    categorie: "tarifs",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "essai", "gratuit", "14 jours", "sans carte", "trial", "tester",
      "démo", "démarrer gratuitement", "créer compte",
    ],
    contenu: `GESTMONEY propose un essai gratuit de 14 jours sans carte bancaire ni engagement.

Comment démarrer l'essai gratuit :
1. Rendez-vous sur gestmoney.ibigsoft.com.
2. Cliquez sur "Essai gratuit" ou "Commencer".
3. Renseignez vos informations (nom, email, organisation).
4. Accédez immédiatement à toutes les fonctionnalités.

Pendant l'essai gratuit :
- Accès complet à tous les modules (Transactions, Float, Agents, Rapports, Comptabilité SYSCOHADA, etc.).
- Aucune carte bancaire requise.
- Support disponible pour vous accompagner.

À la fin de l'essai :
- Période de grâce de 7 jours avant restriction d'accès.
- Choisissez votre forfait (Starter à 9 900 XOF/mois, Essentiel, Professional ou Enterprise).
- 2 mois offerts si vous optez pour l'abonnement annuel.

Pour une démonstration guidée avant de démarrer l'essai, contactez notre équipe : gestmoney@ibigsoft.com ou +225 27 22 27 60 14.`,
  },

  {
    slug: "tarifs-voucher",
    titre: "Paiement par code prépayé (voucher)",
    categorie: "tarifs",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "voucher", "code prépayé", "code", "paiement", "revendeur",
      "lot", "utiliser code", "activer abonnement", "ibig partners",
    ],
    contenu: `Le paiement par code prépayé (voucher) est le moyen de paiement principal et opérationnel dans GESTMONEY.

Comment utiliser un code prépayé :
1. Procurez-vous un code auprès d'un revendeur IBIG Partners (ibigpartners.com) ou de l'équipe IBIG Soft.
2. Dans GESTMONEY, accédez au module Abonnement & paiement.
3. Sélectionnez "Code prépayé" comme moyen de paiement.
4. Saisissez votre code et cliquez sur Valider.
5. L'abonnement est activé immédiatement pour la durée correspondant au code.

Les codes prépayés sont disponibles selon les forfaits et les durées (mensuel, trimestriel, semestriel, annuel). Ils sont vendus par les revendeurs agréés du réseau IBIG PARTNERS.

Les autres moyens de paiement (Mobile Money, virements, passerelles électroniques) s'activent progressivement selon la configuration de l'administrateur et le pays de déploiement.

Pour obtenir des codes prépayés ou devenir revendeur : ibigpartners.com ou gestmoney@ibigsoft.com.`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CONTACT SUPPORT
  // ═══════════════════════════════════════════════════════════════════════

  {
    slug: "contact-support",
    titre: "Contact et support GESTMONEY",
    categorie: "contact",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "contact", "support", "email", "téléphone", "ibig soft", "ibig sarl",
      "horaires", "aide", "assistance", "ibigsoft.com", "gestmoney",
      "ibig partners", "partenariat", "revendeur",
    ],
    contenu: `GESTMONEY est édité par IBIG Soft (IBIG SARL — Intermark Business International Group).

Coordonnées du support :
- Email : gestmoney@ibigsoft.com
- Téléphone : +225 27 22 27 60 14
- Horaires : Lundi–Samedi, 8h–18h (heure d'Abidjan, UTC+0)
- Site : ibigsoft.com

Pour les demandes de démonstration, de devis Enterprise, d'intégration ou de partenariat commercial, utilisez les mêmes coordonnées.

Programme de partenariat IBIG PARTNERS (revendeurs agréés) : ibigpartners.com

Comment joindre le support efficacement :
1. Préparez votre identifiant de tenant ou l'email de l'administrateur.
2. Décrivez précisément le problème : module, heure, message d'erreur, navigateur.
3. Joignez une capture d'écran si possible.
4. Pour un ticket de support, utilisez le module Support de l'application.

GESTMONEY ne demande JAMAIS votre code secret Mobile Money ni votre mot de passe. Ne les communiquez à personne, même en prétendant être l'équipe IBIG Soft.`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // OPÉRATEURS SUPPORTÉS
  // ═══════════════════════════════════════════════════════════════════════

  {
    slug: "operateurs-supportes",
    titre: "Opérateurs Mobile Money supportés par GESTMONEY",
    categorie: "feature",
    source: "feature",
    langue: "fr",
    mots_cles: [
      "opérateurs", "orange money", "mtn momo", "wave", "moov money",
      "airtel money", "t-money", "express union", "wizall", "djamo",
      "free money", "mobile money", "canal", "compatibilité",
    ],
    contenu: `GESTMONEY supporte les principaux opérateurs Mobile Money d'Afrique de l'Ouest et d'Afrique Centrale.

Opérateurs pris en charge :
- Orange Money (Côte d'Ivoire, Sénégal, Mali, Burkina Faso, Cameroun, etc.)
- MTN MoMo (Côte d'Ivoire, Ghana, Cameroun, Rwanda, Uganda, etc.)
- Wave (Côte d'Ivoire, Sénégal, Mali, Burkina Faso)
- Moov Money (Côte d'Ivoire, Togo, Bénin, etc.)
- Airtel Money (RDC, Congo, Rwanda, Uganda, etc.)
- T-Money (Togo)
- Express Union (Cameroun, RCA)
- Wizall (Sénégal, Côte d'Ivoire)
- Djamo (Côte d'Ivoire)
- Et autres selon configuration du réseau.

La liste effective des opérateurs disponibles dépend de la configuration de votre administrateur. La configuration se fait depuis l'espace d'administration → module Opérateurs (section Réseau).

Chaque opérateur peut avoir son propre barème de commission, paramétrable dans le plan de commission correspondant (Commissions → Paramètres).`,
  },
];

/**
 * Seed de la base documentaire SARA.
 * Idempotent : peut être relancé sans erreur (upsert par slug).
 */
export async function seedKnowledgeBase(prisma: PrismaClient): Promise<number> {
  console.log(
    `     Synchronisation de ${KNOWLEDGE_BASE.length} entrées documentaires…`
  );
  let count = 0;

  for (const entry of KNOWLEDGE_BASE) {
    await prisma.documentBase.upsert({
      where: { slug: entry.slug },
      update: {
        titre: entry.titre,
        categorie: entry.categorie,
        contenu: entry.contenu,
        mots_cles: entry.mots_cles,
        source: entry.source,
        langue: entry.langue,
      },
      create: {
        slug: entry.slug,
        titre: entry.titre,
        categorie: entry.categorie,
        contenu: entry.contenu,
        mots_cles: entry.mots_cles,
        source: entry.source,
        langue: entry.langue,
      },
    });
    count++;
  }

  console.log(`     ${count} entrées documentaires synchronisées.`);
  return count;
}

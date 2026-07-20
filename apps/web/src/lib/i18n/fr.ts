// ── Dictionnaire FRANÇAIS (langue par défaut) ─────────────────────────────
export const fr = {
  lang: 'fr',

  // ── Navigation ────────────────────────────────────────────────────────
  nav: {
    principal: 'Principal',
    reseau: 'Réseau',
    finance: 'Finance & Analyse',
    compte: 'Compte',
    dashboard: 'Tableau de bord',
    transactions: 'Transactions',
    float: 'Gestion Float',
    caisse: 'Caisse',
    agences: 'Agences & PDV',
    agents: 'Agents',
    clients: 'Clients',
    commissions: 'Commissions',
    performances: 'Performances',
    rapports: 'Rapports & BI',
    notifications: 'Notifications',
    settings: 'Paramètres',
    profile: 'Mon profil',
    support: 'Support',
    aide: "Centre d'aide",
    superadmin: 'Console SuperAdmin',
    stock: 'Stock',
    comptabilite: 'Comptabilité',
    administration: 'Administration',
    iaFraude: 'Audit & Alertes',
    abonnement: 'Abonnement',
    superAdminSection: 'Super Admin',
  },

  // ── Sidebar (libellés d'accessibilité) ────────────────────────────────
  sidebar: {
    closeMenu: 'Fermer le menu',
    expand: 'Étendre',
    collapse: 'Réduire',
    expandSidebar: 'Étendre la barre latérale',
    collapseSidebar: 'Réduire la barre latérale',
    mainNav: 'Navigation principale',
    menu: 'Menu de navigation',
  },

  // ── Topbar ────────────────────────────────────────────────────────────
  topbar: {
    search: 'Rechercher…',
    searchHint: 'Navigation rapide',
    darkMode: 'Passer en mode sombre',
    lightMode: 'Passer en mode clair',
    myProfile: 'Mon profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    langSwitch: 'English',
  },

  // ── Communs ───────────────────────────────────────────────────────────
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    finish: 'Terminer',
    loading: 'Chargement…',
    sending: 'Envoi…',
    search: 'Rechercher',
    filter: 'Filtrer',
    all: 'Tous',
    yes: 'Oui',
    no: 'Non',
    available: 'Disponible',
    inProgress: 'En cours',
    error: 'Erreur',
    success: 'Succès',
    required: 'Requis',
    optional: 'Optionnel',
    noData: 'Aucune donnée',
    seeAll: 'Voir tout',
    export: 'Exporter',
    generate: 'Générer',
    download: 'Télécharger',
    print: 'Imprimer',
    refresh: 'Actualiser',
    add: 'Ajouter',
    create: 'Créer',
    send: 'Envoyer',
    validate: 'Valider',
    reject: 'Rejeter',
    activate: 'Activer',
    deactivate: 'Désactiver',
    suspend: 'Suspendre',
    renew: 'Renouveler',
    preview: 'Prévisualiser',
    test: 'Tester',
    today: "Aujourd'hui",
    total: 'Total',
    period: 'Période',
    home: 'Accueil',
    reset: 'Réinitialiser',
    clear: 'Effacer',
    view: 'Voir',
    details: 'Détail',
    actions: 'Actions',
    date: 'Date',
    time: 'Heure',
    type: 'Type',
    statut: 'Statut',
    amount: 'Montant',
    description: 'Description',
    comment: 'Commentaire',
    page: 'Page',
    results: 'résultat(s)',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    email: 'Email',
    city: 'Ville',
    password: 'Mot de passe',
    creating: 'Création…',
    refreshing: 'Actualisation…',
    checking: 'Vérification…',
    invalidAmount: 'Montant invalide.',
    createError: 'Erreur lors de la création. Réessayez.',
    loadError: 'Erreur de chargement.',
    online: 'En ligne',
    offline: 'Hors ligne',
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
    registration: 'Inscription',
    commission: 'Commission',
    agency: 'Agence',
    operator: 'Opérateur',
    client: 'Client',
    agent: 'Agent',
    volume: 'Volume',
    reference: 'Référence',
    currency: 'Devise',
  },

  // ── Dashboard ─────────────────────────────────────────────────────────
  dashboard: {
    title: 'Tableau de bord',
    subtitle: 'Vue en temps réel de votre activité Mobile Money',
    revenue: 'Chiffre d\'affaires',
    transactions: 'Transactions',
    newClients: 'Nouveaux clients',
    avgTicket: 'Ticket moyen',
    topAgent: 'Meilleur agent',
    objective: 'Objectif mensuel',
    progression: 'Progression',
    float: 'Float disponible',
    alerts: 'Alertes',
    pending: 'En attente',
    aiRecommendations: 'Recommandations IA',
    lastUpdated: 'Mis à jour',
    noAgent: '—',
    performanceBy: 'Performance par',
    operator: 'Opérateur',

    greetingMorning: 'Bonjour',
    greetingAfternoon: 'Bon après-midi',
    greetingEvening: 'Bonsoir',
    you: 'vous',
    updatedAtLabel: 'mis à jour à',
    demoData: 'données de démonstration',
    newTransaction: 'Nouvelle transaction',
    reportsButton: 'Rapports',
    recentActivity: 'Activité récente',
    myLastTransactions: 'Mes dernières transactions',
    noTransactionPeriod: 'Aucune transaction sur la période.',
    sparklineTitle: 'Transactions — 7 derniers jours',
    sparklineSub: 'Nombre de transactions par jour',
    actNow: 'Agir maintenant',
    seeCommissions: 'Voir commissions',
    pointsToHandle: 'Points à traiter',
    teamPerformance: 'Performances de mon équipe',
    vsYesterday: 'vs hier',
    variationTooltip: 'Variation par rapport à la veille',

    cards: {
      transactions: 'Transactions',
      volumeDay: 'Volume du jour',
      agents: 'Agents',
      agences: 'Agences',
      commissions: 'Commissions',
      floatOperateurs: 'Float opérateurs',
      txAgence: 'Transactions agence',
      volumeAgence: 'Volume agence',
      monEquipe: 'Mon équipe',
      mesTransactions: 'Mes transactions',
      monFloat: 'Mon float',
      maCommission: 'Ma commission',
      operationsAuditees: 'Opérations auditées',
      txDuJour: 'Transactions du jour',
    },

    labels: {
      txToday: "transactions aujourd'hui",
      processed: 'traités',
      avgPerTx: 'Moyenne par transaction :',
      xofProcessedToday: "XOF traités aujourd'hui",
      xofProcessed: 'XOF traités',
      activeAgents: 'agents actifs',
      noInactiveAgent: 'Aucun agent inactif',
      activeAgencies: 'agences actives',
      agentsSpread: 'agents actifs répartis',
      commissionsPending: 'commission(s) en attente de validation',
      operatorsBelowThreshold: 'opérateur(s) sous le seuil',
      floatDetail: 'Détail des soldes par opérateur dans la page Float',
      xofMyAgency: 'XOF sur mon agence',
      supervised: 'supervisés',
      supervisedAgents: 'agents supervisés',
      xofAvailable: 'XOF disponibles',
      xofThisMonth: 'XOF ce mois',
      auditedOps: 'opérations auditées',
      actifs: 'actifs',
      actives: 'actives',
      toValidate: 'à valider',
      upToDate: 'À jour',
      levelsOk: 'Niveaux OK',
      floatLow: 'float bas',
      lowThreshold: 'Seuil bas',
      levelOk: 'Niveau correct',
      lowThresholdMsg: 'Seuil bas — contactez votre manager',
      inactiveAgents: 'agent(s) inactif(s)',
      commissionsToValidate: 'commission(s) à valider',
    },

    actionsLabels: {
      depot: '+ Dépôt',
      retrait: '+ Retrait',
      seeReports: 'Voir rapports',
      seeAgents: 'Voir agents',
      createAgent: '+ Créer agent',
      seeAgencies: 'Voir agences',
      newAgency: '+ Nouvelle agence',
      validate: 'Valider',
      history: 'Historique',
      refill: 'Réapprovisionner',
      seeFloat: 'Voir float',
      newTransaction: '+ Transaction',
      reports: 'Rapports',
      requestRefill: 'Demander un réappro',
      detail: 'Détail',
      export: 'Exporter',
    },

    floatAlert: {
      title: 'Alerte float',
      before: 'Le float de',
      strong: 'votre agence',
      after: 'est en dessous du seuil configuré.',
    },

    auditTable: {
      title: "Journal d'audit récent",
      action: 'Action',
      user: 'Utilisateur',
      resource: 'Ressource',
      ip: 'IP',
    },

    txTable: {
      hour: 'Heure',
      type: 'Type',
      agent: 'Agent',
      operator: 'Opérateur',
      client: 'Client',
      amount: 'Montant',
      status: 'Statut',
    },

    relative: {
      now: "À l'instant",
      agoPrefix: 'Il y a ',
      agoSuffix: '',
      min: 'min',
      hour: 'h',
    },

    txTypes: {
      depot: 'Dépôt',
      retrait: 'Retrait',
      transfert: 'Transfert',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      paiement: 'Paiement',
    },

    txStatuts: {
      success: 'Succès',
      pending: 'En attente',
      failed: 'Échouée',
    },
  },

  // ── Transactions ──────────────────────────────────────────────────────
  transactions: {
    title: 'Transactions',
    subtitle: 'Historique de toutes les opérations',
    new: 'Nouvelle transaction',
    deposit: 'Dépôt',
    withdrawal: 'Retrait',
    transfer: 'Transfert',
    amount: 'Montant',
    operator: 'Opérateur',
    agent: 'Agent',
    client: 'Client',
    reference: 'Référence',
    status: {
      validated: 'Validée',
      pending: 'En attente',
      rejected: 'Rejetée',
      cancelled: 'Annulée',
    },
    exportCsv: 'Exporter CSV',
    exportPdf: 'Exporter PDF',
    exportXlsx: 'Exporter XLSX',

    types: {
      depot: 'Dépôt',
      retrait: 'Retrait',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      transfert: 'Transfert',
      paiement: 'Paiement',
    },
    statutLabels: {
      success: 'Succès',
      pending: 'En attente',
      failed: 'Échoué',
      cancelled: 'Annulé',
    },

    columns: {
      date: 'Date / Heure',
      type: 'Type',
      agent: 'Agent',
      agence: 'Agence',
      operateur: 'Opérateur',
      client: 'Client',
      montant: 'Montant',
      commission: 'Commission',
      statut: 'Statut',
    },

    stats: {
      totalLabel: 'Total transactions',
      displayedOnPage: 'affichée(s) sur cette page',
      pageVolume: 'Volume de la page',
      succeeded: 'Réussies',
      pending: 'En attente',
      failedCancelled: 'Échouées / annulées',
      ofPage: 'de la page',
    },

    filters: {
      dateStart: 'Date début',
      dateEnd: 'Date fin',
      allTypes: 'Tous les types',
      search: 'Recherche',
      searchPlaceholder: 'Référence, agent, client…',
    },

    toolbar: {
      showing: 'Affichage de',
      onTotal: 'sur',
      selectedSuffix: 'sélectionnée(s)',
      deselect: 'Désélectionner',
      sortHint: 'Cliquer sur un en-tête pour trier',
      selectAll: 'Tout sélectionner',
      selectRow: 'Sélectionner',
    },

    table: {
      loading: 'Chargement des transactions…',
      error: 'Erreur de chargement des transactions.',
      empty: 'Aucune transaction trouvée',
      viewDetail: 'Voir le détail',
      validateTx: 'Valider la transaction',
    },

    pagination: {
      prevPage: 'Page précédente',
      nextPage: 'Page suivante',
      onPage: 'sur',
    },

    detail: {
      title: 'Détail de la transaction',
      fees: 'Frais',
      dateTime: 'Date & heure',
      agentCommission: 'Commission agent :',
    },

    form: {
      newTitle: 'Nouvelle transaction —',
      operatorRequired: 'Opérateur *',
      amountRequired: 'Montant (FCFA) *',
      clientPhone: 'Téléphone client',
      clientName: 'Nom client',
      clientNamePlaceholder: 'Nom et prénom',
      success: 'Transaction enregistrée avec succès.',
    },
  },

  // ── Float ─────────────────────────────────────────────────────────────
  float: {
    title: 'Gestion Float',
    subtitle: 'Soldes et approvisionnements par opérateur',
    balance: 'Solde',
    threshold: 'Seuil d\'alerte',
    criticalThreshold: 'Seuil critique',
    refill: 'Approvisionner',
    history: 'Historique des mouvements',
    lowAlert: 'Float bas',
    criticalAlert: 'Float critique',

    pageTitle: 'Float opérateurs',
    liveLevels: 'Niveaux en temps réel',
    updatedOn: 'Mis à jour le',
    newRefill: '+ Réapprovisionnement',

    badges: {
      ok: 'OK',
      faible: 'Faible',
      critique: 'Critique',
    },
    demandeStatuts: {
      en_attente: 'En attente',
      approuve: 'Approuvé',
      complete: 'Complété',
      rejete: 'Rejeté',
    },

    banner: {
      criticalLevel: 'Niveau critique',
      currentBalance: 'Solde actuel :',
      minThreshold: 'Seuil minimum :',
      riskMessage: "Des transactions risquent d'être rejetées.",
      ignore: 'Ignorer',
    },

    card: {
      minThreshold: 'Seuil min :',
      insufficient: 'Insuffisant !',
      watch: 'Surveiller',
      marginOk: 'Marge : OK',
      refill: '+ Réapprovisionner',
      urgentRefill: "⚠ Réapprovisionner d'urgence",
    },

    movements: {
      title: '📋 Mouvements du jour',
      sub: 'Historique des entrées et sorties de float',
      colHour: 'Heure',
      colOperator: 'Opérateur',
      colType: 'Type',
      colDescription: 'Description',
      colAmount: 'Montant',
      colAgent: 'Agent',
      colBalanceAfter: 'Solde après',
      empty: 'Aucun mouvement',
      in: 'Entrée',
      out: 'Sortie',
    },

    requests: {
      title: '🔄 Demandes en cours',
      sub: 'Réapprovisionnements à valider',
      pendingSuffix: 'en attente',
      empty: 'Aucune demande en cours',
    },

    thresholds: {
      title: "🔔 Seuils d'alerte",
      sub: 'Montants minimaux déclenchant une alerte',
      ariaPrefix: "Seuil d'alerte",
    },

    modal: {
      title: 'Demande de réapprovisionnement',
      currentBalance: 'Solde actuel',
      alertThreshold: "Seuil d'alerte",
      operator: 'Opérateur',
      amountLabel: 'Montant à réapprovisionner (XOF)',
      amountPlaceholder: 'ex: 500000',
      commentPlaceholder: 'Informations complémentaires…',
      operatorRequired: 'Opérateur requis.',
      submitError: 'Erreur lors de la soumission.',
      success: 'Demande soumise avec succès.',
      submit: 'Envoyer la demande',
    },
  },

  // ── Agents ────────────────────────────────────────────────────────────
  agents: {
    title: 'Agents',
    subtitle: 'Gestion de votre réseau de terrain',
    add: 'Ajouter un agent',
    name: 'Nom',
    phone: 'Téléphone',
    agency: 'Agence',
    role: 'Rôle',
    status: 'Statut',
    commissions: 'Commissions',
    performance: 'Performance',
    invite: 'Inviter',
    resetPassword: 'Réinitialiser le mot de passe',
    active: 'Actif',
    inactive: 'Inactif',

    pageTitle: 'Gestion des Agents',
    pageSubtitle: 'Suivi des performances, volumes et commissions par agent',
    createAgent: '+ Créer un agent',

    stats: {
      activeAgents: 'Agents actifs',
      inactiveAgents: 'Agents inactifs',
      onlineNow: 'En ligne maintenant',
      topAgent: 'Top agent (volume auj.)',
      overAgencies: 'Sur',
      agenciesSuffix: 'agence(s)',
      overAgents: 'Sur',
      agentsSuffix: 'agent(s)',
      txTodaySuffix: 'transaction(s) auj.',
      commissionsDue: 'Commissions dues (tous agents)',
    },

    filters: {
      allAgencies: 'Toutes les agences',
      allStatus: 'Tous statuts',
      actifs: 'Actifs',
      inactifs: 'Inactifs',
      enLigne: 'En ligne',
      searchPlaceholder: 'Nom, email, téléphone…',
    },

    table: {
      found: 'agent(s) trouvé(s)',
      sortHint: 'Cliquez sur un en-tête pour trier',
      colAgent: 'Agent',
      colTxToday: 'Transac. auj.',
      colVolumeToday: 'Volume auj.',
      colPresence: 'Présence',
      empty: 'Aucun agent trouvé',
      suspend: '🚫 Suspendre',
      activate: '✅ Activer',
      viewAction: '👁️ Voir',
      pagerSuffix: 'agent(s)',
    },

    modal: {
      title: '👤 Nouvel agent',
      firstNameRequired: 'Prénom *',
      firstNamePlaceholder: 'Ex : Aminata',
      lastNameRequired: 'Nom *',
      lastNamePlaceholder: 'Ex : Koné',
      emailRequired: 'Email *',
      emailPlaceholder: 'agent@exemple.com',
      phoneRequired: 'Téléphone *',
      agencyChoose: 'Choisir une agence',
      tempPassword: 'Mot de passe temporaire *',
      tempPasswordPlaceholder: 'Minimum 8 caractères',
      requiredFields: 'Veuillez remplir tous les champs obligatoires.',
      createdPrefix: 'Agent',
      createdSuffix: 'créé avec succès.',
      submit: "✅ Créer l’agent",
    },
  },

  // ── Clients ───────────────────────────────────────────────────────────
  clients: {
    title: 'Gestion des clients',
    loading: 'Chargement des clients…',
    registeredSuffix: 'client(s) enregistré(s)',
    activeSuffix: 'actif(s)',
    kycPendingSuffix: 'KYC en attente',
    newClient: 'Nouveau client',

    kycLabels: {
      verifie: 'Vérifié',
      en_attente: 'En attente',
      rejete: 'Rejeté',
    },
    statutLabels: {
      actif: 'Actif',
      inactif: 'Inactif',
      bloque: 'Bloqué',
    },

    stats: {
      totalClients: 'Total clients',
      activeClients: 'Clients actifs',
      kycPending: 'KYC en attente',
      totalVolume: 'Volume total',
      inactiveSuffix: 'inactif(s)',
    },

    filters: {
      searchPlaceholder: 'Rechercher par nom, téléphone, email…',
      allStatus: 'Tous les statuts',
      actifs: 'Actifs',
      inactifs: 'Inactifs',
      bloques: 'Bloqués',
      allKyc: 'Tous les KYC',
      verifies: 'Vérifiés',
      enAttente: 'En attente',
      rejetes: 'Rejetés',
    },

    table: {
      colClient: 'Client',
      colWallet: 'Solde wallet',
      colTransactions: 'Transactions',
      colTotalVolume: 'Volume total',
      colKyc: 'KYC',
      empty: 'Aucun client trouvé',
      verifyKyc: 'Vérifier KYC',
      noClient: 'Aucun client',
      showing: 'Affichage de',
      onTotal: 'sur',
      clientsSuffix: 'client(s)',
      prev: '← Précédent',
      next: 'Suivant →',
    },

    modal: {
      title: 'Nouveau client',
      firstNameRequired: 'Prénom *',
      lastNameRequired: 'Nom *',
      phoneRequired: 'Téléphone *',
      emailPlaceholder: 'client@email.com',
      cityPlaceholder: 'Abidjan',
      requiredFields: 'Prénom, nom et téléphone sont obligatoires.',
      savedPrefix: 'Client',
      savedSuffix: 'enregistré.',
      saveError: "Erreur lors de l'enregistrement. Réessayez.",
      submit: 'Enregistrer le client',
    },
  },

  // ── Abonnement & paiement ─────────────────────────────────────────────
  abonnement: {
    title: 'Abonnement & paiement',
    subtitle: 'Réglez votre abonnement par le moyen de votre choix',
    changeMethod: '← Changer de moyen',
    securityNotice: 'Nous ne vous demanderons jamais votre code secret ou mot de passe.',

    chooseMethod: '💳 Choisissez un moyen de paiement',
    loadingMethods: 'Chargement des moyens de paiement…',
    methodsUnavailable: 'Moyens de paiement indisponibles.',
    methodsUnavailableSub: 'Le service n’a pas répondu. Utilisez « Actualiser » pour réessayer.',
    noMethod: 'Aucun moyen de paiement n’est actuellement proposé. Contactez le support.',
    testBadge: 'Test',
    currencies: 'Devises :',
    choose: 'Choisir',
    sandboxNotice: 'Ce moyen est en mode test (bac à sable) : aucun encaissement réel n’est effectué.',

    familles: {
      MOBILE_MONEY_MANUEL: 'Mobile Money (validation manuelle)',
      PASSERELLE: 'Passerelle en ligne',
      VIREMENT_NATIONAL: 'Virement bancaire national',
      VIREMENT_INTERNATIONAL: 'Virement international',
      TRANSFERT_ARGENT: "Transfert d'argent",
      ESPECES_AGENCE: 'Espèces en agence',
      CHEQUE: 'Chèque',
      CRYPTO: 'Crypto-monnaie',
      VOUCHER: 'Code prépayé',
      PAIEMENT_LIVRAISON: 'Paiement à la livraison',
    },

    statuts: {
      EN_ATTENTE: 'En attente',
      EN_COURS: 'En cours de vérification',
      REUSSI: 'Réussi',
      ECHOUE: 'Échoué',
      REMBOURSE: 'Remboursé',
      ANNULE: 'Annulé',
      EXPIRE: 'Expiré',
    },

    champs: {
      operateur: 'Opérateur',
      numeroACrediter: 'Numéro à créditer',
      titulaire: 'Titulaire du compte',
      fournisseur: 'Fournisseur',
      banque: 'Banque',
      iban: 'IBAN',
      rib: 'RIB',
      numeroCompte: 'Numéro de compte',
      bic: 'Code BIC / SWIFT',
      adresseBanque: 'Adresse de la banque',
      pays: 'Pays',
      enseigne: 'Enseigne',
      beneficiaire: 'Bénéficiaire',
      ville: 'Ville',
      pieceIdentite: "Pièce d'identité à présenter",
      adresse: 'Adresse',
      horaires: 'Horaires',
      contact: 'Contact',
      chequeOrdre: "Chèque à l'ordre de",
      adresseEnvoi: "Adresse d'envoi",
      reseau: 'Réseau',
      actif: 'Actif',
      adresseWallet: 'Adresse du wallet',
      memoTag: 'Mémo / Tag',
      zones: 'Zones desservies',
      delai: 'Délai',
    },

    instructions: {
      title: '📄 Instructions de paiement',
      empty: 'Aucune coordonnée n’a été publiée pour ce moyen de paiement. Contactez le support avant d’effectuer un versement.',
      collectPoints: 'Points de collecte',
    },

    voucher: {
      title: '🎟️ Code prépayé',
      label: 'Votre code',
      hint: 'Un code valide active votre abonnement immédiatement. Chaque code ne peut servir qu’une seule fois.',
      submit: 'Utiliser ce code',
      invalid: 'Code invalide : 8 caractères minimum.',
      failed: 'Ce code n’a pas pu être utilisé.',
      acceptedPrefix: 'Code accepté. Abonnement activé',
      onPlan: 'sur le plan',
      forDays: 'jour(s).',
      forPrefix: 'pour',
    },

    creation: {
      title: '🧮 Montant à régler',
      invalidAmount: 'Montant invalide : saisissez un montant strictement positif.',
      notConfigured: 'Ce moyen de paiement n’est pas complètement configuré (fournisseur non déterminé). Contactez le support.',
      failed: 'Impossible de créer le paiement.',
      gatewayNotice: 'Après création, vous serez redirigé vers le site du prestataire pour régler. Le retour depuis ce site n’active pas votre abonnement : l’activation n’a lieu qu’après confirmation vérifiée du prestataire auprès de nos serveurs.',
      manualNotice: 'Effectuez le versement d’après les instructions ci-dessus, puis envoyez votre justificatif à l’étape suivante. La validation est faite par un administrateur : votre accès n’est pas immédiat.',
      submit: 'Créer le paiement',
    },

    preuve: {
      title: '✅ Paiement enregistré',
      referenceLabel: 'Référence à rappeler',
      gatewayNotice: 'Réglez ce paiement chez le prestataire en rappelant la référence ci-dessus. Nous n’activons votre abonnement qu’après confirmation vérifiée du prestataire auprès de nos serveurs — le simple retour du navigateur ne suffit pas.',
      fileLabel: 'Justificatif (image ou PDF, 10 Mo maximum)',
      referenceFieldLabel: 'Référence de l’opération (MTCN, n° de chèque, hash de transaction, code de reçu…)',
      reviewNotice: 'Votre justificatif est vérifié par un administrateur. L’envoi n’active pas l’abonnement : l’accès n’est pas immédiat.',
      missingFile: 'Joignez une image ou un PDF de votre justificatif (10 Mo maximum). La référence seule ne suffit pas.',
      success: 'Justificatif reçu. Un administrateur doit le vérifier : votre accès n’est pas activé immédiatement.',
      failed: 'Impossible d’envoyer le justificatif.',
      submit: 'Envoyer le justificatif',
      loadError: 'Impossible de charger les justificatifs déjà envoyés.',
      loading: 'Chargement des justificatifs…',
      fallbackName: 'Justificatif',
    },

    historique: {
      title: '🧾 Mes paiements',
      colChannel: 'Canal',
      loading: 'Chargement de vos paiements…',
      error: 'Impossible de charger vos paiements.',
      empty: 'Aucun paiement enregistré',
    },
  },

  // ── Rapports ──────────────────────────────────────────────────────────
  rapports: {
    title: 'Rapports & Business Intelligence',
    subtitle: 'Analyse des performances et indicateurs clés',
    generate: 'Générer rapport',
    exportPdf: 'Exporter PDF',
    history: 'Rapports générés',
    volumeByOperator: 'Volume par opérateur',
    topAgents: 'Top 5 agents du mois',
    monthlyObjective: 'Progression vers l\'objectif mensuel',
    achieved: 'réalisé',
    objective: 'Objectif',

    breadcrumb: 'Rapports & BI',
    periodAria: 'Période',
    periods: {
      janvier_2024: 'Janvier 2024',
      decembre_2023: 'Décembre 2023',
      trimestre_4_2023: 'T4 2023',
    },
    typesRapport: {
      journalier: 'Rapport journalier',
      hebdomadaire: 'Rapport hebdomadaire',
      mensuel: 'Rapport mensuel',
    },
    typeLabels: {
      journalier: 'Journalier',
      hebdomadaire: 'Hebdomadaire',
      mensuel: 'Mensuel',
    },
    stats: {
      available: 'Rapports disponibles',
      totalOnPeriod: 'au total sur la période',
      generating: 'En génération',
      processing: 'Traitement en cours',
      noProcessing: 'Aucun traitement en cours',
      lastReport: 'Dernier rapport',
    },
    kpi: {
      revenue: "Chiffre d'affaires",
      transactions: 'Transactions',
      newClients: 'Nouveaux clients',
      avgTicket: 'Ticket moyen',
      onPeriod: 'Sur la période',
    },
    generation: {
      bannerTitle: 'Génération lancée',
      queued: 'Rapport en cours de génération. Disponible dans quelques instants.',
      inProgress: 'Génération…',
      typeLabel: 'Type de rapport',
      periodLabel: 'Période',
      closeAria: 'Fermer',
    },
    overview: {
      title: 'Aperçu rapide',
      byOperator: 'Répartition par opérateur',
      totalSuffix: 'au total',
      transactions: 'transactions',
      topAgents: 'Top agents',
      topAgentsSub: 'Volume traité sur la période',
      txSuffix: 'tx',
      progressTitle: "Progression vers l'objectif",
      objectivePrefix: 'Objectif :',
    },
    table: {
      searchPlaceholder: '🔍 Rechercher un rapport…',
      typeFilterAria: 'Type de rapport',
      allTypes: 'Tous les types',
      countSuffix: 'rapport(s)',
      colName: 'Nom du rapport',
      colSize: 'Taille',
      empty: 'Aucun rapport',
      statusAvailable: 'Disponible',
      statusInProgress: 'En cours',
    },
    exports: {
      report: 'Rapport',
      operator: 'Opérateur',
      amountFcfa: 'Montant (FCFA)',
      pctOfTotal: '% du total',
      monthlyReport: 'Rapport mensuel',
      bi: 'Business Intelligence',
    },
  },

  // ── Comptabilité SYSCOHADA ────────────────────────────────────────────
  comptabilite: {
    title: 'Comptabilité SYSCOHADA',
    breadcrumb: 'Comptabilité',
    fiscalYearAria: 'Exercice fiscal',
    allFiscalYears: 'Tous les exercices',
    loadingFiscalYears: 'Chargement des exercices…',
    noFiscalYear: 'Aucun exercice fiscal ouvert',
    allYearsCombined: 'Tous exercices confondus',
    fiscalYearPrefix: 'Exercice',

    kpi: {
      produits: 'Produits (classe 7)',
      charges: 'Charges (classe 6)',
      resultatNet: 'Résultat net',
      tresorerie: 'Trésorerie (classe 5)',
      unavailable: 'Indisponible',
      periodCumul: 'Cumul de la période',
      produitsMoinsCharges: 'Produits − Charges',
      deficitaire: 'Exercice déficitaire',
      bilanTresorerie: 'Postes de trésorerie du bilan',
    },

    onglets: {
      grandlivre: 'Grand Livre',
      balance: 'Balance',
      resultat: 'Compte de Résultat',
      bilan: 'Bilan',
      plan: 'Plan comptable',
    },

    etat: {
      loading: 'Chargement des données comptables…',
      error: 'Données comptables indisponibles. Aucun montant ne peut être affiché.',
      empty: 'Aucune donnée',
    },

    journal: {
      title: 'Écritures du journal',
      countSuffix: 'écriture(s)',
      empty: 'Aucune écriture comptable pour cet exercice',
      colDate: 'Date',
      colReference: 'Référence',
      colCompte: 'Compte',
      colLibelle: 'Libellé',
      colDebit: 'Débit',
      colCredit: 'Crédit',
      colStatut: 'Statut',
      auto: 'Auto',
      manuelle: 'Manuelle',
      validee: 'Validée',
    },

    balance: {
      title: 'Balance de vérification',
      empty: 'Aucun mouvement comptable à balancer',
      colNumero: 'N° compte',
      colIntitule: 'Intitulé',
      colTotalDebit: 'Total débit',
      colTotalCredit: 'Total crédit',
      colSolde: 'Solde',
      colSens: 'Sens',
      debiteur: 'Débiteur',
      crediteur: 'Créditeur',
      totaux: 'TOTAUX',
      equilibree: '✅ Balance équilibrée — Total débit = Total crédit',
      desequilibree: '⚠️ Balance déséquilibrée — vérifiez les écritures',
    },

    resultat: {
      empty: 'Aucun produit ni charge enregistré sur la période',
      produitsHeader: '📈 Produits — Classe 7',
      chargesHeader: '📉 Charges — Classe 6',
      noProduit: 'Aucun produit enregistré',
      noCharge: 'Aucune charge enregistrée',
      totalProduits: 'TOTAL PRODUITS',
      totalCharges: 'TOTAL CHARGES',
      netTitle: "Résultat net de l'exercice",
      beneficiaire: 'Exercice bénéficiaire',
      deficitaire: 'Exercice déficitaire',
    },

    bilan: {
      actif: 'ACTIF',
      passif: 'PASSIF',
      immobilisations: 'Immobilisations',
      stocks: 'Stocks',
      creances: 'Créances',
      tresorerie: 'Trésorerie',
      capitaux: 'Capitaux propres',
      dettes: 'Dettes',
      noPoste: 'Aucun poste',
      totalActif: 'TOTAL ACTIF',
      totalPassif: 'TOTAL PASSIF',
      desequilibrePrefix: '⚠️ Bilan déséquilibré — écart de',
    },

    plan: {
      title: 'Plan comptable SYSCOHADA',
      countSuffix: 'comptes',
      empty: 'Plan comptable non initialisé pour ce tenant',
      colNumero: 'N° compte',
      colIntitule: 'Intitulé',
      colType: 'Type',
      colSens: 'Sens normal',
      debit: 'Débit',
      credit: 'Crédit',
    },
  },

  // ── IA & Surveillance (audit) ─────────────────────────────────────────
  iaFraude: {
    title: '🤖 IA & Surveillance',
    breadcrumb: 'IA & Surveillance',
    subtitle: "Alertes d'audit et événements de sécurité issus du journal réel — aucune donnée simulée",
    refresh: '🔄 Actualiser',

    severite: {
      high: '🔴 Élevée',
      medium: '🟡 Moyenne',
      low: '🟢 Faible',
    },

    types: {
      EXCESSIVE_ACTIVITY: "Volume d'actions inhabituel",
    },

    ai: {
      loading: 'Statut IA…',
      unavailable: 'Statut IA indisponible',
      online: 'Assistant SARA actif',
      offline: 'Assistant SARA hors ligne',
      title: 'Assistant IA SARA',
      providersUnavailable: 'Statut des fournisseurs IA non disponible',
      providerPrefix: 'Fournisseur actif :',
      modelPrefix: 'Modèle :',
      noScoringNotice:
        "ⓘ Aucun moteur de scoring de fraude n'est configuré : cette page ne calcule ni score de risque ni probabilité de fraude. Elle relaie uniquement les alertes du journal d'audit.",
    },

    kpi: {
      auditedActions: 'Actions auditées (24 h)',
      auditedActionsSub: "Journal d'audit · 24 dernières heures",
      activeAlerts: "Alertes d'audit actives",
      unavailable: 'Indisponible',
      highSeverityPrefix: 'dont',
      highSeveritySuffix: 'de sévérité élevée',
      noHighSeverity: 'Aucune sévérité élevée',
      loginFailures: 'Échecs de connexion (7 j)',
      loginFailuresSub: 'Événements LOGIN_FAILED audités',
      lockedAccounts: 'Comptes verrouillés (7 j)',
      lockedAccountsSub: 'Événements ACCOUNT_LOCKED audités',
    },

    alertes: {
      title: "🚨 Alertes d'audit",
      loading: "Chargement des alertes d'audit…",
      error:
        "Impossible de charger les alertes d'audit. Aucune donnée n'est affichée pour éviter toute interprétation erronée.",
      empty:
        "Aucune alerte d'audit sur la dernière heure. Aucune détection de fraude n'est configurée sur ce système.",
      colType: 'Type',
      colUser: 'Utilisateur',
      colCount: "Nb d'actions",
      colPeriod: 'Période',
      colSeverity: 'Sévérité',
      colDetail: 'Détail',
      disclaimer:
        "Ces alertes signalent un volume d'activité inhabituel dans le journal d'audit. Elles ne constituent pas une accusation de fraude et doivent être vérifiées manuellement.",
    },

    security: {
      title: '🔐 Événements de sécurité — 7 derniers jours',
      loading: 'Chargement des événements de sécurité…',
      error: 'Impossible de charger les événements de sécurité.',
      empty: 'Aucun événement de sécurité enregistré sur les 7 derniers jours.',
    },

    financial: {
      title: '💰 Mouvements financiers audités',
      loading: 'Chargement des mouvements financiers…',
      error: 'Impossible de charger les mouvements financiers audités.',
      empty: 'Aucun mouvement financier audité.',
    },

    colonnes: {
      date: 'Date',
      action: 'Action',
      user: 'Utilisateur',
      entity: 'Entité',
    },
  },

  // ── Administration système ────────────────────────────────────────────
  administration: {
    title: '⚙️ Administration système',
    breadcrumb: 'Administration',
    subtitle: "Utilisateurs, rôles et supervision du journal d'audit",
    restricted: 'Accès restreint',
    restrictedMessage:
      "Cette page est réservée aux administrateurs. Contactez un administrateur de votre organisation si vous pensez qu'il s'agit d'une erreur.",
    exportAudit: '📥 Exporter audit',
    exportCsv: '📥 Exporter CSV',
    exporting: 'Export en cours…',
    exportError: "L'export du journal d'audit a échoué. Réessayez.",

    statuts: {
      actif: '● Actif',
      suspendu: '● Suspendu',
      inactif: '● Inactif',
      enAttente: '● En attente',
    },

    stats: {
      totalUsers: 'Utilisateurs total',
      unavailable: 'Données indisponibles',
      activeSuffix: 'actifs',
      inactiveSuffix: 'inactifs/suspendus',
      roles: 'Rôles configurés',
      tenantRoles: 'Rôles du tenant',
      auditActions: 'Actions audit (24h)',
      actionTypesSuffix: "types d'action",
      auditAlerts: 'Alertes audit',
      abnormalActivity: 'Activité anormale (1h)',
    },

    alertes: {
      title: '🚨 Alertes de sécurité',
      severityPrefix: 'sévérité',
    },

    users: {
      title: '👥 Utilisateurs',
      loading: 'Chargement des utilisateurs…',
      error: 'Impossible de charger les utilisateurs. Vérifiez vos droits ou réessayez.',
      empty: 'Aucun utilisateur enregistré.',
      colUser: 'Utilisateur',
      colRole: 'Rôle',
      colLastLogin: 'Dernière connexion',
      colStatus: 'Statut',
      neverConnected: 'Jamais connecté',
    },

    roles: {
      title: '🔐 Rôles & permissions',
      loading: 'Chargement des rôles…',
      error: 'Impossible de charger les rôles.',
      empty: 'Aucun rôle configuré pour cette organisation.',
      usersSuffix: 'utilisateur(s)',
      noPermission: 'Aucune permission enregistrée',
    },

    audit: {
      title: "📋 Journal d'audit récent",
      loading: "Chargement du journal d'audit…",
      error: "Impossible de charger le journal d'audit.",
      empty: "Aucune entrée dans le journal d'audit.",
      colDate: 'Date',
      colAction: 'Action',
      colResource: 'Ressource',
      colUser: 'Utilisateur',
      colIp: 'IP',
      system: 'Système',
    },
  },

  // ── Notifications ─────────────────────────────────────────────────────
  notifications: {
    title: 'Notifications',
    subtitle: 'Gérez vos alertes et messages du système',
    markAllRead: 'Tout marquer lu',
    settings: 'Paramètres',

    filtres: {
      toutes: 'Toutes',
      non_lues: 'Non lues',
      alerte: 'Alertes',
      transaction: 'Transactions',
      systeme: 'Système',
    },

    loading: 'Chargement…',
    empty: 'Aucune notification',
    emptyUnread: 'Toutes vos notifications ont été lues.',
    emptyCategory: 'Aucune notification dans cette catégorie.',
    unreadDot: 'Non lue',
    markRead: 'Marquer comme lue',
    delete: 'Supprimer la notification',
    prev: 'Précédent',
    next: 'Suivant',
  },

  // ── Support ───────────────────────────────────────────────────────────
  support: {
    title: 'Support & Tickets',
    subtitle: 'Suivi de vos demandes d\'assistance',
    newTicket: 'Nouveau ticket',
    ticketTitle: 'Titre du problème',
    description: 'Description détaillée',
    category: 'Catégorie',
    priority: 'Priorité',
    status: {
      open: 'Ouvert',
      inProgress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    },
    priority_levels: {
      low: 'Basse',
      normal: 'Normale',
      high: 'Haute',
      urgent: 'Urgente',
    },
    reply: 'Répondre',
    attach: 'Joindre un fichier',
    sendTicket: 'Envoyer le ticket',
    urgentContact: 'Urgence ? Contactez-nous directement',
    urgentSub: 'Réponse garantie en moins de 2h pour les tickets urgents.',
    noTickets: 'Aucun ticket dans cette catégorie.',
    createFirst: 'Créer un nouveau ticket →',
    messages: 'messages',
    updatedAt: 'Mis à jour',
    kpiTotal: 'Total',
    kpiOpen: 'Ouverts',
    kpiInProgress: 'En cours',
    kpiResolved: 'Résolus',
    filterAll: 'Tous',
    newTicketTitle: 'Nouveau ticket de support',
    titleRequired: 'Titre du problème *',
    titlePlaceholder: 'Ex : Transaction bloquée, agent ne peut pas se connecter…',
    descriptionRequired: 'Description détaillée *',
    descriptionPlaceholder: 'Décrivez le problème en détail : étapes pour reproduire, messages d\'erreur, références de transactions concernées…',
    cancel: 'Annuler',
    sending: 'Envoi…',
    close: 'Fermer',
    backToTickets: 'Retour aux tickets',
    openedAt: 'Ouvert',
    categoryPrefix: 'Catégorie',
    supportBadge: 'Support IBIG Soft',
    you: 'Vous',
    replyPlaceholder: 'Votre réponse… (⌘+Entrée pour envoyer)',
    categories: {
      technique: 'Problème technique',
      transaction: 'Transaction',
      float: 'Float / Solde',
      agent: 'Agent / Accès',
      facturation: 'Facturation',
      autre: 'Autre',
    },
  },

  // ── Aide / Guide ──────────────────────────────────────────────────────
  aide: {
    title: "Centre d'aide",
    subtitle: 'Guide utilisateur GESTMONEY',
    search: 'Rechercher dans le guide…',
    searchPlaceholder: 'Rechercher dans le guide… (ex: transaction, float, export)',
    exportPdf: 'Exporter le guide PDF',
    results: 'résultat(s) pour',
    noResults: 'Aucun article trouvé. Essayez d\'autres mots-clés.',
    contactSupport: 'Contacter le support',
    showAll: 'Tout afficher',
    articles: 'article(s)',
    faq: 'Questions fréquentes',
    faqSub: 'Les questions les plus posées par les utilisateurs',
    notFound: 'Vous n\'avez pas trouvé la réponse ?',
    notFoundSub: 'Notre équipe support répond sous 4h en jours ouvrés.',
    emailSupport: 'Email support',
    liveChat: 'Chat en direct',
    centre: {
      badge: 'Centre d\'aide GESTMONEY',
      heroTitle: 'Comment pouvons-nous vous aider ?',
      heroSubtitle: 'Guide complet, 100 FAQ, tickets support et SARA votre assistante IA — toute l\'aide dont vous avez besoin.',
      searchPlaceholder: 'Rechercher dans le guide, FAQ, articles…',
      clear: 'Effacer',
      noResultFor: 'Aucun résultat pour « {q} »',
      openTicketLink: 'Ouvrir un ticket de support →',
      resourcesTitle: 'Ressources d\'aide',
      categories: {
        guide: {
          titre: 'Guide utilisateur',
          description: 'Documentation complète, procédures pas-à-pas, tutoriels par module.',
          badge: '15 sections',
        },
        faq: {
          titre: 'FAQ — 100 questions',
          description: '100 questions/réponses réelles classées par module et rôle utilisateur.',
          badge: '12 catégories',
        },
        support: {
          titre: 'Tickets support',
          description: 'Ouvrir un ticket, suivre votre demande, contacter l\'équipe technique.',
          badge: 'Réponse < 4h',
        },
        sara: {
          titre: 'SARA — Assistant IA',
          description: 'Posez n\'importe quelle question à SARA, votre assistant IA GESTMONEY.',
          badge: 'IA disponible 24h/24',
        },
      },
      popularTitle: 'Articles populaires',
      seeFullGuide: 'Voir le guide complet',
      articles: {
        a1: { titre: 'Se connecter pour la première fois', section: 'Démarrage' },
        a2: { titre: 'Enregistrer une transaction Mobile Money', section: 'Transactions' },
        a3: { titre: 'Comprendre les rôles et permissions', section: 'Sécurité' },
        a4: { titre: 'Configurer les seuils d\'alerte float', section: 'Float' },
        a5: { titre: 'Exporter les transactions en Excel', section: 'Transactions' },
        a6: { titre: 'Ajouter un nouvel agent', section: 'Agents' },
        a7: { titre: 'Activer la double authentification', section: 'Sécurité' },
        a8: { titre: 'Générer un rapport mensuel', section: 'Rapports' },
      },
      faqTitle: 'Questions fréquentes',
      faqAll: '100 FAQ complètes',
      faqRapide: {
        f1: 'Comment réinitialiser le mot de passe d\'un agent ?',
        f2: 'Que faire si une transaction reste bloquée ?',
        f3: 'Quelle est la différence entre AGENT et CAISSIER ?',
        f4: 'Comment configurer les commissions ?',
        f5: 'Les données sont-elles sauvegardées automatiquement ?',
      },
      indexFaq: {
        i1: { titre: 'Comment réinitialiser le mot de passe d\'un agent ?', sous: 'FAQ · Connexion' },
        i2: { titre: 'Comment effectuer une transaction Mobile Money ?', sous: 'FAQ · Transactions' },
        i3: { titre: 'Quelle est la différence entre AGENT et MANAGER ?', sous: 'FAQ · Permissions' },
        i4: { titre: 'Comment configurer les commissions par opérateur ?', sous: 'FAQ · Commissions' },
        i5: { titre: 'Comment exporter les transactions en Excel ?', sous: 'FAQ · Exports' },
        i6: { titre: 'Comment ajouter un agent ?', sous: 'FAQ · Agents' },
        i7: { titre: 'Configuration des opérateurs Mobile Money', sous: 'Paramétrage' },
        i8: { titre: 'Activer la double authentification (2FA)', sous: 'Sécurité' },
        i9: { titre: 'Ouvrir un ticket de support', sous: 'Support' },
      },
      quickAccessTitle: 'Accès rapides',
      quickLinks: {
        transaction: 'Enregistrer une transaction',
        agent: 'Ajouter un agent',
        float: 'Consulter le float',
        rapport: 'Générer un rapport',
        deuxFa: 'Activer la 2FA',
        ticket: 'Ouvrir un ticket',
      },
      servicesTitle: 'État des services',
      servicesStatus: {
        operationnel: 'Opérationnel',
        degradation: 'Dégradé',
        incident: 'Incident',
      },
      services: {
        web: 'Application Web',
        api: 'API Backend',
        orange: 'Orange Money (CI)',
        wave: 'Wave Sénégal',
        mtn: 'MTN Mobile Money',
        sara: 'SARA IA',
      },
      contactTitle: 'Besoin d\'aide urgente ?',
      contactSub: 'Notre équipe répond sous 4h en jours ouvrés. Pour les urgences, réponse garantie en 2h.',
      openTicket: 'Ouvrir un ticket',
      newsTitle: 'Nouveautés v2.1',
      news: {
        n1: 'Export Excel avec graphiques intégrés',
        n2: 'SARA IA : réponses en anglais et français',
        n3: 'Mode sombre amélioré',
        n4: 'Rapport PDF automatique mensuel',
      },
    },
  },

  // ── Onboarding ────────────────────────────────────────────────────────
  onboarding: {
    step: 'Étape',
    of: 'sur',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    finish: 'Terminer',
    steps: {
      bienvenue: {
        titre: 'Bienvenue sur GESTMONEY',
        description: 'La plateforme panafricaine de gestion Mobile Money. Découvrez comment configurer votre espace en quelques minutes.',
        actionLabel: null,
      },
      operateur: {
        titre: 'Configurer vos opérateurs',
        description: 'Activez les réseaux Mobile Money que vous utilisez : Orange Money, Wave, MTN MoMo, Moov…',
        actionLabel: 'Configurer maintenant',
      },
      agent: {
        titre: 'Créer votre premier agent',
        description: 'Ajoutez vos agents de terrain pour commencer à tracer les transactions et gérer votre réseau.',
        actionLabel: 'Ajouter un agent',
      },
      termine: {
        titre: 'Vous êtes prêt !',
        description: 'Votre espace GESTMONEY est configuré. Explorez le tableau de bord et découvrez toutes les fonctionnalités.',
        actionLabel: 'Aller au tableau de bord',
      },
    },
  },

  // ── Assistant IA ──────────────────────────────────────────────────────
  assistant: {
    title: 'Assistant GESTMONEY',
    online: 'En ligne · Alimenté par IA',
    placeholder: 'Posez votre question…',
    suggestions: [
      'Comment enregistrer une transaction ?',
      'Mon float est bas, que faire ?',
      'Comment ajouter un agent ?',
      'Exporter les rapports en PDF',
    ],
  },

  // ── Paramètres ────────────────────────────────────────────────────────
  settings: {
    title: 'Paramètres',
    subtitle: 'Gérez votre profil, sécurité et préférences',
    profile: 'Profil',
    security: 'Sécurité',
    notifications: 'Notifications',
    appearance: 'Apparence',
    guide: 'Guide de démarrage',
    guideSub: "Relancez le wizard d'onboarding pour redécouvrir les fonctionnalités clés",
    relaunchGuide: 'Relancer le guide',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    language: "Langue de l'interface",
    density: "Densité d'affichage",
    compact: 'Compact',
    normal: 'Normal',
    comfortable: 'Confortable',
    apply: 'Appliquer',
    changePhoto: 'Changer la photo de profil',
    uploadPhoto: 'Télécharger une photo',
    defaultUser: 'Utilisateur',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    languageField: 'Langue',
    timezone: 'Fuseau horaire',
    oldPassword: 'Ancien mot de passe',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    twoFactor: 'Authentification à deux facteurs',
    twoFactorSub: 'Renforcez la sécurité de votre compte avec un code temporaire (TOTP).',
    scanQr: 'Scannez ce QR code avec votre application d\'authentification',
    qrLabel: 'QR Code 2FA',
    secretCode: 'Code secret :',
    activeSessions: 'Sessions actives',
    currentSession: 'Session actuelle',
    revoke: 'Révoquer',
    notifCategory: 'Catégorie',
    notifVia: '{cat} via {canal}',
    notifCategories: {
      transactions: 'Transactions',
      float: 'Float',
      commissions: 'Commissions',
      fraude: 'Fraude',
      systeme: 'Système',
    },
    notifChannels: {
      email: 'Email',
      sms: 'SMS',
      push: 'Push',
      inApp: 'In-app',
    },
  },

  // ── Emails ────────────────────────────────────────────────────────────
  emails: {
    title: 'Emails automatiques',
    smtpConfig: 'Configuration SMTP',
    connected: 'Connecté',
    preview: 'Prévisualiser',
    sendTest: 'Envoyer un test',
    testSent: 'Email de test envoyé à',
    categories: {
      auth: 'Authentification',
      transaction: 'Transaction',
      alerte: 'Alerte',
      rapport: 'Rapport',
      reseau: 'Réseau',
    },
  },

  // ── Licences ──────────────────────────────────────────────────────────
  licences: {
    title: 'Licences & Facturation',
    mrr: 'MRR',
    arr: 'ARR projeté',
    trials: 'Essais actifs',
    toRenew: 'À renouveler',
    pricing: 'Grille tarifaire',
    activate: 'Réactiver',
    suspend: 'Suspendre',
    renew: 'Renouveler',
    manage: 'Gérer →',
    daysLeft: 'J-',
    expired: 'Expiré',
    clients: 'client(s)',
    includedFeatures: 'Inclus dans ce plan',
  },

  // ── SuperAdmin ────────────────────────────────────────────────────────
  superadmin: {
    title: 'Console SuperAdmin',
    subtitle: 'Pilotage global IBIG Soft — accès restreint',
    operational: 'Système opérationnel',
    uptime: 'uptime',
    tenants: 'Tenants actifs',
    trials: 'Essais en cours',
    activeUsers: 'Utilisateurs actifs',
    todayTx: "Tx aujourd'hui",
    mrr: 'MRR',
    pendingPayment: 'En attente paiement',
    openTickets: 'Tickets ouverts',
    apiLatency: 'Latence API',
    clients: 'Clients & tenants',
    auditLog: "Journal d'audit global",
    auditSub: "Dernières actions sur l'ensemble de la plateforme",
    entries: 'entrée(s)',
    columns: {
      societe: 'Société',
      plan: 'Plan',
      statut: 'Statut',
      utilisateurs: 'Utilisateurs',
      txMois: 'Tx ce mois',
      renouvellement: 'Renouvellement',
    },
    statutLabels: {
      ACTIVE: 'Actif',
      TRIAL: 'Essai',
      SUSPENDED: 'Suspendu',
      EXPIRED: 'Expiré',
    },
    kpi: {
      totalSuffix: 'au total',
      expiredSuffix: 'expiré(s)',
      registeredSuffix: 'inscrits',
      arrPrefix: 'ARR :',
      toFollowUp: 'À relancer',
      inProgressSuffix: 'en cours',
      moduleOffline: 'Module non branché',
      errors24h: 'erreur(s) / 24h',
      monitoringOffline: 'Supervision non branchée',
    },
    quick: {
      emails: 'Emails automatiques',
      emailsSub: '6 templates · Config SMTP',
      licences: 'Licences & Facturation',
      licencesSub: 'licences · MRR',
      infra: 'Infrastructure',
      infraSub: 'Bientôt disponible',
    },

    // ── Sous-page Prospects (maquette) ──────────────────────────────────
    prospects: {
      title: 'CRM Prospects',
      subtitle: 'Pipeline commercial GESTMONEY',
      newProspect: '+ Nouveau prospect',
      all: 'Tous',
      searchPlaceholder: 'Rechercher par nom, entreprise, email…',
      view: 'Voir',
      empty: 'Aucun prospect trouvé.',
      close: 'Fermer',
      kpi: {
        total: 'Total',
        nouveaux: 'Nouveaux',
        enCours: 'En cours',
        gagnes: 'Gagnés',
        conversion: 'Conversion',
      },
      statuts: {
        NOUVEAU: 'Nouveau',
        QUALIFICATION: 'Qualification',
        PROPOSITION: 'Proposition',
        NEGOCIATION: 'Négociation',
        GAGNE: 'Gagné ✓',
        PERDU: 'Perdu',
      },
      origines: {
        DEMO: '📅 Démo',
        SITE_WEB: '🌐 Site',
        PARTENAIRE: '🤝 Partenaire',
        SARA: '🤖 SARA',
        EVENEMENT: '🎪 Événement',
        COLD_EMAIL: '📧 Email',
      },
      columns: {
        prospect: 'Prospect',
        entreprise: 'Entreprise',
        statut: 'Statut',
        score: 'Score',
        origine: 'Origine',
        relance: 'Relance',
        ajoute: 'Ajouté',
      },
      detail: {
        email: 'Email',
        telephone: 'Téléphone',
        secteur: 'Secteur',
        origine: 'Origine',
        score: 'Score',
        priorite: 'Priorité',
        pipeline: 'Statut pipeline',
        planDemo: '📅 Planifier démo',
        creerOffre: '📄 Créer une offre',
        perdu: 'Perdu',
      },
    },

    // ── Sous-page Démonstrations (maquette) ─────────────────────────────
    demos: {
      title: 'Démonstrations',
      subtitle: 'Planification et suivi des démos commerciales',
      schedule: '+ Planifier une démo',
      all: 'Toutes',
      at: 'à',
      join: '🔗 Rejoindre le meeting',
      close: 'Fermer',
      kpi: {
        total: 'Total',
        planifiees: 'Planifiées',
        realisees: 'Réalisées',
        annulees: 'Annulées',
        tauxReal: 'Taux réal.',
      },
      statuts: {
        PLANIFIEE: 'Planifiée',
        REALISEE: 'Réalisée ✓',
        ANNULEE: 'Annulée',
      },
      modes: {
        VISIO: '📹 Visio',
        PRESENTIEL: '🏢 Présentiel',
        TELEPHONE: '📞 Téléphone',
      },
      detail: {
        date: 'Date',
        mode: 'Mode',
        fuseau: 'Fuseau',
        animateur: 'Animateur',
        statut: 'Statut',
        email: 'Email',
        notes: 'Notes',
        markDone: '✓ Marquer réalisée',
        cancel: 'Annuler',
        createOffer: '📄 Créer une offre',
      },
      form: {
        title: 'Planifier une démo',
        prospect: 'Prospect (email)',
        prospectPlaceholder: 'prospect@entreprise.com',
        date: 'Date',
        heure: 'Heure',
        mode: 'Mode',
        visio: '📹 Visioconférence',
        presentiel: '🏢 Présentiel',
        telephone: '📞 Téléphone',
        confirm: 'Confirmer la démonstration',
      },
    },

    // ── Sous-page Offres & Devis (maquette) ─────────────────────────────
    offres: {
      title: 'Offres & Devis',
      subtitle: 'Gestion des propositions commerciales',
      newOffer: '+ Nouvelle offre',
      all: 'Toutes',
      view: 'Voir',
      close: 'Fermer',
      kpi: {
        pipeline: 'Pipeline',
        converties: 'Converties',
        enCours: 'En cours',
        tauxConv: 'Taux conv.',
      },
      statuts: {
        BROUILLON: 'Brouillon',
        ENVOYEE: 'Envoyée',
        EN_NEGOCIATION: 'Négociation',
        CONVERTIE: 'Convertie ✓',
        REFUSEE: 'Refusée',
        EXPIREE: 'Expirée',
      },
      columns: {
        reference: 'Référence',
        prospect: 'Prospect',
        plan: 'Plan',
        ht: 'HT',
        remise: 'Remise',
        ttc: 'TTC',
        statut: 'Statut',
        expiration: 'Expiration',
      },
      detail: {
        plan: 'Plan',
        prixHT: 'Prix HT',
        remise: 'Remise',
        aucune: 'Aucune',
        taxes: 'Taxes',
        totalTTC: 'Total TTC',
        creeeLe: 'Créée le',
        expireLe: 'Expire le',
        send: '📧 Envoyer',
        markConverted: '✓ Marquer convertie',
        pdf: '📥 PDF',
      },
    },

    // ── Sous-page Paiements (maquette) ──────────────────────────────────
    paiements: {
      title: 'Paiements & Facturation',
      subtitle: 'Suivi des transactions et abonnements',
      all: 'Tous',
      view: 'Voir',
      close: 'Fermer',
      kpi: {
        encaisse: 'Encaissé (XOF)',
        enAttente: 'En attente',
        echecs: 'Échecs',
        rembourses: 'Remboursés',
      },
      statuts: {
        REUSSI: 'Réussi ✓',
        EN_ATTENTE: 'En attente',
        ECHEC: 'Échoué',
        REMBOURSE: 'Remboursé',
        ANNULE: 'Annulé',
      },
      columns: {
        reference: 'Référence',
        client: 'Client',
        montant: 'Montant',
        provider: 'Provider',
        plan: 'Plan',
        periode: 'Période',
        statut: 'Statut',
        date: 'Date',
      },
      detail: {
        provider: 'Provider',
        periode: 'Période',
        date: 'Date',
        email: 'Email',
        recu: '📥 Reçu PDF',
        rembourser: '↩ Rembourser',
        relancer: '🔄 Relancer',
      },
    },

    // ── Sous-page Analytics (maquette) ──────────────────────────────────
    analytics: {
      title: 'Analytics Plateforme',
      subtitle: 'Trafic, engagement et conversions',
      vsPrevious: 'vs période précédente',
      trafficTitle: 'Trafic — Sessions',
      lastN: 'Derniers',
      topPagesTitle: 'Pages les plus visitées',
      topEventsTitle: 'Événements clés',
      sourcesTitle: 'Sources de trafic',
      countriesTitle: 'Top pays',
      kpi: {
        sessions: 'Sessions',
        moyJour: 'Moy. / jour',
        rebond: 'Taux de rebond',
        conversions: 'Conversions',
      },
      pages: {
        landing: 'Landing page',
        login: 'Connexion',
        dashboard: 'Tableau de bord',
        tarifs: 'Section Tarifs',
        cgu: 'CGU',
      },
      events: {
        ctaClick: 'Clic CTA Essai gratuit',
        demoRequest: 'Demande de démo',
        loginSuccess: 'Connexion réussie',
        pwaPrompt: 'Invitation PWA affichée',
        saraOpen: 'Ouverture SARA',
      },
      sources: {
        organique: 'Organique',
        direct: 'Direct',
        social: 'Réseaux sociaux',
        partenaires: 'Partenaires',
        emails: 'Emails',
      },
      pays: {
        ci: "Côte d'Ivoire",
        sn: 'Sénégal',
        gh: 'Ghana',
        ml: 'Mali',
        bj: 'Bénin',
      },
    },

    // ── Sous-page SARA — Configuration IA (maquette) ────────────────────
    saraConfig: {
      title: 'SARA — Configuration IA',
      subtitle: "Paramètres de l'assistante intelligente GESTMONEY",
      providerTitle: 'Fournisseur actif',
      active: '🟢 Actif',
      standby: '⚫ Standby',
      modelTitle: 'Modèle',
      genTitle: 'Paramètres de génération',
      temperature: 'Température',
      precise: 'Précis',
      creative: 'Créatif',
      maxTokens: 'Max tokens par réponse',
      promptTitle: 'Prompt système',
      reset: '↺ Réinitialiser',
      charsSuffix: 'caractères',
      tokensEstimated: 'tokens estimés',
      saved: '✓ Configuration sauvegardée !',
      save: 'Sauvegarder la configuration',
      quotasTitle: 'Quotas',
      daily: 'Journalier',
      monthly: 'Mensuel',
      dailyQuota: 'Quota journalier',
      monthlyQuota: 'Quota mensuel',
      usageTitle: 'Usage par provider',
      tokensSuffix: 'k tokens',
      conversationsTitle: 'Conversations récentes',
      msgSuffix: 'msg',
      tokSuffix: 'tok',
      contextes: {
        PUBLIC: '🌐 Public',
        INTERNE: '🔒 Interne',
        SUPPORT: '🎧 Support',
      },
    },

    // ── Sous-page Licences & Facturation (maquette) ─────────────────────
    licencesPage: {
      breadcrumb: 'Console SuperAdmin',
      title: 'Licences & Facturation',
      countSuffix: 'licences',
      activesSuffix: 'actives',
      pricingTitle: 'Grille tarifaire',
      quote: 'Devis',
      perMonthShort: '/mois',
      perMonthLong: '/ mois',
      free: 'Gratuit',
      clientsSuffix: 'client(s)',
      all: 'Toutes',
      manage: 'Gérer →',
      daysLeft: 'J-',
      expired: 'Expiré',
      close: 'Fermer',
      kpi: {
        mrr: 'MRR',
        arr: 'ARR projeté',
        trials: 'Essais actifs',
        toRenew: 'À renouveler',
      },
      statuts: {
        ACTIVE: 'Active',
        TRIAL: 'Essai',
        SUSPENDED: 'Suspendu',
        EXPIRED: 'Expiré',
        PENDING: 'En attente',
      },
      columns: {
        societe: 'Société',
        plan: 'Plan',
        statut: 'Statut',
        mrr: 'MRR',
        utilisateurs: 'Utilisateurs',
        txMois: 'Tx ce mois',
        expiration: 'Expiration',
      },
      modal: {
        currentPlan: 'Plan actuel',
        statut: 'Statut',
        expiration: 'Expiration',
        utilisateurs: 'Utilisateurs',
        txMois: 'Tx ce mois',
        included: 'Inclus dans ce plan',
        reactivate: 'Réactiver',
        suspend: 'Suspendre',
        renew: 'Renouveler',
      },
      plans: {
        STARTER: 'Starter',
        PROFESSIONAL: 'Professional',
        ENTERPRISE: 'Enterprise',
        CUSTOM: 'Custom',
      },
      features: {
        starter: ['5 utilisateurs', '10 000 tx/mois', 'Support email', 'Exports CSV'],
        professional: ['25 utilisateurs', '50 000 tx/mois', 'Support prioritaire', 'Exports PDF/XLSX', 'Rapports BI'],
        enterprise: ['Illimité', 'Transactions illimitées', 'Support dédié 24/7', 'API complète', 'Multi-pays', 'SLA 99.9%'],
        custom: ['Sur mesure', 'Devis personnalisé'],
      },
    },

    // ── Sous-page Emails automatiques ───────────────────────────────────
    emailsPage: {
      // Libellés des gabarits d'email. Ils vivaient en dur dans
      // lib/emailTemplates.ts, qui n'appartenait à aucun périmètre : la page
      // restait donc en français même en anglais.
      templates: {
        bienvenue: {
          titre: 'Bienvenue',
          sujet: 'Bienvenue sur GESTMONEY — votre compte est actif',
          description: "Envoyé dès la création d'un compte utilisateur ou opérateur.",
          declencheur: 'Création de compte',
        },
        reset_mdp: {
          titre: 'Réinitialisation mot de passe',
          sujet: 'Réinitialisez votre mot de passe GESTMONEY',
          description: "Envoyé à la demande de réinitialisation, avec un lien à durée limitée.",
          declencheur: 'Demande de reset',
        },
        transaction_confirmee: {
          titre: 'Confirmation de transaction',
          sujet: 'Votre transaction a été confirmée',
          description: "Envoyé au client après validation d'une transaction.",
          declencheur: 'Transaction validée',
        },
        alerte_float: {
          titre: 'Alerte float bas',
          sujet: 'Alerte : float insuffisant',
          description: "Envoyé quand le solde float d'un opérateur passe sous son seuil.",
          declencheur: 'Seuil float atteint',
        },
        rapport_mensuel: {
          titre: 'Rapport mensuel',
          sujet: 'Votre rapport mensuel GESTMONEY',
          description: "Synthèse d'activité envoyée automatiquement en début de mois.",
          declencheur: 'Début de mois',
        },
        invitation_agent: {
          titre: 'Invitation agent',
          sujet: 'Vous êtes invité à rejoindre GESTMONEY',
          description: "Envoyé à un agent invité à rejoindre le réseau.",
          declencheur: 'Invitation envoyée',
        },
      },
      breadcrumb: 'Console SuperAdmin',
      title: 'Emails automatiques',
      templatesActive: 'templates actifs',
      smtpButton: 'Config. SMTP',
      smtpAlert: "Ouvre l'éditeur SMTP dans un vrai déploiement",
      testSentPrefix: 'Email de test «',
      testSentSuffix: '» envoyé à',
      all: 'Tous',
      enable: 'Activer',
      disable: 'Désactiver',
      preview: 'Prévisualiser',
      sendTest: 'Envoyer un test',
      back: '← Retour',
      close: 'Fermer',
      desktop: 'Desktop',
      mobile: 'Mobile',
      from: 'De :',
      subject: 'Objet :',
      previewTitle: 'Prévisualisation :',
      availableVars: 'Variables disponibles',
      smtpTitle: 'Configuration SMTP',
      smtpSub: "Paramètres d'envoi des emails transactionnels",
      connected: 'Connecté',
      kpi: {
        sent30d: 'Envoyés (30j)',
        openRate: "Taux d'ouverture",
        clickRate: 'Taux de clic',
        errors: "Erreurs d'envoi",
      },
      categories: {
        auth: 'Authentification',
        transaction: 'Transaction',
        alerte: 'Alerte',
        rapport: 'Rapport',
        reseau: 'Réseau',
      },
      smtpFields: {
        server: 'Serveur SMTP',
        port: 'Port',
        sender: 'Expéditeur',
        displayName: 'Nom affiché',
      },
    },
  },

  // ── Guide utilisateur ─────────────────────────────────────────────────
  guide: {
    fil: { accueil: '🏠 Accueil', aide: "Centre d'aide", guide: 'Guide utilisateur' },
    titre: '📘 Guide utilisateur',
    sousTitreA: 'fiches réparties sur',
    sousTitreB: 'modules — tout ce qui est décrit ici existe et fonctionne',
    relancerVisite: 'Relancer la visite',
    exporterPdf: 'Exporter PDF',
    retourAide: "← Centre d'aide",
    banniereTitre: 'Première fois ici ? Commencez par la visite guidée',
    banniereTexte:
      "Une quinzaine de bulles qui vous font le tour des écrans principaux. Les écrans auxquels votre compte n'a pas accès sont automatiquement passés. Vous pouvez la relancer autant de fois que vous voulez.",
    recherchePlaceholder: 'Rechercher… (ex : caisse, float, commission, code prépayé)',
    rechercheAria: 'Rechercher dans le guide',
    resultatUn: 'résultat pour',
    resultatPlusieurs: 'résultats pour',
    aucuneFiche: 'Aucune fiche trouvée. Essayez un autre mot.',
    voirFaq: 'Voir la FAQ',
    tousModules: 'Tous les modules',
    pasEncoreDisponible: 'Pas encore disponible',
    bloqueTitre: 'Toujours bloqué ?',
    bloqueTexte: 'La FAQ répond en une ligne ; le support répond au cas par cas.',
    faq: 'FAQ',
    ouvrirTicket: 'Ouvrir un ticket',
    pdf: {
      titre: 'Guide Utilisateur GESTMONEY',
      fiches: 'fiches',
      modules: 'modules',
      colModule: 'Module',
      colFiche: 'Fiche',
      colObjectif: 'Objectif',
      colRoles: 'Rôles',
    },
    sections: {
      demarrage: { titre: 'Bien démarrer', description: "Vos premiers pas, dans l'ordre, sans rien oublier." },
      navigation: { titre: "Se repérer dans l'application", description: 'Le menu, la barre du haut, et le téléphone.' },
      tableauDeBord: { titre: 'Tableau de bord', description: "L'écran d'accueil, différent selon votre rôle." },
      transactions: { titre: 'Transactions', description: 'Le journal de toutes vos opérations Mobile Money.' },
      float: { titre: 'Gestion Float', description: 'Vos soldes chez chaque opérateur, et leur réapprovisionnement.' },
      caisse: { titre: 'Caisse', description: 'Le journal des espèces et le contrôle de fin de journée.' },
      agences: { titre: 'Agences & PDV', description: 'Vos points de vente et la couverture de votre réseau.' },
      agents: { titre: 'Agents', description: 'Les comptes de vos agents et leur activité du jour.' },
      clients: { titre: 'Clients', description: 'Votre base clients et le suivi KYC.' },
      stock: { titre: 'Stock', description: 'SIM, terminaux, accessoires et consommables.' },
      commissions: { titre: 'Commissions', description: 'Valider et payer ce que vous devez à vos agents.' },
      performances: { titre: 'Performances', description: 'Le classement de vos agents et vos indicateurs clés.' },
      rapports: { titre: 'Rapports & BI', description: 'Générer et transmettre vos chiffres consolidés.' },
      comptabilite: { titre: 'Comptabilité SYSCOHADA', description: 'Vos états comptables, générés depuis vos opérations.' },
      administration: { titre: 'Administration', description: 'Utilisateurs, rôles et journal des actions.' },
      audit: { titre: 'Audit & Alertes', description: "Ce que la page signale — et ce qu'elle ne dit pas." },
      abonnement: { titre: 'Abonnement & paiement', description: 'Régler votre abonnement et suivre vos paiements.' },
      notifications: { titre: 'Notifications', description: 'Vos alertes et messages du système.' },
      parametres: { titre: 'Paramètres', description: 'Profil, sécurité, notifications et apparence.' },
      profil: { titre: 'Mon profil', description: 'Vos informations et votre activité récente.' },
      aide: { titre: 'Aide, support et SARA', description: 'Où poser une question quand ce guide ne suffit pas.' },
    },
    articles: {
      aQuoiSertGestmoney: {
        titre: 'À quoi sert GESTMONEY',
        objectif: 'Comprendre ce que la plateforme fait pour votre activité Mobile Money.',
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
        conseils: ['Si vous ne deviez consulter que deux écrans par jour : le Tableau de bord le matin, la Caisse le soir.'],
      },
      ordreDeConfiguration: {
        titre: 'Dans quel ordre tout configurer',
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
        avertissements: ["Les cases du Guide de démarrage sont enregistrées dans votre navigateur, pas sur le serveur : elles ne suivent pas si vous changez d'appareil."],
        liens: ['Agences & PDV', 'Agents'],
      },
      rolesEtAcces: {
        titre: 'Qui voit quoi : les rôles',
        objectif: 'Comprendre pourquoi un collègue ne voit pas le même menu que vous.',
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
        conseils: ['Le tableau de bord lui aussi change de contenu selon le rôle : un agent y voit « Mes transactions », un administrateur voit tout le réseau.'],
      },
      menuGauche: {
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
      mobile: {
        titre: 'Utiliser GESTMONEY sur téléphone',
        objectif: 'Travailler depuis le terrain, sans ordinateur.',
        roles: ['Tous'],
        tags: ['mobile', 'téléphone', 'terrain'],
        contenu: `<p>Sur téléphone, l'affichage se réorganise :</p>
<ul>
  <li>Le menu de gauche disparaît — ouvrez-le avec le <strong>bouton menu en haut à gauche</strong>.</li>
  <li>Une <strong>barre de navigation en bas de l'écran</strong> donne accès aux écrans les plus utilisés.</li>
  <li>Les tableaux <strong>défilent horizontalement</strong> : faites glisser le doigt pour voir les dernières colonnes (Statut, Actions).</li>
</ul>`,
        conseils: ['Sur un tableau, si vous ne voyez pas la colonne « Actions », faites glisser le tableau vers la gauche.'],
      },
      barreDuHaut: {
        titre: 'La barre du haut',
        objectif: 'Notifications, langue, thème et compte.',
        roles: ['Tous'],
        tags: ['topbar', 'notifications', 'langue', 'thème'],
        contenu: `<p>De gauche à droite : le logo (retour au tableau de bord), la date du jour, le choix de langue <strong>français / anglais</strong>, le basculement <strong>clair / sombre</strong>, la <strong>cloche des notifications</strong> avec son compteur rouge, puis votre <strong>avatar</strong>.</p>
<p>L'avatar ouvre le menu de votre compte : accès au profil et déconnexion.</p>`,
      },
      lireLeTableauDeBord: {
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
        avertissements: ["Si le sous-titre indique « données de démonstration », le serveur n'a pas répondu : les chiffres affichés sont des exemples, pas votre activité réelle. Actualisez, et prévenez le support si cela persiste."],
      },
      enregistrerTransaction: {
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
        avertissements: ['Un montant à zéro ou négatif est refusé avec le message « Montant invalide ».'],
        conseils: ["Renseignez le numéro du client même quand ce n'est pas obligatoire : c'est le seul moyen fiable de retrouver une opération contestée deux semaines plus tard."],
        liens: ['Ouvrir les transactions'],
      },
      statutsTransaction: {
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
        nonDisponible: ["Une transaction ne se modifie pas et ne se supprime pas après saisie : c'est volontaire, un journal comptable ne se réécrit pas. En cas d'erreur, saisissez l'opération de correction."],
      },
      filtrerExporterTransactions: {
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
        avertissements: ["L'export reprend les transactions actuellement chargées à l'écran : appliquez d'abord vos filtres, et vérifiez le nombre de lignes obtenu avant de transmettre le fichier."],
        nonDisponible: ['Sur cette page, seul le CSV est proposé. Pour un PDF ou un Excel mis en forme, passez par Rapports & BI.'],
      },
      comprendreFloat: {
        titre: 'Comprendre le float',
        objectif: 'Savoir ce que représentent les jauges de couleur.',
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
        conseils: ['Float et caisse sont les deux faces d\'une même pièce : un retrait client fait baisser votre caisse en espèces et monter votre float. Un dépôt fait l\'inverse.'],
      },
      demanderReapprovisionnement: {
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
        avertissements: ["Envoyer la demande ne crédite pas le float. Elle doit être approuvée puis réellement exécutée chez l'opérateur : tant que le statut n'est pas « Complété », l'argent n'est pas là."],
        nonDisponible: ['Les seuils d\'alerte affichés en bas de page sont en lecture seule : ils se consultent mais ne se modifient pas depuis cette page.'],
      },
      controleCaisse: {
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
        conseils: ["Un déficit récurrent au même moment de la journée est rarement un vol : c'est presque toujours une opération saisie deux fois, ou pas saisie du tout."],
      },
      ecritureManuelleCaisse: {
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
        avertissements: ["Ne passez pas d'écriture manuelle pour compenser un écart que vous n'expliquez pas : vous feriez disparaître le symptôme sans corriger la cause, et l'écart reviendra."],
        nonDisponible: [
          "Le bouton « Exporter » de la page Caisse n'est pas encore branché : il ne produit aucun fichier. Pour sortir vos mouvements, passez par Comptabilité ou Rapports & BI.",
          'Aucun filtre ni recherche sur le journal de caisse : il affiche la journée en cours.',
        ],
      },
      creerAgence: {
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
        conseils: ['Le champ de recherche accepte le nom, la ville ou le code : sur un grand réseau, chercher par code est le plus rapide.'],
      },
      desactiverAgence: {
        titre: 'Fermer une agence sans perdre son historique',
        objectif: 'Retirer un point de vente du réseau actif.',
        roles: ['Gérant', 'Administrateur'],
        tags: ['désactiver', 'fermeture', 'agence'],
        contenu: `<p>Sur la carte de l'agence, le bouton <strong>⏸️ Désactiver</strong> la sort du réseau actif. Elle n'est pas supprimée : ses transactions passées restent au journal et dans vos rapports. Le bouton <strong>▶️ Activer</strong> fait le chemin inverse.</p>`,
        nonDisponible: ["Le bouton « 👁️ Voir détails » d'une carte agence n'ouvre encore aucune fiche détaillée."],
      },
      creerAgent: {
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
      suivreAgents: {
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
        avertissements: ['Les chiffres du tableau portent sur la JOURNÉE EN COURS. Pour juger un agent sur le mois, allez dans Performances ou Rapports & BI.'],
        nonDisponible: [
          "Le bouton « 👁️ Voir » d'une ligne agent n'ouvre pas encore de fiche individuelle.",
          "Il n'existe pas de réinitialisation de mot de passe agent depuis cette page.",
        ],
      },
      gererClients: {
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
        nonDisponible: ["Les boutons « Voir » et « Vérifier KYC » de la colonne Actions ne sont pas encore branchés : le statut KYC se consulte mais ne se change pas depuis cette page."],
        conseils: ['Un même client saisi deux fois avec deux orthographes différentes fausse ses totaux : cherchez toujours par téléphone avant de créer une fiche.'],
      },
      mouvementsStock: {
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
          'Aucun filtre ni recherche sur cette page : ni par catégorie, ni par agence.',
          'Le catalogue produits ne se crée pas depuis cette page.',
        ],
      },
      validerPayerCommissions: {
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
          'Le récapitulatif avant confirmation est votre dernier filet : lisez le montant total à voix haute avant de confirmer un paiement groupé.',
          "Si un bandeau « Données de démonstration » s'affiche, le service des commissions est injoignable — ne validez ni ne payez rien tant qu'il est là.",
        ],
        nonDisponible: [
          'Les taux et barèmes de commission ne se configurent pas depuis cette page.',
          "La liste des périodes est figée sur des mois de 2024 : elle n'est pas encore alimentée par vos exercices réels.",
        ],
      },
      lirePerformances: {
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
        nonDisponible: ['Aucun export sur cette page. Pour transmettre ces chiffres, passez par Rapports & BI.'],
      },
      genererRapport: {
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
      exporterRapport: {
        titre: 'Exporter en CSV, XLSX ou PDF',
        objectif: 'Récupérer le fichier au bon format.',
        roles: ['Gérant', 'Administrateur', 'Auditeur'],
        tags: ['export', 'pdf', 'xlsx', 'csv'],
        contenu: `<p>Sur chaque ligne de la liste <strong>Rapports générés</strong>, trois boutons apparaissent une fois le rapport <em>disponible</em> : <strong>📥 CSV</strong>, <strong>📊 XLSX</strong> et <strong>📄 PDF</strong>.</p>
<p>Le bouton <strong>📄 Exporter PDF</strong> en haut de page produit une vue d'ensemble de la page courante.</p>
<p>Une recherche et un filtre par type (journalier / hebdomadaire / mensuel) permettent de retrouver un rapport ancien.</p>`,
        avertissements: [
          "Les exports CSV et XLSX d'une ligne contiennent la RÉPARTITION PAR OPÉRATEUR du rapport (opérateur, montant, part en %), et non le détail des transactions. Pour le détail ligne à ligne, exportez depuis la page Transactions.",
          'Le sélecteur de période en haut de page propose des libellés figés (Janvier 2024, Décembre 2023, T4 2023) : ils ne correspondent pas à votre exercice en cours.',
        ],
      },
      lireComptabilite: {
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
        conseils: ["Si la balance s'affiche déséquilibrée, ne cherchez pas dans le bilan : ouvrez le Grand Livre et remontez les écritures les plus récentes."],
        avertissements: ['Le message « Données comptables indisponibles » signifie que le service ne répond pas. Aucun chiffre de secours n\'est inventé ici — c\'est voulu.'],
        nonDisponible: [
          "Aucun export sur cette page, et aucune saisie d'écriture manuelle depuis l'interface.",
          "Le TAFIRE, le tableau des flux de trésorerie, les annexes et la clôture d'exercice ne sont pas encore disponibles.",
        ],
      },
      administrationUtilisateurs: {
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
      comprendreAlertesAudit: {
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
        avertissements: ["Une alerte n'est PAS une accusation. Un agent très productif un jour de forte affluence déclenchera exactement le même signalement qu'un comportement anormal. Ne confrontez jamais quelqu'un sur la seule base de cette page."],
        nonDisponible: [
          'Aucun scoring de fraude, aucune analyse de montants, aucun modèle prédictif.',
          "Les compteurs « Échecs de connexion » et « Comptes verrouillés » peuvent rester à zéro : le journal ne distingue pas encore ces événements.",
          'Aucun export sur cette page.',
        ],
      },
      payerAbonnement: {
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
          'GESTMONEY ne vous demandera JAMAIS votre code secret Mobile Money ni votre mot de passe. Toute personne qui vous le demande au nom de GESTMONEY tente de vous escroquer. Ce rappel est affiché en permanence en haut de la page.',
          "Un badge « Test » à côté d'un moyen de paiement signifie qu'il est en configuration : un paiement passé par ce canal ne compte pas.",
        ],
      },
      gererNotifications: {
        titre: 'Trier et traiter ses notifications',
        objectif: 'Ne pas rater une alerte importante.',
        roles: ['Tous'],
        tags: ['notification', 'alerte', 'non lu'],
        contenu: `<p>Cinq filtres en haut : <strong>Toutes</strong>, <strong>Non lues</strong> (avec son compteur), <strong>Alertes</strong>, <strong>Transactions</strong>, <strong>Système</strong>.</p>
<p>Sur chaque notification, au survol : <strong>✓ Marquer comme lue</strong> et <strong>🗑 Supprimer</strong>. Le bouton <strong>Tout marquer lu</strong> en haut vide le compteur d'un coup ; il est grisé s'il n'y a rien à lire.</p>
<p>La liste est paginée par 6.</p>`,
        avertissements: ['« Tout marquer lu » ne demande pas de confirmation. Parcourez la liste avant de cliquer.'],
        nonDisponible: [
          "Le bouton « Paramètres » de cette page n'est pas encore branché. Les préférences de notification se trouvent dans Paramètres → onglet Notifications.",
          "Les notifications de type float et IA n'ont pas de filtre dédié : retrouvez-les via « Toutes ».",
        ],
      },
      ongletsParametres: {
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
        avertissements: ['Le fuseau horaire conditionne l\'heure inscrite sur toutes vos opérations. Réglez-le avant votre première journée d\'activité, pas après.'],
        nonDisponible: ["Cette page est encore en cours de branchement : les réglages que vous y faites ne sont pas enregistrés sur le serveur et sont perdus au rechargement. La double authentification et la liste des sessions y sont présentées à titre d'aperçu."],
      },
      monProfil: {
        titre: 'Consulter son profil',
        objectif: 'Vérifier ses informations et relire son activité.',
        roles: ['Tous'],
        tags: ['profil', 'compte', 'activité', 'sessions'],
        contenu: `<p>La page affiche votre carte d'identité (initiales, rôle, statut, email, date d'inscription), trois chiffres — <strong>Transactions créées</strong>, <strong>Sessions</strong>, <strong>Dernière connexion</strong> — et l'<strong>historique de vos activités récentes</strong> (action, détail, date).</p>
<p>Le bouton <strong>Modifier le profil</strong> ouvre une fenêtre avec prénom, nom, email et téléphone.</p>`,
        conseils: ["L'historique d'activité est le moyen le plus simple de vérifier si quelqu'un d'autre a utilisé votre compte : une connexion à une heure où vous ne travailliez pas doit vous alerter."],
        nonDisponible: [
          "La fenêtre « Modifier le profil » n'enregistre pas encore vos changements.",
          'Ni la double authentification ni le changement de mot de passe ne se trouvent ici : ils sont dans Paramètres → Sécurité.',
        ],
      },
      ouChercher: {
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
        conseils: ['Un ticket qui contient une référence de transaction et une heure précise est traité bien plus vite qu\'un ticket qui dit « ça ne marche pas ».'],
        liens: ['FAQ — 100 questions', "Centre d'aide", 'Ouvrir un ticket'],
      },
      sara: {
        titre: "SARA : ce qu'il faut savoir",
        objectif: "Ne pas compter sur l'assistant pour l'instant.",
        roles: ['Tous'],
        tags: ['sara', 'ia', 'assistant'],
        contenu: `<p><strong>SARA n'est pas en service.</strong> Le bouton de l'assistant est présent dans l'interface, mais aucun moteur n'y est branché : il ne peut répondre à aucune question.</p>
<p>En attendant, ce guide et la FAQ couvrent l'essentiel, et le support prend le relais pour le reste.</p>`,
        nonDisponible: ["L'assistant SARA est hors ligne. Ne comptez pas dessus pour obtenir une réponse."],
      },
      ecransSuperadmin: {
        titre: 'Les écrans Super Admin',
        objectif: "Savoir ce qui est réel et ce qui ne l'est pas.",
        roles: ['Super admin'],
        tags: ['superadmin', 'maquette', 'prospects', 'licences'],
        contenu: `<p>Si votre compte est un compte <strong>Super admin</strong>, vous voyez une section supplémentaire dans le menu. Huit de ces écrans sont aujourd'hui des <strong>maquettes de présentation</strong> : prospects, offres, paiements, licences, analytics, emails, SARA et démonstrations.</p>
<p>Ils affichent des chiffres d'exemple, figés, qui ne viennent d'aucune base de données. Ils servent à montrer la forme que prendront ces modules, pas à travailler.</p>`,
        avertissements: ["Ne prenez aucune décision à partir des chiffres affichés sur ces huit écrans, et n'y saisissez rien d'important : rien n'y est enregistré."],
      },
    },
  },

  // ── CommandPalette ────────────────────────────────────────────────────
  commandPalette: {
    placeholder: 'Rechercher une page, une action…',
    noResults: 'Aucun résultat pour',
    navigate: 'Naviguer',
    open: 'Ouvrir',
    close: 'Fermer',
    category: 'Navigation',
    descriptions: {
      dashboard:    "Vue d'ensemble en temps réel",
      transactions: 'Dépôts, retraits, transferts',
      agents:       'Gestion des agents de terrain',
      agences:      'Points de vente et agences',
      clients:      'Base clients et fidélité',
      float:        'Soldes et réapprovisionnement',
      caisse:       'Journal de caisse et coffre',
      commissions:  'Plans et paiements agents',
      performances: 'Comparatifs opérateurs',
      rapports:     'Export et analyses',
      notifications:'Alertes et messages système',
      profile:      'Informations personnelles',
      settings:     "Configuration de l'espace",
    },
  },

  // ── Caisse ────────────────────────────────────────────────────────────
  caisse: {
    title: 'Caisse',
    subtitle: 'Journal de caisse et mouvements du jour',
    manualEntry: 'Écriture manuelle',

    stats: {
      soldeActuel: 'Solde actuel',
      entreesJour: 'Entrées du jour',
      sortiesJour: 'Sorties du jour',
      ecart: 'Écart',
      equilibree: 'Caisse équilibrée',
      excedent: 'Excédent',
      deficit: 'Déficit',
    },

    flux: {
      title: 'Flux du jour',
      ecrituresSuffix: 'écritures',
      entrees: 'Entrées',
      sorties: 'Sorties',
    },

    journalTitle: "Journal de caisse — Aujourd'hui",

    columns: {
      date: 'Date / Heure',
      reference: 'Référence',
      libelle: 'Libellé',
      categorie: 'Catégorie',
      agent: 'Agent',
      sens: 'Sens',
      montant: 'Montant',
      soldeApres: 'Solde après',
    },

    sens: {
      entree: 'Entrée',
      sortie: 'Sortie',
    },

    empty: 'Aucune écriture',

    categories: {
      depot: 'Dépôt',
      retrait: 'Retrait',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      reappro: 'Réapprovisionnement',
      commission: 'Commission',
      approvisionnement: 'Approvisionnement',
      frais: 'Frais',
    },

    modal: {
      typeLabel: 'Type *',
      libelleLabel: 'Libellé *',
      libellePlaceholder: "Description de l'écriture",
      montantLabel: 'Montant (FCFA) *',
      categorieLabel: 'Catégorie',
      requiredError: 'Libellé et montant valide sont obligatoires.',
      success: 'Écriture enregistrée avec succès.',
      saveError: "Erreur lors de l'enregistrement.",
    },
  },

  // ── Agences ───────────────────────────────────────────────────────────
  agences: {
    breadcrumb: 'Agences',
    title: '🏪 Gestion des Agences',
    subtitleLoading: 'Chargement du réseau…',
    subtitleNetwork: 'Réseau de',
    subtitleActiveAgencies: 'agence(s) active(s)',
    subtitleCities: 'ville(s) couverte(s)',
    newAgency: '+ Nouvelle agence',

    stats: {
      activeAgencies: 'Agences actives',
      ofTotalPrefix: 'sur',
      ofTotalSuffix: 'au total',
      totalAgents: 'Agents au total',
      onlineNow: 'en ligne maintenant',
      citiesCovered: 'Villes couvertes',
      topPrefix: 'Top :',
      inactiveAgencies: 'Agences inactives',
      inactiveSub: 'à réactiver ou clôturer',
    },

    searchPlaceholder: 'Rechercher une agence (nom, ville, code)…',
    foundSuffix: 'agence(s) trouvée(s)',
    loadingAgencies: 'Chargement des agences…',
    emptyAgencies: 'Aucune agence trouvée',

    pillActive: '● Active',
    pillInactive: '● Inactive',

    metrics: {
      agents: 'Agents',
      online: 'En ligne',
      code: 'Code agence',
      opening: 'Ouverture',
      respPrefix: 'Resp.',
    },

    actions: {
      viewDetails: '👁️ Voir détails',
      deactivate: '⏸️ Désactiver',
      activate: '▶️ Activer',
    },

    map: {
      title: '🗺️ Répartition du réseau',
      pointsSuffix: 'point(s)',
      noCity: 'Aucune ville renseignée',
      agencesSuffix: 'agence(s)',
    },

    csv: {
      nom: 'Nom',
      code: 'Code',
      ville: 'Ville',
      adresse: 'Adresse',
      telephone: 'Téléphone',
      responsable: 'Responsable',
      agents: 'Agents',
      agentsOnline: 'Agents en ligne',
      statut: 'Statut',
      dateCreation: 'Date création',
      active: 'Active',
      inactive: 'Inactive',
    },

    modal: {
      title: 'Nouvelle agence',
      nomLabel: "Nom de l'agence *",
      nomPlaceholder: 'Agence Centre-ville',
      codeLabel: 'Code *',
      codePlaceholder: 'AG-XXX-001',
      villeLabel: 'Ville *',
      villePlaceholder: 'Abidjan',
      telephoneLabel: 'Téléphone',
      telephonePlaceholder: '0701000000',
      adresseLabel: 'Adresse',
      adressePlaceholder: 'Rue, Quartier',
      responsableLabel: 'Responsable',
      responsablePlaceholder: 'Nom du responsable',
      requiredFields: 'Veuillez remplir les champs obligatoires (nom, code, ville).',
      createdPrefix: 'Agence',
      createdSuffix: 'créée avec succès.',
      submit: "Créer l'agence",
    },
  },

  // ── Commissions ───────────────────────────────────────────────────────
  commissions: {
    breadcrumb: 'Commissions',
    title: '💰 Commissions',
    subtitle: 'Calcul, validation et paiement des commissions agents',
    exportCsv: '📥 Exporter CSV',
    processSelection: '💳 Traiter la sélection',

    demoTitle: 'Données de démonstration',
    demoBody: '— le service des commissions est injoignable. Les montants affichés sont fictifs et ne doivent servir ni à valider ni à payer quoi que ce soit.',

    stats: {
      total: 'Total commissions',
      commissionsSuffix: 'commission(s)',
      paid: 'Payées',
      pctOfTotalSuffix: 'du total',
      validated: 'Validées (à payer)',
      pendingValidation: 'En attente de validation',
      agentsConcerned: 'Agents concernés',
      allPeriods: 'Toutes périodes',
      periodPrefix: 'Période',
    },

    tabs: {
      agents: '💰 Commissions agents',
      historique: '📅 Historique paiements',
      objectifs: '🎯 Objectifs',
    },

    periodOptions: {
      all: 'Toutes périodes',
      m202401: 'Janvier 2024',
      m202402: 'Février 2024',
      m202403: 'Mars 2024',
    },

    toolbar: {
      selectedSuffix: 'sélectionnée(s)',
      selectAll: '☑️ Tout sélectionner',
      validate: '✅ Valider',
      pay: '💳 Payer',
      deselect: 'Désélectionner',
      selectAllAria: 'Tout sélectionner',
      selectRowAria: 'Sélectionner',
    },

    columns: {
      agent: 'Agent',
      agence: 'Agence',
      periode: 'Période',
      transactions: 'Transactions',
      volTransactions: 'Vol. transactions',
      taux: 'Taux',
      commission: 'Commission',
      datePaiement: 'Date paiement',
      statut: 'Statut',
      actions: 'Actions',
      montant: 'Montant',
    },

    table: {
      loading: 'Chargement des commissions…',
      empty: 'Aucune commission trouvée pour cette période',
      emptyHistory: 'Aucun paiement de commission enregistré',
      validate: '✅ Valider',
      pay: '💳 Payer',
    },

    pills: {
      pending: '⏳ En attente',
      validated: '🔵 Validé',
      paid: '✅ Payé',
    },

    statutLabels: {
      calculee: 'Calculée',
      validee: 'Validée',
      payee: 'Payée',
    },

    objectifs: {
      progressTitle: '🎯 Avancement des paiements',
      progressSub: 'Part des commissions déjà payées',
      topTitle: '🥇 Commission la plus élevée',
      volumeSuffix: 'de volume',
      repartitionTitle: '📊 Répartition par statut',
      pendingLabel: '⏳ En attente',
      validatedLabel: '🔵 Validées',
      paidLabel: '✅ Payées',
    },

    modal: {
      title: '💳 Confirmation',
      close: 'Fermer',
      intro: 'Vous êtes sur le point de traiter les commissions sélectionnées.',
      rowSelected: 'Commissions sélectionnées',
      rowToValidate: 'À valider',
      rowToPay: 'À marquer payées',
      rowTotal: 'Montant total sélectionné',
      processing: 'Traitement…',
      confirm: '✅ Confirmer',
    },

    messages: {
      validatedSuffix: 'commission(s) validée(s).',
      paidSuffix: 'commission(s) marquée(s) comme payée(s).',
    },

    csv: {
      agent: 'Agent',
      agence: 'Agence',
      periode: 'Période',
      transactions: 'Transactions',
      montantTransactions: 'Montant transactions (FCFA)',
      taux: 'Taux (%)',
      commission: 'Commission (FCFA)',
      statut: 'Statut',
      datePaiement: 'Date paiement',
    },
  },

  // ── Performances ──────────────────────────────────────────────────────
  performances: {
    title: 'Performances',
    subtitle: 'Indicateurs clés du réseau Mobile Money',
    periodPlaceholder: 'Période',

    periods: {
      semaine: 'Cette semaine',
      mois: 'Ce mois',
      trimestre: 'Ce trimestre',
    },

    periodBadges: {
      semaine: 'Semaine',
      mois: 'Mois',
      trimestre: 'Trimestre',
    },

    kpi: {
      volumeTotal: 'Volume total',
      nbTransactions: 'Nb transactions',
      tauxSucces: 'Taux de succès',
      objectif95: 'Objectif 95%',
      ticketMoyen: 'Ticket moyen',
    },

    evolution: {
      title: 'Évolution des volumes',
      sub: '7 derniers jours',
      txSuffix: 'tx',
    },

    operatorTitle: 'Performance par opérateur',

    ranking: {
      title: 'Classement des agents',
      colRang: 'Rang',
      colAgent: 'Agent',
      colVolume: 'Volume',
      colTransactions: 'Transactions',
      colTauxSucces: 'Taux succès',
      colEvolution: 'Évolution',
      ranksSuffix: 'rangs',
    },

    objectifs: {
      volume: 'Objectif volume mensuel',
      transactions: 'Objectif nb transactions',
      tauxSucces: 'Taux de succès cible',
      reached: 'Objectif atteint ✓',
      onTrack: 'En bonne voie',
      attention: 'Attention requise',
      late: 'En retard',
    },
  },

  // ── Stock & Inventaire ────────────────────────────────────────────────
  stock: {
    breadcrumb: 'Stock & Inventaire',
    title: '📦 Stock & Inventaire',
    subtitle: 'SIM, terminaux, accessoires et consommables',
    refresh: '🔄 Actualiser',
    sortieBtn: '📤 Sortie stock',
    entreeBtn: '📥 Entrée stock',

    errorTitle: 'Données de stock indisponibles.',
    errorBody: 'Le service inventaire n’a pas répondu. Utilisez « Actualiser » pour réessayer.',

    stats: {
      produits: 'Produits au catalogue',
      produitsSub: 'Références actives',
      unites: 'Unités en stock',
      lignesSuffix: 'ligne(s) d’inventaire',
      alertes: 'Alertes stock bas',
      critiquesSuffix: 'critique(s)',
      valorisation: 'Valorisation du stock',
      valorisationSub: 'Toutes agences confondues',
    },

    alerts: {
      alertesSuffix: 'alerte(s) stock bas',
      dontPrefix: 'dont',
      agencePrefix: 'agence',
      othersSuffix: 'autre(s)',
    },

    inventaire: {
      sectionTitle: '📋 Inventaire produits',
      colProduit: 'Produit',
      colCategorie: 'Catégorie',
      colAgence: 'Agence',
      colNiveau: 'Niveau de stock',
      colSeuil: 'Seuil alerte',
      colValeurUnitaire: 'Valeur unitaire',
      colValorisation: 'Valorisation',
      colStatut: 'Statut',
      colActions: 'Actions',
      loading: 'Chargement de l’inventaire…',
      error: 'Impossible de charger l’inventaire.',
      empty: 'Aucun produit en stock',
      unknownProduct: 'Produit inconnu',
      unitDefault: 'u.',
      reservedSuffix: 'réservée(s)',
      totalSuffix: 'au total',
      actionEntree: '📥 Entrée',
      actionSortie: '📤 Sortie',
    },

    niveaux: {
      ok: '● OK',
      bas: '⚠️ Bas',
      critique: '🔴 Critique',
    },

    categories: {
      SIM: 'SIM',
      TERMINAL: 'Terminal',
      ACCESSOIRE: 'Accessoire',
      CONSOMMABLE: 'Consommable',
    },

    mouvements: {
      sectionTitle: '🔁 Mouvements de stock',
      colDate: 'Date',
      colProduit: 'Produit',
      colAgence: 'Agence',
      colType: 'Type',
      colQuantite: 'Quantité',
      colMotif: 'Motif',
      colReference: 'Référence',
      colNotes: 'Notes',
      loading: 'Chargement des mouvements…',
      error: 'Impossible de charger les mouvements.',
      empty: 'Aucun mouvement enregistré',
    },

    typeMouvement: {
      IN: 'Entrée',
      OUT: 'Sortie',
      TRANSFER: 'Transfert',
      ADJUSTMENT: 'Ajustement',
    },

    motifs: {
      PURCHASE: 'Achat / réception',
      SALE: 'Vente',
      RETURN: 'Retour',
      DAMAGE: 'Casse / dommage',
      THEFT: 'Vol / perte',
      TRANSFER: 'Transfert',
      INVENTORY: 'Ajustement inventaire',
    },

    modal: {
      titleIn: '📥 Entrée de stock',
      titleOut: '📤 Sortie de stock',
      close: 'Fermer',
      produitLabel: 'Produit',
      noProduct: 'Aucun produit au catalogue.',
      agenceLabel: 'Agence (identifiant)',
      quantiteLabel: 'Quantité',
      motifLabel: 'Motif',
      referenceLabel: 'Référence',
      notesLabel: 'Notes',
      errProduit: 'Produit requis.',
      errAgence: 'Identifiant d’agence requis.',
      errQuantite: 'Quantité invalide (entier ≥ 1).',
      success: 'Mouvement enregistré.',
      errSave: 'Erreur lors de l’enregistrement du mouvement.',
      saving: 'Enregistrement…',
      submit: 'Valider le mouvement',
    },
  },

  // ── Mon profil ────────────────────────────────────────────────────────
  profile: {
    title: 'Mon profil',
    subtitle: 'Consultez et gérez vos informations personnelles',
    edit: 'Modifier le profil',
    active: 'Actif',
    notProvided: 'Non renseigné',
    memberSince: 'Membre depuis le {date}',
    defaultUser: 'Utilisateur',
    statTransactions: 'Transactions créées',
    statTransactionsDesc: 'Total depuis le début',
    statSessions: 'Sessions',
    statSessionsDesc: 'Connexions au total',
    statLastLogin: 'Dernière connexion',
    activityTitle: 'Historique des activités récentes',
    lastActions: '{n} dernières actions',
    colAction: 'Action',
    colDetail: 'Détail',
    colDate: 'Date',
    noActivity: 'Aucune activité enregistrée',
    modalTitle: 'Modifier le profil',
    close: 'Fermer',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    save: 'Enregistrer',
    cancel: 'Annuler',
    roles: {
      super_admin: 'Super Administrateur',
      SUPER_ADMIN: 'Super Administrateur',
      admin: 'Administrateur',
      ADMIN: 'Administrateur',
      NETWORK_ADMIN: 'Admin Réseau',
      superviseur: 'Superviseur',
      SUPERVISEUR: 'Superviseur',
      AGENCY_MANAGER: 'Responsable Agence',
      agent: 'Agent',
      AGENT: 'Agent',
      ACCOUNTANT: 'Comptable',
      AUDITOR: 'Auditeur',
      caissier: 'Caissier',
      CAISSIER: 'Caissier',
      VIEWER: 'Observateur',
    },
  },

  // ── FAQ ───────────────────────────────────────────────────────────────
  faq: {
    title: 'FAQ — Questions fréquentes',
    subtitle: '{n} questions réelles organisées en {c} catégories',
    backToHelp: 'Centre d\'aide',
    fullGuide: 'Guide complet',
    searchPlaceholder: 'Rechercher dans les 100 FAQ… (ex: mot de passe, float, export, commission)',
    clear: 'Effacer',
    all: 'Toutes',
    resultOne: '{n} résultat',
    resultMany: '{n} résultats',
    inCategory: 'dans « {cat} »',
    forQuery: 'pour « {q} »',
    questionOne: '{n} question',
    questionMany: '{n} questions',
    empty: 'Aucune FAQ trouvée pour cette recherche.',
    openTicketLink: 'Ouvrir un ticket de support →',
    ctaTitle: 'Votre question n\'est pas ici ?',
    ctaSubtitle: 'Consultez le guide complet ou ouvrez un ticket — notre équipe répond sous 4h.',
    ctaTicket: 'Ouvrir un ticket',
    rolesAll: 'Tous',
    categories: {
      general: 'Général',
      connexionSecurite: 'Connexion / Sécurité',
      utilisateursPermissions: 'Utilisateurs / Permissions',
      parametres: 'Paramètres',
      transactions: 'Transactions',
      agentsAgences: 'Agents / Agences',
      floatCommissions: 'Float / Commissions',
      rapportsExports: 'Rapports / Exports',
      abonnementsLicences: 'Abonnements / Licences',
      supportTickets: 'Support / Tickets',
      saraIa: 'SARA IA',
      sauvegarde: 'Sauvegarde',
    },
    modules: {
      general: 'Général',
      parametres: 'Paramètres',
      support: 'Support',
      securite: 'Sécurité',
      transactions: 'Transactions',
      authentification: 'Authentification',
      profil: 'Profil',
      agents: 'Agents',
      permissions: 'Permissions',
      operateurs: 'Opérateurs',
      parametresSociete: 'Paramètres Société',
      notifications: 'Notifications',
      commissions: 'Commissions',
      api: 'API',
      agences: 'Agences',
      performances: 'Performances',
      float: 'Float',
      exports: 'Exports',
      rapports: 'Rapports',
      abonnements: 'Abonnements',
      saraIa: 'SARA IA',
    },
    items: {
      g1: {
        question: 'Qu\'est-ce que GESTMONEY ?',
        reponse: 'GESTMONEY est un ERP SaaS spécialisé Mobile Money conçu pour l\'Afrique subsaharienne et la zone OHADA. Il permet aux opérateurs, réseaux d\'agents et institutions financières de gérer les transactions Mobile Money (dépôts, retraits, transferts), le float, les agents, les commissions et les rapports depuis une interface centralisée accessible sur navigateur et mobile.',
        motsCles: ['gestmoney', 'présentation', 'erp', 'mobile money', 'saas', 'afrique'],
      },
      g2: {
        question: 'Quels navigateurs sont supportés ?',
        reponse: 'GESTMONEY fonctionne sur tous les navigateurs modernes : Chrome (recommandé), Firefox, Edge, Safari et Opera. La version minimale recommandée est Chrome 90+. L\'application est également disponible en tant que PWA (Progressive Web App) installable sur votre téléphone Android ou iPhone sans passer par un store.',
        motsCles: ['navigateur', 'chrome', 'firefox', 'mobile', 'pwa', 'compatibilité'],
      },
      g3: {
        question: 'GESTMONEY est-il disponible en anglais ?',
        reponse: 'Oui. GESTMONEY est disponible en français (langue par défaut) et en anglais. Pour changer la langue : allez dans Paramètres → Général → Langue, choisissez "English" et sauvegardez. L\'interface se met à jour immédiatement. L\'assistant IA SARA répond également dans les deux langues.',
        motsCles: ['langue', 'anglais', 'français', 'internationalisation', 'i18n'],
      },
      g4: {
        question: 'Comment accéder à GESTMONEY sur mobile ?',
        reponse: 'GESTMONEY est accessible depuis le navigateur mobile de votre téléphone (Chrome, Safari). Pour une expérience optimale, installez-le comme PWA : sur Chrome Android, appuyez sur les 3 points → "Ajouter à l\'écran d\'accueil". Sur iPhone Safari, appuyez sur Partager → "Sur l\'écran d\'accueil". L\'application fonctionne ensuite comme une app native.',
        motsCles: ['mobile', 'pwa', 'téléphone', 'application', 'android', 'iphone'],
      },
      g5: {
        question: 'Quelle est la disponibilité (uptime) de GESTMONEY ?',
        reponse: 'GESTMONEY garantit une disponibilité de 99,5% par mois (SLA). La page d\'état des services est accessible depuis le Centre d\'aide. Des maintenances programmées sont annoncées au moins 48h à l\'avance par email et notification dans l\'application. Pour les incidents, le support est joignable à support@ibigsoft.com.',
        motsCles: ['uptime', 'disponibilité', 'sla', 'maintenance', 'incident'],
      },
      g6: {
        question: 'Comment contacter le support IBIG Soft ?',
        reponse: 'Plusieurs canaux sont disponibles : (1) Ticket de support dans l\'application (Support → Nouveau ticket) — recommandé, permet un suivi complet. (2) Email : support@ibigsoft.com — réponse sous 4h en jours ouvrés. (3) WhatsApp business pour les urgences (disponible sur le plan Enterprise). L\'assistant IA SARA peut également répondre à la plupart de vos questions 24h/24.',
        motsCles: ['support', 'contact', 'email', 'ticket', 'ibig soft', 'aide'],
      },
      g7: {
        question: 'Les données sont-elles sécurisées et confidentielles ?',
        reponse: 'Oui. GESTMONEY applique les meilleures pratiques de sécurité : chiffrement TLS 1.3 en transit, chiffrement AES-256 au repos, isolation multi-tenant stricte (vos données sont inaccessibles aux autres clients), journalisation de toutes les actions (audit log), et conformité RGPD/OHADA. Les serveurs sont hébergés dans des datacenters certifiés ISO 27001.',
        motsCles: ['sécurité', 'données', 'confidentialité', 'chiffrement', 'rgpd', 'conformité'],
      },
      g8: {
        question: 'Comment mettre à jour GESTMONEY ?',
        reponse: 'GESTMONEY étant un SaaS, les mises à jour sont automatiques et transparentes. Vous bénéficiez toujours de la dernière version sans aucune action de votre part. Les nouvelles fonctionnalités sont annoncées dans la section "Nouveautés" du Centre d\'aide et par email. Aucune installation ou maintenance n\'est requise de votre côté.',
        motsCles: ['mise à jour', 'version', 'saas', 'automatique', 'nouveautés'],
      },
      g9: {
        question: 'Puis-je utiliser GESTMONEY pour plusieurs sociétés ?',
        reponse: 'GESTMONEY utilise une architecture multi-tenant. Chaque société dispose d\'un espace isolé (tenant) avec ses propres données, agents et configurations. Si vous gérez plusieurs entités, chaque société doit avoir son propre abonnement. Un SUPER_ADMIN peut accéder à la console SuperAdmin pour superviser tous les tenants depuis une vue unifiée.',
        motsCles: ['multi-tenant', 'plusieurs sociétés', 'super admin', 'entités'],
      },
      g10: {
        question: 'Quels opérateurs Mobile Money sont supportés ?',
        reponse: 'GESTMONEY supporte nativement : Orange Money (CI, SN, CM, ML, BF, GN), Wave (SN, CI), MTN Mobile Money (CI, GH, CM, UG), Moov Money (CI, BF, TG, BJ), Airtel Money (UG, KE, TZ, NG), M-Pesa (KE, TZ, GH). Tout opérateur disposant d\'une API REST peut être intégré en mode personnalisé. Contactez le support pour les intégrations sur mesure.',
        motsCles: ['opérateur', 'orange money', 'wave', 'mtn', 'moov', 'airtel', 'mpesa'],
      },
      cs1: {
        question: 'Comment réinitialiser mon mot de passe oublié ?',
        reponse: 'Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre adresse email et cliquez sur "Envoyer le lien". Vous recevrez un email contenant un lien de réinitialisation valable 1 heure. Cliquez sur ce lien, choisissez un nouveau mot de passe (minimum 12 caractères, avec majuscules, chiffres et symboles), puis reconnectez-vous avec vos nouveaux identifiants.',
        motsCles: ['mot de passe', 'oublié', 'réinitialisation', 'email', 'connexion'],
      },
      cs2: {
        question: 'Comment activer la double authentification (2FA) ?',
        reponse: 'Allez dans Paramètres → Sécurité → Double authentification, puis cliquez sur "Activer la 2FA". Scannez le QR code avec une application authenticator (Google Authenticator, Authy ou Microsoft Authenticator). Saisissez le code à 6 chiffres affiché par l\'application pour confirmer l\'activation. À chaque connexion future, vous devrez saisir ce code en plus de votre mot de passe. Conservez impérativement vos codes de secours.',
        motsCles: ['2fa', 'double authentification', 'totp', 'google authenticator', 'sécurité'],
      },
      cs3: {
        question: 'Ma session a expiré, que faire ?',
        reponse: 'Les sessions GESTMONEY expirent après 8 heures d\'inactivité par mesure de sécurité. Reconnectez-vous simplement avec vos identifiants. Si vous avez activé la 2FA, vous devrez aussi saisir votre code. Pour prolonger votre session, assurez-vous de rester actif dans l\'application. Sur les postes partagés, il est recommandé de vous déconnecter manuellement après chaque utilisation.',
        motsCles: ['session', 'expirée', 'déconnexion', 'reconnexion', 'inactivité'],
      },
      cs4: {
        question: 'Comment changer mon adresse email de connexion ?',
        reponse: 'Pour changer votre email : Paramètres → Mon profil → Informations personnelles → Modifier l\'email. Saisissez votre nouvel email et votre mot de passe actuel pour confirmer. Un email de vérification est envoyé à la nouvelle adresse. Cliquez sur le lien de vérification pour finaliser le changement. L\'ancienne adresse n\'est plus utilisable après confirmation.',
        motsCles: ['email', 'adresse', 'modifier', 'changer', 'profil'],
      },
      cs5: {
        question: 'Mon compte est bloqué, que faire ?',
        reponse: 'Un compte se bloque après 5 tentatives de connexion échouées consécutives (protection anti-brute force). Le déblocage est automatique après 30 minutes. Pour un déblocage immédiat : contactez votre administrateur GESTMONEY qui peut débloquer le compte depuis Paramètres → Utilisateurs → [votre compte] → Actions → Débloquer. En cas d\'urgence, contactez support@ibigsoft.com.',
        motsCles: ['compte bloqué', 'tentatives', 'déblocage', 'brute force', 'admin'],
      },
      cs6: {
        question: 'Comment changer mon mot de passe (sans l\'avoir oublié) ?',
        reponse: 'Allez dans Paramètres → Sécurité → Changer le mot de passe. Saisissez votre mot de passe actuel, puis entrez et confirmez le nouveau mot de passe. Le nouveau mot de passe doit contenir au minimum 12 caractères dont au moins une majuscule, un chiffre et un symbole spécial. Cliquez sur "Enregistrer". Votre nouvelle session continue sans interruption.',
        motsCles: ['mot de passe', 'changer', 'modifier', 'sécurité', 'paramètres'],
      },
      cs7: {
        question: 'Puis-je me connecter depuis plusieurs navigateurs ou appareils simultanément ?',
        reponse: 'Oui, GESTMONEY permet les sessions simultanées sur plusieurs appareils. Cependant, pour les rôles ADMIN et MANAGER, une alerte email est envoyée lors d\'une connexion depuis un nouvel appareil. Vous pouvez consulter et révoquer les sessions actives dans Paramètres → Sécurité → Sessions actives. Il est recommandé de ne pas partager vos identifiants avec d\'autres personnes.',
        motsCles: ['multi-appareils', 'sessions', 'navigateurs', 'simultané', 'connexion'],
      },
      cs8: {
        question: 'Comment désactiver la 2FA si j\'ai perdu mon téléphone ?',
        reponse: 'Si vous avez perdu votre téléphone et ne pouvez plus accéder à votre application authenticator, utilisez un de vos codes de secours (fournis lors de l\'activation de la 2FA). Sur la page de connexion, après votre email et mot de passe, cliquez sur "Utiliser un code de secours". Si vous n\'avez plus ces codes, contactez d\'urgence support@ibigsoft.com avec votre preuve d\'identité.',
        motsCles: ['2fa', 'perte téléphone', 'codes secours', 'désactiver', 'récupération'],
      },
      cs9: {
        question: 'Comment réinitialiser le mot de passe d\'un agent ?',
        reponse: 'Un MANAGER ou ADMIN peut réinitialiser le mot de passe d\'un agent depuis : Agents → [Nom de l\'agent] → Actions → Réinitialiser le mot de passe. Un email est automatiquement envoyé à l\'agent avec un lien de réinitialisation valable 24 heures. L\'agent devra définir un nouveau mot de passe à sa prochaine connexion. Il est impossible de voir le mot de passe actuel d\'un agent (stocké en hash).',
        motsCles: ['mot de passe agent', 'réinitialisation', 'manager', 'email'],
      },
      cs10: {
        question: 'Comment consulter le journal d\'audit des connexions et actions ?',
        reponse: 'Le journal d\'audit est accessible pour les rôles ADMIN et AUDITOR dans Paramètres → Journal d\'audit. Il liste toutes les actions effectuées dans l\'application : connexions, transactions créées, modifications de paramètres, réinitialisations de mot de passe, avec date, heure, utilisateur et adresse IP. Ce journal est immuable et peut être exporté en CSV pour archivage.',
        motsCles: ['journal audit', 'logs', 'historique actions', 'connexions', 'traçabilité'],
      },
      up1: {
        question: 'Quelle est la différence entre un AGENT et un MANAGER ?',
        reponse: 'Un AGENT peut uniquement enregistrer des transactions (dépôts, retraits, transferts) et consulter ses propres performances. Un MANAGER a un accès élargi : il peut valider/rejeter des transactions en attente, ajouter et gérer des agents, consulter les rapports de tout le réseau, configurer les commissions et exporter les données. Le MANAGER peut aussi réinitialiser les mots de passe des agents.',
        motsCles: ['agent', 'manager', 'différence', 'rôles', 'permissions', 'droits'],
      },
      up2: {
        question: 'Comment ajouter un nouvel utilisateur dans GESTMONEY ?',
        reponse: 'Pour ajouter un utilisateur : Agents → Ajouter un agent (pour un agent/supervisor de terrain) ou Paramètres → Utilisateurs → Inviter un utilisateur (pour un manager/admin/auditor). Renseignez le prénom, nom, email et rôle. GESTMONEY envoie automatiquement un email d\'invitation avec les identifiants temporaires. L\'utilisateur doit changer son mot de passe à sa première connexion.',
        motsCles: ['ajouter utilisateur', 'invitation', 'créer compte', 'nouvel agent'],
      },
      up3: {
        question: 'Comment modifier le rôle d\'un utilisateur ?',
        reponse: 'Pour modifier le rôle d\'un utilisateur (nécessite le rôle ADMIN) : Paramètres → Utilisateurs → [Nom de l\'utilisateur] → Modifier → Rôle. Sélectionnez le nouveau rôle et sauvegardez. Le changement prend effet immédiatement : si l\'utilisateur est connecté, ses droits changent dès sa prochaine action. Note : un ADMIN ne peut pas modifier le rôle d\'un autre ADMIN sans passer par un SUPER_ADMIN.',
        motsCles: ['rôle', 'modifier', 'changer', 'permissions', 'droits', 'admin'],
      },
      up4: {
        question: 'Comment désactiver le compte d\'un agent qui a quitté l\'entreprise ?',
        reponse: 'Pour désactiver un compte sans le supprimer (les données et historiques sont conservés) : Agents → [Nom de l\'agent] → Actions → Désactiver le compte. L\'agent ne pourra plus se connecter. Ses transactions passées restent visibles dans les rapports. Si vous souhaitez réactiver le compte plus tard : même menu → Réactiver. La désactivation est recommandée plutôt que la suppression pour conserver l\'audit trail.',
        motsCles: ['désactiver', 'compte agent', 'quitter', 'départ', 'désactivation'],
      },
      up5: {
        question: 'Un agent peut-il voir les transactions des autres agents ?',
        reponse: 'Non. Un AGENT ne voit que ses propres transactions et ses propres performances. Il ne peut pas accéder aux données des autres agents ni aux rapports globaux. Un SUPERVISOR d\'agence peut voir les transactions des agents de son agence. Un MANAGER peut voir toutes les transactions du réseau. Un AUDITOR a une vue en lecture seule de toutes les données.',
        motsCles: ['agent', 'visibilité', 'transactions autres', 'isolation', 'permissions'],
      },
      up6: {
        question: 'Qu\'est-ce que le rôle AUDITOR et quand l\'utiliser ?',
        reponse: 'L\'AUDITOR est un rôle en lecture seule conçu pour les contrôleurs internes, experts-comptables ou auditeurs externes. Il peut consulter toutes les transactions, rapports, journaux d\'audit et données du réseau sans pouvoir modifier quoi que ce soit. C\'est le rôle idéal pour donner un accès de consultation à un cabinet d\'audit ou à votre service de conformité sans risque de modification accidentelle.',
        motsCles: ['auditor', 'auditeur', 'lecture seule', 'contrôle', 'conformité'],
      },
      up7: {
        question: 'Peut-on limiter les montants de transaction qu\'un agent peut traiter ?',
        reponse: 'Oui. Un ADMIN peut définir des limites de transaction par agent ou par agence depuis : Agents → [Nom de l\'agent] → Paramètres → Limites. Il est possible de définir : un montant maximum par transaction, un plafond journalier et un plafond mensuel. Les transactions dépassant ces limites sont automatiquement bloquées et signalées au superviseur.',
        motsCles: ['limite', 'plafond', 'montant maximum', 'agent', 'restriction'],
      },
      up8: {
        question: 'Comment attribuer un agent à une agence spécifique ?',
        reponse: 'Lors de la création d\'un agent, vous choisissez l\'agence à laquelle il est rattaché. Pour modifier l\'agence d\'un agent existant : Agents → [Nom de l\'agent] → Modifier → Agence. Sélectionnez la nouvelle agence et sauvegardez. Un agent peut être rattaché à une seule agence à la fois. Le transfert d\'agence est enregistré dans le journal d\'audit.',
        motsCles: ['agence', 'rattacher', 'agent', 'transfert', 'point de vente'],
      },
      up9: {
        question: 'Quelle est la différence entre un SUPERVISOR et un MANAGER ?',
        reponse: 'Le SUPERVISOR supervise une ou plusieurs agences spécifiques : il voit les transactions et les agents de ses agences, peut valider des transactions en attente dans son périmètre. Le MANAGER a une portée globale sur tout le réseau du tenant : il gère tous les agents, toutes les agences, les commissions, les configurations et accède à tous les rapports. Le MANAGER peut également créer/supprimer des SUPERVISOR.',
        motsCles: ['supervisor', 'manager', 'différence', 'agence', 'périmètre'],
      },
      up10: {
        question: 'Comment voir la liste de tous les utilisateurs actifs ?',
        reponse: 'La liste complète des utilisateurs est accessible dans Paramètres → Utilisateurs (pour ADMIN) ou Agents (pour MANAGER). Vous pouvez filtrer par rôle, statut (actif/inactif), agence ou date de création. La liste inclut : nom, email, rôle, agence, date de dernière connexion et statut du compte. Elle est exportable en CSV pour la gestion RH.',
        motsCles: ['liste utilisateurs', 'actifs', 'utilisateurs', 'gestion', 'rh'],
      },
      p1: {
        question: 'Comment ajouter un nouvel opérateur Mobile Money ?',
        reponse: 'Allez dans Paramètres → Opérateurs → Ajouter un opérateur. Sélectionnez l\'opérateur dans la liste ou choisissez "Personnalisé". Renseignez les credentials API fournis par l\'opérateur (clé API, secret, URL d\'endpoint). Configurez les seuils de float et les taux de commission. Cliquez sur "Tester la connexion" pour valider, puis sur "Activer". L\'opérateur apparaît dans tous les formulaires de transaction.',
        motsCles: ['opérateur', 'ajouter', 'api', 'configuration', 'mobile money'],
      },
      p2: {
        question: 'Comment modifier le logo de ma société sur les PDF et rapports ?',
        reponse: 'Allez dans Paramètres → Société → Logo. Cliquez sur "Changer le logo" et téléchargez votre fichier PNG ou SVG (taille recommandée : 400x100px, fond transparent). Cliquez sur "Enregistrer". Le nouveau logo apparaît immédiatement sur les nouveaux PDF, rapports et reçus générés. Les anciens documents ne sont pas rétroactivement modifiés.',
        motsCles: ['logo', 'société', 'pdf', 'rapports', 'image', 'branding'],
      },
      p3: {
        question: 'Comment configurer le fuseau horaire ?',
        reponse: 'Le fuseau horaire est critique : il affecte l\'horodatage de toutes les transactions et la date de génération des rapports. Pour le configurer : Paramètres → Société → Fuseau horaire. Sélectionnez votre fuseau (ex: "Africa/Abidjan" pour la Côte d\'Ivoire, "Africa/Dakar" pour le Sénégal). Attention : modifier le fuseau après des transactions crée des décalages dans les rapports historiques.',
        motsCles: ['fuseau horaire', 'timezone', 'heure', 'configuration', 'afrique'],
      },
      p4: {
        question: 'Comment configurer les notifications email ?',
        reponse: 'Allez dans Paramètres → Notifications → Email. Vous pouvez configurer les alertes pour : float bas/critique (avec destinataires spécifiques), transactions en attente, rapports mensuels automatiques, nouveaux tickets de support, et connexions depuis nouveaux appareils. Chaque type d\'alerte peut être activé/désactivé indépendamment et envoyé à des adresses email différentes.',
        motsCles: ['notifications', 'email', 'alertes', 'configuration', 'paramètres'],
      },
      p5: {
        question: 'Comment configurer la devise affichée dans GESTMONEY ?',
        reponse: 'La devise est configurée au niveau de la société dans Paramètres → Société → Devise. GESTMONEY supporte : XOF (FCFA — défaut pour UEMOA), XAF (FCFA — Afrique Centrale), GHS (Cedi Ghana), NGN (Naira Nigeria), KES (Shilling Kenya), UGX (Shilling Ouganda). La devise affichée affecte l\'interface, les rapports et les PDF. Note : les montants ne sont pas convertis, seul le symbole change.',
        motsCles: ['devise', 'fcfa', 'xof', 'monnaie', 'symbole', 'currency'],
      },
      p6: {
        question: 'Comment activer ou désactiver un opérateur temporairement ?',
        reponse: 'Pour désactiver temporairement un opérateur (maintenance, problème technique) : Paramètres → Opérateurs → [Nom de l\'opérateur] → Désactiver. Les agents ne pourront plus créer de transactions sur cet opérateur. Les transactions existantes ne sont pas affectées. Pour réactiver : même procédure → Activer. Pensez à notifier vos agents du changement.',
        motsCles: ['désactiver opérateur', 'maintenance', 'temporaire', 'activer', 'bloquer'],
      },
      p7: {
        question: 'Comment configurer les barèmes de commission ?',
        reponse: 'Les commissions se configurent dans Commissions → Barèmes. Pour chaque opérateur, définissez : le type (pourcentage ou montant fixe), le taux par type d\'opération (dépôt/retrait/transfert), et optionnellement des paliers (ex: 0,5% pour 0-100k FCFA, 1% pour 100k-1M FCFA). Les commissions sont calculées automatiquement à chaque transaction validée et agrégées dans les rapports de commissions.',
        motsCles: ['commission', 'barème', 'taux', 'opérateur', 'configuration', 'palier'],
      },
      p8: {
        question: 'Comment relancer le wizard d\'onboarding ?',
        reponse: 'Le wizard de configuration initiale peut être relancé à tout moment depuis Paramètres → Guide de démarrage → Relancer le guide. Cela affiche à nouveau les 4 étapes de démarrage (Bienvenue, Opérateurs, Premier agent, Terminé). Utile pour la formation de nouveaux administrateurs ou pour reconfigurer rapidement les paramètres de base.',
        motsCles: ['wizard', 'onboarding', 'guide démarrage', 'relancer', 'configuration'],
      },
      p9: {
        question: 'Comment intégrer une API externe à GESTMONEY ?',
        reponse: 'GESTMONEY dispose d\'une API REST complète pour l\'intégration avec des systèmes tiers (comptabilité, CRM, BI). La documentation API est accessible dans Paramètres → API → Documentation. Pour générer une clé API : Paramètres → API → Créer une clé. Chaque clé a une portée (lecture/écriture), une date d\'expiration optionnelle et peut être révoquée à tout moment. Les appels API sont tracés dans le journal d\'audit.',
        motsCles: ['api', 'intégration', 'clé api', 'rest', 'externe', 'documentation'],
      },
      p10: {
        question: 'Comment configurer les messages de reçu de transaction ?',
        reponse: 'Les reçus de transaction peuvent être personnalisés dans Paramètres → Transactions → Modèle de reçu. Vous pouvez modifier : le pied de page (message de remerciement, mentions légales), les coordonnées de l\'agence affichées, l\'ajout de votre logo, et le format (thermique 58mm/80mm ou A5/A4). Ces paramètres s\'appliquent à tous les reçus générés par les agents.',
        motsCles: ['reçu', 'impression', 'modèle', 'personnalisation', 'transaction'],
      },
      t1: {
        question: 'Comment enregistrer une transaction Mobile Money ?',
        reponse: 'Depuis Transactions → Nouvelle transaction : (1) Choisissez le type (Dépôt, Retrait ou Transfert), (2) Sélectionnez l\'opérateur, (3) Saisissez le montant en FCFA, (4) Entrez le numéro de téléphone du client, (5) Ajoutez la référence de l\'opérateur (code fourni par le réseau), (6) Optionnel : ajoutez une note interne, (7) Cliquez sur "Valider". La transaction est enregistrée et un reçu peut être imprimé immédiatement.',
        motsCles: ['transaction', 'enregistrer', 'dépôt', 'retrait', 'transfert', 'mobile money'],
      },
      t2: {
        question: 'Que faire si une transaction reste bloquée en "En attente" ?',
        reponse: 'Vérifiez d\'abord : (1) Le solde float de l\'opérateur concerné — un float insuffisant peut bloquer les retraits. (2) La référence opérateur — une référence invalide ou déjà utilisée bloque la transaction. Si le problème persiste, un MANAGER peut forcer la validation ou le rejet depuis Transactions → [Référence] → Actions → Valider manuellement / Rejeter. En cas de doute, contactez l\'opérateur avec la référence de transaction.',
        motsCles: ['transaction bloquée', 'en attente', 'float', 'référence', 'valider manuellement'],
      },
      t3: {
        question: 'Peut-on annuler une transaction déjà validée ?',
        reponse: 'Une transaction validée ne peut pas être annulée directement dans GESTMONEY (elle est déjà traitée côté opérateur). Pour corriger une erreur : (1) Créez une transaction inverse (si c\'était un dépôt en erreur, créez un retrait du même montant). (2) Notez le motif de correction dans le champ "Note interne". (3) Pour des situations complexes (doublon, erreur de montant), contactez le support opérateur et ouvrez un ticket support GESTMONEY.',
        motsCles: ['annuler', 'transaction validée', 'correction', 'inverse', 'erreur'],
      },
      t4: {
        question: 'Comment rechercher une transaction spécifique ?',
        reponse: 'Dans la page Transactions, utilisez la barre de recherche et les filtres disponibles : référence opérateur, numéro de téléphone client, montant exact, période (date début/fin), type (dépôt/retrait/transfert), opérateur, statut, agent, agence. Vous pouvez combiner plusieurs filtres. Pour retrouver une transaction par numéro de référence : utilisez ⌘K → tapez la référence → sélectionnez la transaction dans les suggestions.',
        motsCles: ['recherche', 'transaction', 'référence', 'filtre', 'retrouver'],
      },
      t5: {
        question: 'Comment imprimer un reçu de transaction ?',
        reponse: 'Après la validation d\'une transaction, un bouton "Imprimer le reçu" apparaît immédiatement. Vous pouvez aussi imprimer le reçu d\'une transaction passée depuis Transactions → [Référence] → Imprimer le reçu. Le format d\'impression est configurable (thermique 58mm, 80mm, ou A5). Pour les imprimantes thermiques Bluetooth, GESTMONEY supporte l\'impression directe via la PWA mobile.',
        motsCles: ['reçu', 'impression', 'imprimante', 'thermique', 'bluetooth'],
      },
      t6: {
        question: 'Quel est le montant maximum par transaction ?',
        reponse: 'Le montant maximum par transaction dépend de deux limites : (1) La limite de l\'opérateur Mobile Money (ex: 1 000 000 FCFA pour un retrait Wave standard). (2) La limite configurée par votre administrateur dans GESTMONEY (Agents → Limites). Si une transaction dépasse la limite, elle est bloquée avec un message d\'erreur précisant la limite applicable. Contactez votre ADMIN pour ajuster les limites si nécessaire.',
        motsCles: ['montant maximum', 'limite', 'plafond', 'transaction', 'opérateur'],
      },
      t7: {
        question: 'Comment importer des transactions en masse ?',
        reponse: 'GESTMONEY supporte l\'import en masse via CSV ou XLSX depuis Transactions → Importer. Téléchargez d\'abord le modèle de fichier ("Télécharger le modèle CSV"). Remplissez les colonnes requises (type, opérateur, montant, numéro client, référence, date). Chargez le fichier et cliquez sur "Valider l\'import". GESTMONEY vérifie chaque ligne et signale les erreurs avant l\'import définitif.',
        motsCles: ['import', 'en masse', 'csv', 'xlsx', 'batch', 'import groupé'],
      },
      t8: {
        question: 'Comment configurer les alertes sur les grosses transactions ?',
        reponse: 'Pour recevoir une alerte quand une transaction dépasse un seuil : Paramètres → Notifications → Transactions → Alertes de montant. Définissez le montant seuil (ex: 500 000 FCFA). À chaque transaction dépassant ce montant, les gestionnaires désignés reçoivent un email et une notification dans l\'application. Utile pour la conformité et la surveillance anti-fraude.',
        motsCles: ['alerte transaction', 'gros montant', 'seuil', 'conformité', 'surveillance'],
      },
      t9: {
        question: 'Comment voir le total des transactions par période ?',
        reponse: 'Plusieurs façons d\'obtenir les totaux par période : (1) Tableau de bord — widget "Transactions du jour/mois". (2) Rapports & BI — générez un rapport pour la période souhaitée. (3) Page Transactions — appliquez le filtre de période et consultez le récapitulatif en bas du tableau. (4) Export CSV/XLSX avec filtre de période pour un traitement externe dans Excel.',
        motsCles: ['total transactions', 'période', 'récapitulatif', 'bilan', 'mois'],
      },
      t10: {
        question: 'Quelle est la différence entre un dépôt, un retrait et un transfert ?',
        reponse: 'Dans GESTMONEY : (1) Dépôt — Un client dépose de l\'argent sur son compte Mobile Money (le float de l\'agent augmente). (2) Retrait — Un client retire de l\'argent depuis son compte Mobile Money (le float de l\'agent diminue). (3) Transfert — Envoi d\'argent d\'un numéro à un autre sans passage de cash (sans impact direct sur le float de l\'agent). Chaque type a un taux de commission potentiellement différent.',
        motsCles: ['dépôt', 'retrait', 'transfert', 'différence', 'type transaction', 'float'],
      },
      aa1: {
        question: 'Comment ajouter un nouvel agent dans le réseau ?',
        reponse: 'Depuis Agents → Ajouter un agent : (1) Renseignez prénom, nom, email et téléphone. (2) Associez-le à une agence. (3) Choisissez son rôle (AGENT ou SUPERVISOR). (4) Définissez ses limites de transaction si nécessaire. (5) Cliquez sur "Créer l\'agent". Un email d\'invitation est automatiquement envoyé avec ses identifiants temporaires valables 48h. L\'agent devra changer son mot de passe à sa première connexion.',
        motsCles: ['ajouter agent', 'créer', 'invitation', 'nouveau', 'réseau'],
      },
      aa2: {
        question: 'Comment consulter les performances d\'un agent ?',
        reponse: 'Depuis Agents → [Nom de l\'agent] : accédez à la fiche de performance avec le volume de transactions, montant total traité, ticket moyen, commissions générées et classement par rapport au réseau. Le tableau de bord principal affiche le Top Agent du mois. La page Performances présente le classement global avec graphiques d\'évolution. Un agent peut consulter ses propres performances mais pas celles des autres.',
        motsCles: ['performances', 'agent', 'classement', 'kpi', 'statistiques', 'top agent'],
      },
      aa3: {
        question: 'Combien d\'agents peut-on créer dans GESTMONEY ?',
        reponse: 'Le nombre d\'agents dépend de votre plan : Starter (5 agents max), Business (25 agents max), Enterprise (illimité). Si vous atteignez la limite, GESTMONEY vous notifie et vous invite à upgrader votre plan. Les agents inactifs (désactivés) comptent dans le quota. Pour libérer des places, vous pouvez supprimer les comptes d\'agents définitivement partis (attention : la suppression est irréversible).',
        motsCles: ['nombre agents', 'limite', 'quota', 'plan', 'maximum'],
      },
      aa4: {
        question: 'Comment créer une nouvelle agence (point de vente) ?',
        reponse: 'Depuis Agences → Nouvelle agence : (1) Renseignez le nom de l\'agence. (2) Saisissez l\'adresse (ville, quartier, rue). (3) Désignez le superviseur responsable de l\'agence. (4) Associez les agents rattachés. (5) Activez les opérateurs disponibles sur ce point de vente. (6) Cliquez sur "Créer l\'agence". L\'agence apparaît dans les filtres de rapports et les formulaires de création d\'agents.',
        motsCles: ['agence', 'créer', 'point de vente', 'nouveau', 'superviseur'],
      },
      aa5: {
        question: 'Comment voir le classement des agents du mois ?',
        reponse: 'Le classement des agents est disponible dans : (1) Tableau de bord — widget "Top agents" en page d\'accueil (Top 3 du mois). (2) Page Performances — classement complet avec volumes, montants et commissions. (3) Rapports & BI — le rapport mensuel inclut toujours le classement complet. Le classement peut être basé sur le volume (nombre de transactions) ou le montant total traité, selon les paramètres configurés.',
        motsCles: ['classement agents', 'top agent', 'mois', 'performances', 'ranking'],
      },
      aa6: {
        question: 'Un agent peut-il être rattaché à plusieurs agences ?',
        reponse: 'Non, dans la version actuelle de GESTMONEY, un agent est rattaché à une seule agence à la fois. Si un agent travaille sur plusieurs points de vente en rotation, la solution recommandée est de le rattacher à l\'agence principale et d\'utiliser les notes de transaction pour identifier le point de vente de chaque opération. Le multi-agence par agent est une fonctionnalité prévue dans les prochaines versions.',
        motsCles: ['agent', 'plusieurs agences', 'multi-agence', 'limitation', 'rotation'],
      },
      aa7: {
        question: 'Comment suivre les transactions d\'une agence spécifique ?',
        reponse: 'Pour filtrer les transactions par agence : (1) Page Transactions → Filtre "Agence" → sélectionnez l\'agence souhaitée. (2) Rapports & BI → Générez un rapport avec le filtre d\'agence activé. (3) Agences → [Nom de l\'agence] → onglet "Transactions" — affiche toutes les transactions de cette agence. Les exports respectent également le filtre d\'agence.',
        motsCles: ['transactions agence', 'filtrer', 'point de vente', 'suivi'],
      },
      aa8: {
        question: 'Comment gérer l\'absence d\'un agent (congé, maladie) ?',
        reponse: 'Pour gérer temporairement l\'absence d\'un agent : (1) Si l\'absence est courte (quelques jours), aucune action requise — les autres agents de l\'agence continuent les transactions. (2) Si l\'absence est longue, désactivez le compte de l\'agent (Agents → [Agent] → Désactiver) pour éviter toute utilisation non autorisée de ses identifiants. (3) Les transactions enregistrées pendant l\'absence par substitution seront attribuées à l\'agent qui les a réellement saisies.',
        motsCles: ['absence agent', 'congé', 'désactiver', 'remplacement', 'temporaire'],
      },
      aa9: {
        question: 'Comment supprimer définitivement une agence ?',
        reponse: 'Pour supprimer une agence (irréversible) : Agences → [Nom de l\'agence] → Actions → Supprimer l\'agence. ATTENTION : la suppression est impossible si des agents actifs sont rattachés à cette agence ou si des transactions récentes y sont associées. Avant de supprimer : transférez les agents vers une autre agence, et assurez-vous que toutes les transactions sont finalisées. Il est souvent préférable de désactiver plutôt que de supprimer.',
        motsCles: ['supprimer agence', 'fermeture', 'désactivation', 'irréversible'],
      },
      aa10: {
        question: 'Comment comparer les performances de deux agences ?',
        reponse: 'Pour comparer des agences : (1) Rapports & BI → Générez un rapport avec le groupe "Par agence". (2) Page Agences → vue liste avec les KPIs de chaque agence (volume, montant, commissions). (3) Exportez en XLSX et utilisez les graphiques Excel pour une comparaison visuelle. La future version de GESTMONEY inclura un module de comparaison graphique multi-agences intégré.',
        motsCles: ['comparer agences', 'performances', 'benchmark', 'rapport', 'kpi'],
      },
      fc1: {
        question: 'Qu\'est-ce que le float et pourquoi est-ce important ?',
        reponse: 'Le float est le solde que votre réseau détient chez chaque opérateur Mobile Money. Il représente votre capacité opérationnelle : un float élevé permet plus de retraits pour vos clients. Si le float est bas, les agents ne peuvent plus traiter les retraits (les fonds ne sont pas disponibles). GESTMONEY surveille les floats en temps réel et envoie des alertes automatiques. Une gestion proactive du float est essentielle pour la continuité des opérations.',
        motsCles: ['float', 'solde opérateur', 'capacité', 'liquidité', 'retrait'],
      },
      fc2: {
        question: 'Comment définir les seuils d\'alerte float ?',
        reponse: 'Dans Gestion Float → Paramètres Float → [Opérateur] : définissez le Seuil bas (premier niveau d\'alerte, ex: 500 000 FCFA) et le Seuil critique (alerte urgente + blocage optionnel des retraits, ex: 100 000 FCFA). Pour chaque seuil, choisissez les destinataires des alertes email. GESTMONEY envoie aussi des notifications push dans l\'application. Les seuils sont configurables par opérateur indépendamment.',
        motsCles: ['seuil float', 'alerte', 'configuration', 'bas', 'critique'],
      },
      fc3: {
        question: 'Comment enregistrer un approvisionnement (rechargement) de float ?',
        reponse: 'Un rechargement de float s\'enregistre dans Gestion Float → Approvisionner : sélectionnez l\'opérateur, saisissez le montant rechargé, la date de l\'opération et la référence du rechargement (numéro de virement ou référence opérateur). Cliquez sur "Valider". Le nouveau solde est mis à jour et l\'historique des rechargements est conservé pour la comptabilité. Les alertes de bas float cessent dès que le seuil est dépassé.',
        motsCles: ['rechargement float', 'approvisionnement', 'recharger', 'solde', 'opérateur'],
      },
      fc4: {
        question: 'Comment voir l\'historique du float par opérateur ?',
        reponse: 'L\'historique complet du float est accessible dans Gestion Float → Historique. Filtrez par opérateur et période pour visualiser : l\'évolution du solde, les rechargements effectués, les alertes déclenchées. Un graphique d\'évolution du float est disponible sur la page de chaque opérateur. Exportez l\'historique en CSV pour votre comptabilité de trésorerie.',
        motsCles: ['historique float', 'évolution', 'graphique', 'opérateur', 'trésorerie'],
      },
      fc5: {
        question: 'Comment les commissions sont-elles calculées ?',
        reponse: 'Les commissions sont calculées automatiquement selon le barème configuré : taux × montant de la transaction (si mode pourcentage) ou montant fixe par transaction. Si des paliers sont définis, GESTMONEY applique le taux correspondant à la tranche du montant. Le calcul se fait à la validation de chaque transaction. Les commissions sont agrégées par agent, agence et opérateur dans des rapports dédiés.',
        motsCles: ['calcul commission', 'taux', 'palier', 'automatique', 'pourcentage'],
      },
      fc6: {
        question: 'Quand les commissions sont-elles versées aux agents ?',
        reponse: 'GESTMONEY calcule et affiche les commissions en temps réel, mais leur versement réel aux agents (en espèces, virement ou Mobile Money) est géré manuellement par votre organisation selon votre politique interne (hebdomadaire, mensuelle, etc.). GESTMONEY vous donne le rapport des commissions dues à chaque agent pour la période, que vous pouvez exporter en XLSX pour faciliter le traitement.',
        motsCles: ['versement commission', 'paiement agent', 'période', 'mensuel', 'traitement'],
      },
      fc7: {
        question: 'Le float peut-il être négatif dans GESTMONEY ?',
        reponse: 'GESTMONEY empêche le float d\'aller en négatif si le blocage automatique est activé (seuil critique → blocage des retraits). Si le blocage automatique n\'est pas activé, théoriquement le float peut sembler négatif dans GESTMONEY si des transactions ont été enregistrées sans vérification du solde réel. Dans ce cas, un rechargement d\'urgence est nécessaire et une réconciliation avec l\'opérateur doit être effectuée.',
        motsCles: ['float négatif', 'dépassement', 'blocage', 'réconciliation', 'urgence'],
      },
      fc8: {
        question: 'Comment faire la réconciliation entre le float GESTMONEY et le solde réel opérateur ?',
        reponse: 'Pour réconcilier : (1) Obtenez le relevé de solde réel de l\'opérateur (via son application ou portail agent). (2) Comparez avec le solde affiché dans GESTMONEY pour cet opérateur. (3) Si écart : vérifiez les transactions des dernières 24h et identifiez les transactions non encore synchronisées ou les rechargements non encore enregistrés. (4) Corrigez le solde manuellement dans Gestion Float → Ajustement de solde avec justification.',
        motsCles: ['réconciliation', 'solde réel', 'écart', 'ajustement', 'rapprochement'],
      },
      fc9: {
        question: 'Les commissions changent-elles si le barème est modifié en cours de mois ?',
        reponse: 'Non, les commissions déjà calculées sur des transactions passées ne sont pas recalculées rétroactivement. Un changement de barème s\'applique uniquement aux nouvelles transactions créées après la date de modification. Pour éviter toute confusion, il est recommandé de modifier les barèmes en début de mois. GESTMONEY journalise toutes les modifications de barème avec la date et l\'auteur du changement.',
        motsCles: ['modification barème', 'rétroactif', 'commissions', 'date', 'calcul'],
      },
      fc10: {
        question: 'Comment voir les commissions dues à un agent spécifique ?',
        reponse: 'Depuis Commissions → Par agent → [Nom de l\'agent] : consultez le détail des commissions par période, par opérateur et par type de transaction. Vous voyez le montant total dû, le détail transaction par transaction, et la comparaison avec le mois précédent. Ce rapport est exportable en PDF (format fiche de commission prête à être remise à l\'agent) ou en XLSX pour le traitement comptable.',
        motsCles: ['commissions agent', 'détail', 'fiche commission', 'export', 'montant dû'],
      },
      re1: {
        question: 'Comment exporter les transactions en Excel ?',
        reponse: 'Depuis la page Transactions : (1) Appliquez vos filtres (période, opérateur, agence, statut). (2) Cliquez sur le bouton "Exporter XLSX" en haut à droite. (3) Le fichier Excel est téléchargé automatiquement avec en-tête GESTMONEY, mise en forme et formules de totaux. Vous pouvez aussi exporter au format CSV (compatible Excel) pour un fichier plus léger. Les exports depuis Rapports & BI incluent des graphiques intégrés.',
        motsCles: ['export excel', 'xlsx', 'csv', 'transactions', 'télécharger'],
      },
      re2: {
        question: 'Comment générer un rapport PDF mensuel ?',
        reponse: 'Depuis Rapports & BI : (1) Sélectionnez la période (mois en cours ou mois précédent). (2) Cliquez sur "Générer rapport". (3) GESTMONEY calcule les KPIs et génère le rapport (quelques secondes). (4) Dans l\'historique des rapports, cliquez sur le rapport généré → "Exporter PDF". Le PDF inclut : logo de votre société, KPIs, graphiques, classement agents, répartition par opérateur.',
        motsCles: ['rapport pdf', 'mensuel', 'générer', 'kpi', 'graphique'],
      },
      re3: {
        question: 'Peut-on programmer l\'envoi automatique de rapports par email ?',
        reponse: 'Oui. GESTMONEY génère automatiquement un rapport de synthèse le 1er de chaque mois et l\'envoie par email. Pour configurer : Paramètres → Notifications → Rapports. Ajoutez les adresses email des destinataires, choisissez le format (PDF, XLSX ou les deux) et l\'heure d\'envoi souhaitée. Les rapports automatiques incluent : CA, variations, top agents, lien vers le rapport complet.',
        motsCles: ['rapport automatique', 'email', 'planification', 'mensuel', 'programmé'],
      },
      re4: {
        question: 'Quels formats d\'export sont disponibles dans GESTMONEY ?',
        reponse: 'GESTMONEY supporte 3 formats d\'export : (1) CSV — format texte universel, compatible avec tous les tableurs, idéal pour l\'import dans d\'autres logiciels. (2) XLSX — format Excel natif avec mise en forme, en-tête GESTMONEY et formules de totaux automatiques. (3) PDF — document formaté avec logo, graphiques et présentation professionnelle, idéal pour archivage et partage. Chaque export respecte les filtres actifs au moment de l\'export.',
        motsCles: ['format export', 'csv', 'xlsx', 'pdf', 'différence'],
      },
      re5: {
        question: 'Comment comparer les performances de deux périodes ?',
        reponse: 'Dans Rapports & BI, sélectionnez "Comparaison de périodes" (disponible en haut de page). Choisissez la période principale (ex: juillet 2026) et la période de référence (ex: juin 2026). GESTMONEY affiche les variations en valeur et en pourcentage pour chaque KPI : CA, transactions, nouveaux clients, commissions. Les variations positives sont en vert, négatives en rouge.',
        motsCles: ['comparaison', 'périodes', 'variation', 'kpi', 'évolution'],
      },
      re6: {
        question: 'Que signifient les KPIs du tableau de bord ?',
        reponse: 'Les KPIs principaux : (1) CA Total — Somme des montants de toutes les transactions validées de la période. (2) Transactions — Nombre total d\'opérations. (3) Ticket moyen — CA Total ÷ Nombre de transactions. (4) Taux de succès — % de transactions validées vs total (validées + rejetées + annulées). (5) Nouveaux clients — Clients dont c\'est la première transaction sur la période. (6) Commissions — Total des commissions générées.',
        motsCles: ['kpi', 'tableau de bord', 'ca', 'ticket moyen', 'taux succès', 'signification'],
      },
      re7: {
        question: 'Comment exporter toutes les données GESTMONEY (sauvegarde complète) ?',
        reponse: 'Pour exporter l\'intégralité de vos données : Paramètres → Données → Exporter mes données. GESTMONEY prépare une archive ZIP contenant : toutes vos transactions (CSV), la liste des agents (CSV), les rapports générés (PDF), les journaux d\'audit (CSV). La préparation peut prendre quelques minutes. Vous recevez un email avec le lien de téléchargement valable 24h. Cette fonctionnalité est disponible uniquement pour les ADMIN.',
        motsCles: ['export complet', 'sauvegarde', 'toutes données', 'archive', 'zip'],
      },
      re8: {
        question: 'Comment générer un rapport par opérateur spécifique ?',
        reponse: 'Dans Rapports & BI : (1) Sélectionnez la période. (2) Dans le filtre "Grouper par", choisissez "Opérateur". (3) Cliquez sur "Générer rapport". Le rapport affiche les KPIs pour chaque opérateur séparément : CA, transactions, commissions, float moyen. Vous pouvez aussi filtrer sur un seul opérateur pour un rapport mono-opérateur. Exportez en XLSX pour une analyse approfondie.',
        motsCles: ['rapport opérateur', 'par opérateur', 'filtrer', 'orange', 'wave', 'mtn'],
      },
      re9: {
        question: 'Les rapports incluent-ils les transactions annulées et rejetées ?',
        reponse: 'Par défaut, les rapports de performance (CA, commissions) n\'incluent que les transactions à statut "Validée". Les transactions annulées et rejetées sont exclues du CA mais sont incluses dans les statistiques de "Taux de succès" et "Taux de rejet". Pour un rapport incluant tous les statuts (utile pour l\'audit), utilisez le filtre "Statut → Tous" dans la page Transactions et exportez.',
        motsCles: ['annulées', 'rejetées', 'rapport', 'inclure', 'statut', 'taux rejet'],
      },
      re10: {
        question: 'Comment partager un rapport avec un partenaire externe ?',
        reponse: 'Pour partager un rapport : (1) Générez le rapport dans Rapports & BI. (2) Exportez-le en PDF. (3) Partagez le fichier PDF par email ou via votre système de partage habituel. Si le partenaire a besoin d\'un accès récurrent, envisagez de créer un compte AUDITOR pour lui (accès lecture seule). Évitez de partager vos identifiants personnels. GESTMONEY ne dispose pas encore de liens de partage public de rapport.',
        motsCles: ['partager rapport', 'externe', 'pdf', 'partenaire', 'auditor'],
      },
      al1: {
        question: 'Quels sont les différents plans disponibles ?',
        reponse: 'GESTMONEY propose 3 plans : (1) Starter — jusqu\'à 5 agents, 1000 transactions/mois, SARA IA basique, support email 8h. Idéal pour les petits réseaux débutants. (2) Business — jusqu\'à 25 agents, 10 000 transactions/mois, SARA IA avancée, exports illimités, support email 4h. Pour les réseaux en croissance. (3) Enterprise — illimité, SARA IA complète, API access, support prioritaire 2h, SLA 99,9%. Pour les grandes structures. Contactez sales@ibigsoft.com pour un devis personnalisé.',
        motsCles: ['plans', 'starter', 'business', 'enterprise', 'abonnement', 'tarif'],
      },
      al2: {
        question: 'Comment upgrader vers un plan supérieur ?',
        reponse: 'Pour upgrader votre plan : Paramètres → Abonnement → Changer de plan. Sélectionnez le plan cible et cliquez sur "Upgrader". L\'upgrade est effectif immédiatement. La facturation au prorata est calculée automatiquement pour la période restante du mois en cours. Vous recevrez une facture de l\'ajustement par email. En cas de questions sur la facturation, contactez billing@ibigsoft.com.',
        motsCles: ['upgrader', 'changer plan', 'upgrade', 'montée en gamme', 'facturation'],
      },
      al3: {
        question: 'Comment télécharger mes factures GESTMONEY ?',
        reponse: 'Toutes vos factures sont disponibles dans Paramètres → Abonnement → Historique de facturation. Cliquez sur une facture pour la télécharger en PDF. Les factures incluent : description de la prestation, période, montant HT et TTC, et les informations légales de IBIG Soft. Pour des factures antérieures ou en cas de litige, contactez billing@ibigsoft.com.',
        motsCles: ['facture', 'télécharger', 'historique', 'facturation', 'comptabilité'],
      },
      al4: {
        question: 'Que se passe-t-il si je dépasse les limites de mon plan ?',
        reponse: 'Si vous atteignez la limite d\'agents ou de transactions de votre plan, GESTMONEY vous envoie des alertes progressives (à 80%, 90% et 100% de la limite). Une fois la limite atteinte : les nouveaux agents ne peuvent plus être créés (mais les existants continuent de fonctionner) et les transactions au-delà du quota mensuel peuvent être bloquées selon la configuration. Il est recommandé d\'upgrader avant d\'atteindre les limites.',
        motsCles: ['dépassement limite', 'quota', 'blocage', 'upgrade', 'alertes'],
      },
      al5: {
        question: 'Comment résilier mon abonnement GESTMONEY ?',
        reponse: 'Pour résilier : Paramètres → Abonnement → Résilier l\'abonnement. La résiliation prend effet à la fin de la période de facturation en cours (pas de remboursement prorata). Avant la résiliation, exportez toutes vos données (Paramètres → Données → Exporter) car l\'accès sera coupé à la date de fin. Après résiliation, vos données sont conservées 90 jours puis supprimées définitivement. Contactez support@ibigsoft.com pour toute question.',
        motsCles: ['résiliation', 'annuler abonnement', 'fin de contrat', 'données', 'export'],
      },
      st1: {
        question: 'Comment ouvrir un ticket de support ?',
        reponse: 'Depuis Support → Nouveau ticket : (1) Renseignez le titre du problème. (2) Sélectionnez la catégorie (Technique, Transaction, Float, Agent, Facturation, Autre). (3) Choisissez la priorité (Basse/Normale/Haute/Urgente). (4) Décrivez le problème en détail avec les étapes pour le reproduire, les messages d\'erreur et les références concernées. (5) Joignez une capture d\'écran si utile. (6) Cliquez sur "Envoyer". Un numéro de ticket vous est attribué et vous pouvez suivre l\'avancement.',
        motsCles: ['ticket', 'support', 'ouvrir', 'problème', 'assistance'],
      },
      st2: {
        question: 'Quels sont les délais de réponse du support ?',
        reponse: 'Les délais de réponse sont garantis selon la priorité et le plan : Priorité Urgente — 2h (tous les plans) / Priorité Haute — 4h ouvrées / Priorité Normale — 8h ouvrées / Priorité Basse — 24h ouvrées. Les heures ouvrées sont du lundi au vendredi, 8h-18h UTC+0. Pour les plans Enterprise, le support prioritaire est disponible 7j/7. Les tickets du weekend sont traités en priorité le lundi matin.',
        motsCles: ['délai réponse', 'sla', 'support', 'priorité', 'heures ouvrées'],
      },
      st3: {
        question: 'Comment suivre l\'avancement d\'un ticket de support ?',
        reponse: 'Depuis Support → [Numéro du ticket] : consultez l\'historique des échanges, le statut actuel (Ouvert, En cours, En attente, Résolu, Fermé) et les réponses du support. Vous êtes notifié par email à chaque réponse. Vous pouvez ajouter des informations complémentaires ou des pièces jointes directement dans le fil de conversation du ticket. Les tickets résolus restent consultables pendant 1 an.',
        motsCles: ['suivi ticket', 'statut', 'avancement', 'réponse support', 'historique'],
      },
      st4: {
        question: 'Puis-je escalader un ticket en cas d\'urgence critique ?',
        reponse: 'Pour escalader un ticket : (1) Changez la priorité à "Urgente" dans le ticket existant. (2) Envoyez un email à support@ibigsoft.com avec le numéro du ticket et la mention "ESCALADE URGENTE" dans l\'objet. (3) Sur le plan Enterprise, utilisez le numéro WhatsApp d\'urgence indiqué dans Paramètres → Support → Contact d\'urgence. Les escalades sont traitées en priorité absolue.',
        motsCles: ['escalade', 'urgence', 'priorité', 'critique', 'support'],
      },
      st5: {
        question: 'Que faire si le support n\'a pas résolu mon problème ?',
        reponse: 'Si après plusieurs échanges le problème n\'est pas résolu : (1) Demandez dans le ticket à être escaladé vers l\'équipe technique senior. (2) Mentionnez explicitement le délai écoulé et l\'impact opérationnel. (3) Contactez directement votre Account Manager IBIG Soft si vous êtes sur un plan Business ou Enterprise. (4) Pour les litiges, écrivez à ceo@ibigsoft.com en copie de votre ticket. GESTMONEY s\'engage à résoudre tous les tickets dans les délais SLA.',
        motsCles: ['non résolu', 'escalade senior', 'litige', 'account manager', 'sla'],
      },
      si1: {
        question: 'Qu\'est-ce que SARA et comment y accéder ?',
        reponse: 'SARA (Smart Assistant for Real-time Assistance) est l\'assistant IA intégré à GESTMONEY. Cliquez sur le bouton vert avec l\'icône robot en bas à droite de n\'importe quelle page du tableau de bord pour ouvrir SARA. Elle répond en temps réel à vos questions sur les fonctionnalités, procédures et dépannage. SARA est disponible 24h/24, 7j/7 et répond en français et en anglais.',
        motsCles: ['sara', 'assistant ia', 'chatbot', 'accéder', 'bouton'],
      },
      si2: {
        question: 'Que peut (et ne peut pas) faire SARA ?',
        reponse: 'SARA peut : répondre aux questions sur les fonctionnalités de GESTMONEY, vous guider étape par étape dans les procédures, expliquer les statuts et erreurs, vous orienter vers le bon module, et proposer des solutions de dépannage. SARA ne peut pas : effectuer des actions à votre place (créer une transaction, modifier un paramètre), accéder à vos données spécifiques (montants de votre float, noms de vos agents), ni remplacer le support humain pour les problèmes complexes.',
        motsCles: ['sara', 'capacités', 'limites', 'que peut faire', 'fonctionnalités ia'],
      },
      si3: {
        question: 'SARA répond-elle en anglais ?',
        reponse: 'Oui. SARA détecte automatiquement la langue de votre question et répond dans la même langue. Posez votre question en français → SARA répond en français. Posez votre question en English → SARA answers in English. Vous pouvez aussi mélanger les langues dans la même conversation. SARA est optimisée pour le français (langue principale) et l\'anglais (langue secondaire). D\'autres langues seront ajoutées dans les prochaines versions.',
        motsCles: ['sara', 'anglais', 'langue', 'multilingue', 'détection langue'],
      },
      si4: {
        question: 'Les conversations avec SARA sont-elles confidentielles ?',
        reponse: 'Oui. Vos conversations avec SARA restent privées. Les échanges sont associés à votre compte utilisateur et ne sont pas accessibles par d\'autres utilisateurs ni par les agents IBIG Soft (sauf dans le cadre d\'un support technique explicitement autorisé par vous). Les conversations ne sont pas utilisées pour entraîner des modèles d\'IA tiers sans votre consentement. L\'historique SARA est conservé pour la durée de votre session uniquement.',
        motsCles: ['sara', 'confidentialité', 'vie privée', 'historique', 'données ia'],
      },
      si5: {
        question: 'SARA peut-elle signaler automatiquement un problème au support ?',
        reponse: 'Pas encore directement, mais SARA peut vous guider pour ouvrir un ticket de support en 2 clics. Lors d\'une conversation SARA, tapez "signaler un problème" ou "ouvrir un ticket" et SARA vous propose de pré-remplir un ticket de support avec le contexte de votre question. Cette fonctionnalité de création automatique de ticket via SARA est en cours de développement pour la version 2.2.',
        motsCles: ['sara', 'signaler problème', 'ticket automatique', 'support', 'ia'],
      },
      sb1: {
        question: 'À quelle fréquence les données sont-elles sauvegardées ?',
        reponse: 'GESTMONEY effectue des sauvegardes automatiques à 3 niveaux : (1) En temps réel — toutes les transactions sont sauvegardées instantanément dans une base de données répliquée. (2) Snapshot horaire — sauvegarde complète de la base toutes les heures, conservée 7 jours. (3) Sauvegarde quotidienne — conservée 30 jours. (4) Sauvegarde hebdomadaire — conservée 6 mois. En cas d\'incident, la perte de données maximale est de 1 heure.',
        motsCles: ['sauvegarde', 'backup', 'fréquence', 'rétention', 'automatique'],
      },
      sb2: {
        question: 'Comment restaurer des données supprimées accidentellement ?',
        reponse: 'En cas de suppression accidentelle de données : (1) Contactez immédiatement le support technique (support@ibigsoft.com ou ticket prioritaire URGENTE). (2) Précisez les données concernées (type, période, identifiants). (3) IBIG Soft effectue la restauration depuis la dernière sauvegarde disponible (maximum 1h de perte). (4) La restauration est effectuée dans un environnement de test avant application en production. Délai estimé : 2 à 4h selon la complexité.',
        motsCles: ['restauration', 'données supprimées', 'récupération', 'backup', 'urgence'],
      },
      sb3: {
        question: 'Pendant combien de temps mes données sont-elles conservées ?',
        reponse: 'Données en compte actif : conservées indéfiniment tant que votre abonnement est actif. Données après résiliation : conservées 90 jours après la fin de l\'abonnement, puis supprimées définitivement. Journaux d\'audit : conservés 5 ans conformément aux exigences OHADA. Il est fortement recommandé d\'exporter toutes vos données avant de résilier votre abonnement. L\'export complet est accessible dans Paramètres → Données → Exporter.',
        motsCles: ['rétention données', 'durée conservation', 'résiliation', 'ohada', 'légal'],
      },
      sb4: {
        question: 'Comment exporter toutes mes données GESTMONEY ?',
        reponse: 'Pour un export complet : Paramètres → Données → Exporter mes données → "Tout exporter". GESTMONEY prépare une archive ZIP avec : transactions (CSV), agents (CSV), agences (CSV), rapports (PDF), commissions (CSV), journaux d\'audit (CSV). La préparation prend 5 à 30 minutes selon le volume. Vous recevez un email avec le lien de téléchargement valable 24h. Cette opération est réservée aux ADMIN.',
        motsCles: ['export complet', 'toutes données', 'archive', 'zip', 'gdpr'],
      },
      sb5: {
        question: 'GESTMONEY est-il conforme au RGPD et aux réglementations OHADA ?',
        reponse: 'Oui. GESTMONEY est conçu pour la conformité réglementaire : (1) RGPD — droit à l\'effacement, export des données personnelles, registre des traitements. (2) OHADA — conservation des journaux comptables 5 ans, traçabilité des transactions. (3) UMOA/BCEAO — conformité avec les directives de monnaie électronique de l\'UEMOA. (4) ISO 27001 — sécurité de l\'information (infrastructure hébergeur). Pour un rapport de conformité, contactez compliance@ibigsoft.com.',
        motsCles: ['rgpd', 'ohada', 'conformité', 'bceao', 'réglementaire', 'lgpd'],
      },
    },
  },

  // ── Formats date locale ───────────────────────────────────────────────
  dateLocale: 'fr-FR',
  currencyLocale: 'fr-FR',
} as const;

type WidenLiterals<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: WidenLiterals<T[K]> }
    : T;

export type Translations = WidenLiterals<typeof fr>;

// ── English dictionary ────────────────────────────────────────────────────
import type { Translations } from './fr';

export const en: Translations = {
  lang: 'en',

  nav: {
    principal: 'Main',
    reseau: 'Network',
    finance: 'Finance & Analytics',
    compte: 'Account',
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    float: 'Float Management',
    caisse: 'Cash Register',
    agences: 'Branches & POS',
    agents: 'Agents',
    clients: 'Clients',
    commissions: 'Commissions',
    performances: 'Performance',
    rapports: 'Reports & BI',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'My Profile',
    support: 'Support',
    aide: 'Help Center',
    superadmin: 'SuperAdmin Console',
    stock: 'Stock',
    comptabilite: 'Accounting',
    administration: 'Administration',
    iaFraude: 'Audit & Alerts',
    abonnement: 'Subscription',
    superAdminSection: 'Super Admin',
  },

  sidebar: {
    closeMenu: 'Close menu',
    expand: 'Expand',
    collapse: 'Collapse',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    mainNav: 'Main navigation',
    menu: 'Navigation menu',
  },

  topbar: {
    search: 'Search…',
    searchHint: 'Quick navigation',
    darkMode: 'Switch to dark mode',
    lightMode: 'Switch to light mode',
    myProfile: 'My Profile',
    settings: 'Settings',
    logout: 'Sign out',
    langSwitch: 'Français',
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    loading: 'Loading…',
    sending: 'Sending…',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    available: 'Available',
    inProgress: 'In progress',
    error: 'Error',
    success: 'Success',
    required: 'Required',
    optional: 'Optional',
    noData: 'No data',
    seeAll: 'See all',
    export: 'Export',
    generate: 'Generate',
    download: 'Download',
    print: 'Print',
    refresh: 'Refresh',
    add: 'Add',
    create: 'Create',
    send: 'Send',
    validate: 'Validate',
    reject: 'Reject',
    activate: 'Activate',
    deactivate: 'Deactivate',
    suspend: 'Suspend',
    renew: 'Renew',
    preview: 'Preview',
    test: 'Test',
    today: 'Today',
    total: 'Total',
    period: 'Period',
    home: 'Home',
    reset: 'Reset',
    clear: 'Clear',
    view: 'View',
    details: 'Details',
    actions: 'Actions',
    date: 'Date',
    time: 'Time',
    type: 'Type',
    statut: 'Status',
    amount: 'Amount',
    description: 'Description',
    comment: 'Comment',
    page: 'Page',
    results: 'result(s)',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email',
    city: 'City',
    password: 'Password',
    creating: 'Creating…',
    refreshing: 'Refreshing…',
    checking: 'Checking…',
    invalidAmount: 'Invalid amount.',
    createError: 'Creation failed. Please try again.',
    loadError: 'Failed to load.',
    online: 'Online',
    offline: 'Offline',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    registration: 'Registered',
    commission: 'Commission',
    agency: 'Branch',
    operator: 'Operator',
    client: 'Client',
    agent: 'Agent',
    volume: 'Volume',
    reference: 'Reference',
    currency: 'Currency',
  },

  dashboard: {
    title: 'Dashboard',
    subtitle: 'Real-time overview of your Mobile Money activity',
    revenue: 'Revenue',
    transactions: 'Transactions',
    newClients: 'New clients',
    avgTicket: 'Avg. ticket',
    topAgent: 'Top agent',
    objective: 'Monthly target',
    progression: 'Progress',
    float: 'Available float',
    alerts: 'Alerts',
    pending: 'Pending',
    aiRecommendations: 'AI Recommendations',
    lastUpdated: 'Updated',
    noAgent: '—',
    performanceBy: 'Performance by',
    operator: 'Operator',

    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    you: 'there',
    updatedAtLabel: 'updated at',
    demoData: 'demo data',
    newTransaction: 'New transaction',
    reportsButton: 'Reports',
    recentActivity: 'Recent activity',
    myLastTransactions: 'My latest transactions',
    noTransactionPeriod: 'No transactions for this period.',
    sparklineTitle: 'Transactions — last 7 days',
    sparklineSub: 'Transactions per day',
    actNow: 'Take action',
    seeCommissions: 'View commissions',
    pointsToHandle: 'Items to address',
    teamPerformance: 'My team performance',
    vsYesterday: 'vs yesterday',
    variationTooltip: 'Change compared with the previous day',

    cards: {
      transactions: 'Transactions',
      volumeDay: "Today's volume",
      agents: 'Agents',
      agences: 'Branches',
      commissions: 'Commissions',
      floatOperateurs: 'Operator float',
      txAgence: 'Branch transactions',
      volumeAgence: 'Branch volume',
      monEquipe: 'My team',
      mesTransactions: 'My transactions',
      monFloat: 'My float',
      maCommission: 'My commission',
      operationsAuditees: 'Audited operations',
      txDuJour: "Today's transactions",
    },

    labels: {
      txToday: 'transactions today',
      processed: 'processed',
      avgPerTx: 'Average per transaction:',
      xofProcessedToday: 'XOF processed today',
      xofProcessed: 'XOF processed',
      activeAgents: 'active agents',
      noInactiveAgent: 'No inactive agents',
      activeAgencies: 'active branches',
      agentsSpread: 'active agents across branches',
      commissionsPending: 'commission(s) awaiting approval',
      operatorsBelowThreshold: 'operator(s) below threshold',
      floatDetail: 'Balance breakdown by operator on the Float page',
      xofMyAgency: 'XOF at my branch',
      supervised: 'supervised',
      supervisedAgents: 'supervised agents',
      xofAvailable: 'XOF available',
      xofThisMonth: 'XOF this month',
      auditedOps: 'audited operations',
      actifs: 'active',
      actives: 'active',
      toValidate: 'to approve',
      upToDate: 'Up to date',
      levelsOk: 'Levels OK',
      floatLow: 'low float',
      lowThreshold: 'Low threshold',
      levelOk: 'Healthy level',
      lowThresholdMsg: 'Low threshold — contact your manager',
      inactiveAgents: 'inactive agent(s)',
      commissionsToValidate: 'commission(s) to approve',
    },

    actionsLabels: {
      depot: '+ Deposit',
      retrait: '+ Withdrawal',
      seeReports: 'View reports',
      seeAgents: 'View agents',
      createAgent: '+ New agent',
      seeAgencies: 'View branches',
      newAgency: '+ New branch',
      validate: 'Approve',
      history: 'History',
      refill: 'Top up',
      seeFloat: 'View float',
      newTransaction: '+ Transaction',
      reports: 'Reports',
      requestRefill: 'Request a top-up',
      detail: 'Details',
      export: 'Export',
    },

    floatAlert: {
      title: 'Float alert',
      before: 'The float at',
      strong: 'your branch',
      after: 'is below the configured threshold.',
    },

    auditTable: {
      title: 'Recent audit log',
      action: 'Action',
      user: 'User',
      resource: 'Resource',
      ip: 'IP',
    },

    txTable: {
      hour: 'Time',
      type: 'Type',
      agent: 'Agent',
      operator: 'Operator',
      client: 'Client',
      amount: 'Amount',
      status: 'Status',
    },

    relative: {
      now: 'Just now',
      agoPrefix: '',
      agoSuffix: ' ago',
      min: 'min',
      hour: 'h',
    },

    txTypes: {
      depot: 'Deposit',
      retrait: 'Withdrawal',
      transfert: 'Transfer',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      paiement: 'Payment',
    },

    txStatuts: {
      success: 'Successful',
      pending: 'Pending',
      failed: 'Failed',
    },
  },

  transactions: {
    title: 'Transactions',
    subtitle: 'Full history of all operations',
    new: 'New transaction',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer',
    amount: 'Amount',
    operator: 'Operator',
    agent: 'Agent',
    client: 'Client',
    reference: 'Reference',
    status: {
      validated: 'Validated',
      pending: 'Pending',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    },
    exportCsv: 'Export CSV',
    exportPdf: 'Export PDF',
    exportXlsx: 'Export XLSX',

    types: {
      depot: 'Deposit',
      retrait: 'Withdrawal',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      transfert: 'Transfer',
      paiement: 'Payment',
    },
    statutLabels: {
      success: 'Successful',
      pending: 'Pending',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },

    columns: {
      date: 'Date / Time',
      type: 'Type',
      agent: 'Agent',
      agence: 'Branch',
      operateur: 'Operator',
      client: 'Client',
      montant: 'Amount',
      commission: 'Commission',
      statut: 'Status',
    },

    stats: {
      totalLabel: 'Total transactions',
      displayedOnPage: 'shown on this page',
      pageVolume: 'Page volume',
      succeeded: 'Successful',
      pending: 'Pending',
      failedCancelled: 'Failed / cancelled',
      ofPage: 'of the page',
    },

    filters: {
      dateStart: 'From',
      dateEnd: 'To',
      allTypes: 'All types',
      search: 'Search',
      searchPlaceholder: 'Reference, agent, client…',
    },

    toolbar: {
      showing: 'Showing',
      onTotal: 'of',
      selectedSuffix: 'selected',
      deselect: 'Clear selection',
      sortHint: 'Click a column header to sort',
      selectAll: 'Select all',
      selectRow: 'Select',
    },

    table: {
      loading: 'Loading transactions…',
      error: 'Failed to load transactions.',
      empty: 'No transactions found',
      viewDetail: 'View details',
      validateTx: 'Approve transaction',
    },

    pagination: {
      prevPage: 'Previous page',
      nextPage: 'Next page',
      onPage: 'of',
    },

    detail: {
      title: 'Transaction details',
      fees: 'Fees',
      dateTime: 'Date & time',
      agentCommission: 'Agent commission:',
    },

    form: {
      newTitle: 'New transaction —',
      operatorRequired: 'Operator *',
      amountRequired: 'Amount (FCFA) *',
      clientPhone: 'Client phone',
      clientName: 'Client name',
      clientNamePlaceholder: 'Full name',
      success: 'Transaction recorded successfully.',
    },
  },

  float: {
    title: 'Float Management',
    subtitle: 'Balances and top-ups by operator',
    balance: 'Balance',
    threshold: 'Alert threshold',
    criticalThreshold: 'Critical threshold',
    refill: 'Top up',
    history: 'Movement history',
    lowAlert: 'Low float',
    criticalAlert: 'Critical float',

    pageTitle: 'Operator float',
    liveLevels: 'Real-time levels',
    updatedOn: 'Updated on',
    newRefill: '+ Top-up request',

    badges: {
      ok: 'OK',
      faible: 'Low',
      critique: 'Critical',
    },
    demandeStatuts: {
      en_attente: 'Pending',
      approuve: 'Approved',
      complete: 'Completed',
      rejete: 'Rejected',
    },

    banner: {
      criticalLevel: 'Critical level',
      currentBalance: 'Current balance:',
      minThreshold: 'Minimum threshold:',
      riskMessage: 'Transactions may start being rejected.',
      ignore: 'Dismiss',
    },

    card: {
      minThreshold: 'Min. threshold:',
      insufficient: 'Insufficient!',
      watch: 'Monitor',
      marginOk: 'Margin: OK',
      refill: '+ Top up',
      urgentRefill: '⚠ Top up urgently',
    },

    movements: {
      title: "📋 Today's movements",
      sub: 'History of float inflows and outflows',
      colHour: 'Time',
      colOperator: 'Operator',
      colType: 'Type',
      colDescription: 'Description',
      colAmount: 'Amount',
      colAgent: 'Agent',
      colBalanceAfter: 'Balance after',
      empty: 'No movements',
      in: 'Inflow',
      out: 'Outflow',
    },

    requests: {
      title: '🔄 Pending requests',
      sub: 'Top-ups awaiting approval',
      pendingSuffix: 'pending',
      empty: 'No pending requests',
    },

    thresholds: {
      title: '🔔 Alert thresholds',
      sub: 'Minimum amounts that trigger an alert',
      ariaPrefix: 'Alert threshold',
    },

    modal: {
      title: 'Top-up request',
      currentBalance: 'Current balance',
      alertThreshold: 'Alert threshold',
      operator: 'Operator',
      amountLabel: 'Top-up amount (XOF)',
      amountPlaceholder: 'e.g. 500000',
      commentPlaceholder: 'Additional information…',
      operatorRequired: 'Operator is required.',
      submitError: 'Submission failed.',
      success: 'Request submitted successfully.',
      submit: 'Submit request',
    },
  },

  agents: {
    title: 'Agents',
    subtitle: 'Manage your field network',
    add: 'Add an agent',
    name: 'Name',
    phone: 'Phone',
    agency: 'Branch',
    role: 'Role',
    status: 'Status',
    commissions: 'Commissions',
    performance: 'Performance',
    invite: 'Invite',
    resetPassword: 'Reset password',
    active: 'Active',
    inactive: 'Inactive',

    pageTitle: 'Agent management',
    pageSubtitle: 'Performance, volumes and commissions per agent',
    createAgent: '+ New agent',

    stats: {
      activeAgents: 'Active agents',
      inactiveAgents: 'Inactive agents',
      onlineNow: 'Online now',
      topAgent: "Top agent (today's volume)",
      overAgencies: 'Across',
      agenciesSuffix: 'branch(es)',
      overAgents: 'Out of',
      agentsSuffix: 'agent(s)',
      txTodaySuffix: 'transaction(s) today',
      commissionsDue: 'Commissions due (all agents)',
    },

    filters: {
      allAgencies: 'All branches',
      allStatus: 'All statuses',
      actifs: 'Active',
      inactifs: 'Inactive',
      enLigne: 'Online',
      searchPlaceholder: 'Name, email, phone…',
    },

    table: {
      found: 'agent(s) found',
      sortHint: 'Click a column header to sort',
      colAgent: 'Agent',
      colTxToday: 'Tx today',
      colVolumeToday: 'Volume today',
      colPresence: 'Presence',
      empty: 'No agents found',
      suspend: '🚫 Suspend',
      activate: '✅ Activate',
      viewAction: '👁️ View',
      pagerSuffix: 'agent(s)',
    },

    modal: {
      title: '👤 New agent',
      firstNameRequired: 'First name *',
      firstNamePlaceholder: 'e.g. Aminata',
      lastNameRequired: 'Last name *',
      lastNamePlaceholder: 'e.g. Koné',
      emailRequired: 'Email *',
      emailPlaceholder: 'agent@example.com',
      phoneRequired: 'Phone *',
      agencyChoose: 'Select a branch',
      tempPassword: 'Temporary password *',
      tempPasswordPlaceholder: 'At least 8 characters',
      requiredFields: 'Please fill in all required fields.',
      createdPrefix: 'Agent',
      createdSuffix: 'created successfully.',
      submit: '✅ Create agent',
    },
  },

  clients: {
    title: 'Client management',
    loading: 'Loading clients…',
    registeredSuffix: 'registered client(s)',
    activeSuffix: 'active',
    kycPendingSuffix: 'KYC pending',
    newClient: 'New client',

    kycLabels: {
      verifie: 'Verified',
      en_attente: 'Pending',
      rejete: 'Rejected',
    },
    statutLabels: {
      actif: 'Active',
      inactif: 'Inactive',
      bloque: 'Blocked',
    },

    stats: {
      totalClients: 'Total clients',
      activeClients: 'Active clients',
      kycPending: 'KYC pending',
      totalVolume: 'Total volume',
      inactiveSuffix: 'inactive',
    },

    filters: {
      searchPlaceholder: 'Search by name, phone, email…',
      allStatus: 'All statuses',
      actifs: 'Active',
      inactifs: 'Inactive',
      bloques: 'Blocked',
      allKyc: 'All KYC statuses',
      verifies: 'Verified',
      enAttente: 'Pending',
      rejetes: 'Rejected',
    },

    table: {
      colClient: 'Client',
      colWallet: 'Wallet balance',
      colTransactions: 'Transactions',
      colTotalVolume: 'Total volume',
      colKyc: 'KYC',
      empty: 'No clients found',
      verifyKyc: 'Verify KYC',
      noClient: 'No clients',
      showing: 'Showing',
      onTotal: 'of',
      clientsSuffix: 'client(s)',
      prev: '← Previous',
      next: 'Next →',
    },

    modal: {
      title: 'New client',
      firstNameRequired: 'First name *',
      lastNameRequired: 'Last name *',
      phoneRequired: 'Phone *',
      emailPlaceholder: 'client@email.com',
      cityPlaceholder: 'Abidjan',
      requiredFields: 'First name, last name and phone are required.',
      savedPrefix: 'Client',
      savedSuffix: 'saved.',
      saveError: 'Could not save. Please try again.',
      submit: 'Save client',
    },
  },

  abonnement: {
    title: 'Subscription & payment',
    subtitle: 'Pay your subscription using the method of your choice',
    changeMethod: '← Change method',
    securityNotice: 'We will never ask you for your PIN or password.',

    chooseMethod: '💳 Choose a payment method',
    loadingMethods: 'Loading payment methods…',
    methodsUnavailable: 'Payment methods unavailable.',
    methodsUnavailableSub: 'The service did not respond. Use "Refresh" to try again.',
    noMethod: 'No payment method is currently offered. Please contact support.',
    testBadge: 'Test',
    currencies: 'Currencies:',
    choose: 'Select',
    sandboxNotice: 'This method is in test (sandbox) mode: no real payment is collected.',

    familles: {
      MOBILE_MONEY_MANUEL: 'Mobile Money (manual approval)',
      PASSERELLE: 'Online gateway',
      VIREMENT_NATIONAL: 'Domestic bank transfer',
      VIREMENT_INTERNATIONAL: 'International transfer',
      TRANSFERT_ARGENT: 'Money transfer',
      ESPECES_AGENCE: 'Cash at branch',
      CHEQUE: 'Cheque',
      CRYPTO: 'Cryptocurrency',
      VOUCHER: 'Prepaid code',
      PAIEMENT_LIVRAISON: 'Cash on delivery',
    },

    statuts: {
      EN_ATTENTE: 'Pending',
      EN_COURS: 'Under review',
      REUSSI: 'Successful',
      ECHOUE: 'Failed',
      REMBOURSE: 'Refunded',
      ANNULE: 'Cancelled',
      EXPIRE: 'Expired',
    },

    champs: {
      operateur: 'Operator',
      numeroACrediter: 'Number to credit',
      titulaire: 'Account holder',
      fournisseur: 'Provider',
      banque: 'Bank',
      iban: 'IBAN',
      rib: 'RIB',
      numeroCompte: 'Account number',
      bic: 'BIC / SWIFT code',
      adresseBanque: 'Bank address',
      pays: 'Country',
      enseigne: 'Provider',
      beneficiaire: 'Beneficiary',
      ville: 'City',
      pieceIdentite: 'ID document to present',
      adresse: 'Address',
      horaires: 'Opening hours',
      contact: 'Contact',
      chequeOrdre: 'Cheque payable to',
      adresseEnvoi: 'Mailing address',
      reseau: 'Network',
      actif: 'Asset',
      adresseWallet: 'Wallet address',
      memoTag: 'Memo / Tag',
      zones: 'Areas served',
      delai: 'Lead time',
    },

    instructions: {
      title: '📄 Payment instructions',
      empty: 'No details have been published for this payment method. Please contact support before making a payment.',
      collectPoints: 'Collection points',
    },

    voucher: {
      title: '🎟️ Prepaid code',
      label: 'Your code',
      hint: 'A valid code activates your subscription immediately. Each code can only be used once.',
      submit: 'Redeem this code',
      invalid: 'Invalid code: 8 characters minimum.',
      failed: 'This code could not be redeemed.',
      acceptedPrefix: 'Code accepted. Subscription activated',
      onPlan: 'on the',
      forDays: 'day(s).',
      forPrefix: 'for',
    },

    creation: {
      title: '🧮 Amount to pay',
      invalidAmount: 'Invalid amount: enter a strictly positive amount.',
      notConfigured: 'This payment method is not fully configured (provider could not be determined). Please contact support.',
      failed: 'Could not create the payment.',
      gatewayNotice: 'Once created, you will be redirected to the provider’s site to pay. Returning from that site does not activate your subscription: activation only happens after the provider’s confirmation has been verified by our servers.',
      manualNotice: 'Make the payment following the instructions above, then upload your receipt at the next step. Approval is performed by an administrator: your access is not immediate.',
      submit: 'Create payment',
    },

    preuve: {
      title: '✅ Payment recorded',
      referenceLabel: 'Reference to quote',
      gatewayNotice: 'Pay the provider quoting the reference above. We only activate your subscription once the provider’s confirmation has been verified by our servers — a browser redirect alone is not enough.',
      fileLabel: 'Receipt (image or PDF, 10 MB maximum)',
      referenceFieldLabel: 'Operation reference (MTCN, cheque no., transaction hash, receipt code…)',
      reviewNotice: 'Your receipt is reviewed by an administrator. Uploading it does not activate the subscription: access is not immediate.',
      missingFile: 'Attach an image or PDF of your receipt (10 MB maximum). The reference alone is not enough.',
      success: 'Receipt received. An administrator must review it: your access is not activated immediately.',
      failed: 'Could not upload the receipt.',
      submit: 'Send receipt',
      loadError: 'Could not load the receipts already sent.',
      loading: 'Loading receipts…',
      fallbackName: 'Receipt',
    },

    historique: {
      title: '🧾 My payments',
      colChannel: 'Channel',
      loading: 'Loading your payments…',
      error: 'Could not load your payments.',
      empty: 'No payments recorded',
    },
  },

  rapports: {
    title: 'Reports & Business Intelligence',
    subtitle: 'Performance analysis and key indicators',
    generate: 'Generate report',
    exportPdf: 'Export PDF',
    history: 'Generated reports',
    volumeByOperator: 'Volume by operator',
    topAgents: 'Top 5 agents this month',
    monthlyObjective: 'Progress towards monthly target',
    achieved: 'achieved',
    objective: 'Target',

    breadcrumb: 'Reports & BI',
    periodAria: 'Period',
    periods: {
      janvier_2024: 'January 2024',
      decembre_2023: 'December 2023',
      trimestre_4_2023: 'Q4 2023',
    },
    typesRapport: {
      journalier: 'Daily report',
      hebdomadaire: 'Weekly report',
      mensuel: 'Monthly report',
    },
    typeLabels: {
      journalier: 'Daily',
      hebdomadaire: 'Weekly',
      mensuel: 'Monthly',
    },
    stats: {
      available: 'Available reports',
      totalOnPeriod: 'in total for the period',
      generating: 'Being generated',
      processing: 'Processing in progress',
      noProcessing: 'No processing in progress',
      lastReport: 'Latest report',
    },
    kpi: {
      revenue: 'Revenue',
      transactions: 'Transactions',
      newClients: 'New clients',
      avgTicket: 'Average ticket',
      onPeriod: 'For the period',
    },
    generation: {
      bannerTitle: 'Generation started',
      queued: 'Report generation in progress. It will be available shortly.',
      inProgress: 'Generating…',
      typeLabel: 'Report type',
      periodLabel: 'Period',
      closeAria: 'Close',
    },
    overview: {
      title: 'Quick overview',
      byOperator: 'Breakdown by operator',
      totalSuffix: 'in total',
      transactions: 'transactions',
      topAgents: 'Top agents',
      topAgentsSub: 'Volume processed over the period',
      txSuffix: 'tx',
      progressTitle: 'Progress towards target',
      objectivePrefix: 'Target:',
    },
    table: {
      searchPlaceholder: '🔍 Search for a report…',
      typeFilterAria: 'Report type',
      allTypes: 'All types',
      countSuffix: 'report(s)',
      colName: 'Report name',
      colSize: 'Size',
      empty: 'No report',
      statusAvailable: 'Available',
      statusInProgress: 'In progress',
    },
    exports: {
      report: 'Report',
      operator: 'Operator',
      amountFcfa: 'Amount (FCFA)',
      pctOfTotal: '% of total',
      monthlyReport: 'Monthly report',
      bi: 'Business Intelligence',
    },
  },

  comptabilite: {
    title: 'SYSCOHADA Accounting',
    breadcrumb: 'Accounting',
    fiscalYearAria: 'Fiscal year',
    allFiscalYears: 'All fiscal years',
    loadingFiscalYears: 'Loading fiscal years…',
    noFiscalYear: 'No open fiscal year',
    allYearsCombined: 'All fiscal years combined',
    fiscalYearPrefix: 'Fiscal year',

    kpi: {
      produits: 'Revenue accounts (class 7)',
      charges: 'Expense accounts (class 6)',
      resultatNet: 'Net income',
      tresorerie: 'Cash and cash equivalents (class 5)',
      unavailable: 'Unavailable',
      periodCumul: 'Period to date',
      produitsMoinsCharges: 'Revenue − Expenses',
      deficitaire: 'Loss-making year',
      bilanTresorerie: 'Cash items from the balance sheet',
    },

    onglets: {
      grandlivre: 'General Ledger',
      balance: 'Trial Balance',
      resultat: 'Income Statement',
      bilan: 'Balance Sheet',
      plan: 'Chart of accounts',
    },

    etat: {
      loading: 'Loading accounting data…',
      error: 'Accounting data unavailable. No amount can be displayed.',
      empty: 'No data',
    },

    journal: {
      title: 'Journal entries',
      countSuffix: 'entry(ies)',
      empty: 'No journal entry for this fiscal year',
      colDate: 'Date',
      colReference: 'Reference',
      colCompte: 'Account',
      colLibelle: 'Description',
      colDebit: 'Debit',
      colCredit: 'Credit',
      colStatut: 'Status',
      auto: 'Automatic',
      manuelle: 'Manual',
      validee: 'Reconciled',
    },

    balance: {
      title: 'Trial balance',
      empty: 'No accounting movement to balance',
      colNumero: 'Account no.',
      colIntitule: 'Account name',
      colTotalDebit: 'Total debit',
      colTotalCredit: 'Total credit',
      colSolde: 'Balance',
      colSens: 'Side',
      debiteur: 'Debit balance',
      crediteur: 'Credit balance',
      totaux: 'TOTALS',
      equilibree: '✅ Trial balance in balance — Total debit = Total credit',
      desequilibree: '⚠️ Trial balance out of balance — review the entries',
    },

    resultat: {
      empty: 'No revenue or expense recorded for the period',
      produitsHeader: '📈 Revenue — Class 7',
      chargesHeader: '📉 Expenses — Class 6',
      noProduit: 'No revenue recorded',
      noCharge: 'No expense recorded',
      totalProduits: 'TOTAL REVENUE',
      totalCharges: 'TOTAL EXPENSES',
      netTitle: 'Net income for the fiscal year',
      beneficiaire: 'Profitable year',
      deficitaire: 'Loss-making year',
    },

    bilan: {
      actif: 'ASSETS',
      passif: 'LIABILITIES & EQUITY',
      immobilisations: 'Fixed assets',
      stocks: 'Inventory',
      creances: 'Receivables',
      tresorerie: 'Cash and cash equivalents',
      capitaux: 'Equity',
      dettes: 'Liabilities',
      noPoste: 'No line item',
      totalActif: 'TOTAL ASSETS',
      totalPassif: 'TOTAL LIABILITIES & EQUITY',
      desequilibrePrefix: '⚠️ Balance sheet out of balance — difference of',
    },

    plan: {
      title: 'SYSCOHADA chart of accounts',
      countSuffix: 'accounts',
      empty: 'Chart of accounts not initialised for this tenant',
      colNumero: 'Account no.',
      colIntitule: 'Account name',
      colType: 'Type',
      colSens: 'Normal balance',
      debit: 'Debit',
      credit: 'Credit',
    },
  },

  iaFraude: {
    title: '🤖 AI & Monitoring',
    breadcrumb: 'AI & Monitoring',
    subtitle: 'Audit alerts and security events taken from the actual audit log — no simulated data',
    refresh: '🔄 Refresh',

    severite: {
      high: '🔴 High',
      medium: '🟡 Medium',
      low: '🟢 Low',
    },

    types: {
      EXCESSIVE_ACTIVITY: 'Unusual volume of actions',
    },

    ai: {
      loading: 'AI status…',
      unavailable: 'AI status unavailable',
      online: 'SARA assistant active',
      offline: 'SARA assistant offline',
      title: 'SARA AI assistant',
      providersUnavailable: 'AI provider status unavailable',
      providerPrefix: 'Active provider:',
      modelPrefix: 'Model:',
      noScoringNotice:
        'ⓘ No fraud scoring engine is configured: this page computes neither a risk score nor a fraud probability. It only relays alerts from the audit log.',
    },

    kpi: {
      auditedActions: 'Audited actions (24 h)',
      auditedActionsSub: 'Audit log · last 24 hours',
      activeAlerts: 'Active audit alerts',
      unavailable: 'Unavailable',
      highSeverityPrefix: 'including',
      highSeveritySuffix: 'of high severity',
      noHighSeverity: 'No high severity',
      loginFailures: 'Failed logins (7 d)',
      loginFailuresSub: 'Audited LOGIN_FAILED events',
      lockedAccounts: 'Locked accounts (7 d)',
      lockedAccountsSub: 'Audited ACCOUNT_LOCKED events',
    },

    alertes: {
      title: '🚨 Audit alerts',
      loading: 'Loading audit alerts…',
      error:
        'Unable to load the audit alerts. No data is displayed, to avoid any mistaken interpretation.',
      empty:
        'No audit alert in the last hour. No fraud detection is configured on this system.',
      colType: 'Type',
      colUser: 'User',
      colCount: 'No. of actions',
      colPeriod: 'Period',
      colSeverity: 'Severity',
      colDetail: 'Details',
      disclaimer:
        'These alerts flag an unusual volume of activity in the audit log. They are not an accusation of fraud and must be verified manually.',
    },

    security: {
      title: '🔐 Security events — last 7 days',
      loading: 'Loading security events…',
      error: 'Unable to load the security events.',
      empty: 'No security event recorded over the last 7 days.',
    },

    financial: {
      title: '💰 Audited financial movements',
      loading: 'Loading financial movements…',
      error: 'Unable to load the audited financial movements.',
      empty: 'No audited financial movement.',
    },

    colonnes: {
      date: 'Date',
      action: 'Action',
      user: 'User',
      entity: 'Entity',
    },
  },

  administration: {
    title: '⚙️ System administration',
    breadcrumb: 'Administration',
    subtitle: 'Users, roles and audit log supervision',
    restricted: 'Restricted access',
    restrictedMessage:
      'This page is reserved for administrators. Contact an administrator in your organisation if you believe this is a mistake.',
    exportAudit: '📥 Export audit',
    exportCsv: '📥 Export CSV',
    exporting: 'Export in progress…',
    exportError: 'The audit log export failed. Please try again.',

    statuts: {
      actif: '● Active',
      suspendu: '● Suspended',
      inactif: '● Inactive',
      enAttente: '● Pending',
    },

    stats: {
      totalUsers: 'Total users',
      unavailable: 'Data unavailable',
      activeSuffix: 'active',
      inactiveSuffix: 'inactive/suspended',
      roles: 'Configured roles',
      tenantRoles: 'Tenant roles',
      auditActions: 'Audit actions (24h)',
      actionTypesSuffix: 'action types',
      auditAlerts: 'Audit alerts',
      abnormalActivity: 'Abnormal activity (1h)',
    },

    alertes: {
      title: '🚨 Security alerts',
      severityPrefix: 'severity',
    },

    users: {
      title: '👥 Users',
      loading: 'Loading users…',
      error: 'Unable to load the users. Check your permissions or try again.',
      empty: 'No user registered.',
      colUser: 'User',
      colRole: 'Role',
      colLastLogin: 'Last login',
      colStatus: 'Status',
      neverConnected: 'Never logged in',
    },

    roles: {
      title: '🔐 Roles & permissions',
      loading: 'Loading roles…',
      error: 'Unable to load the roles.',
      empty: 'No role configured for this organisation.',
      usersSuffix: 'user(s)',
      noPermission: 'No permission recorded',
    },

    audit: {
      title: '📋 Recent audit log',
      loading: 'Loading the audit log…',
      error: 'Unable to load the audit log.',
      empty: 'No entry in the audit log.',
      colDate: 'Date',
      colAction: 'Action',
      colResource: 'Resource',
      colUser: 'User',
      colIp: 'IP',
      system: 'System',
    },
  },

  notifications: {
    title: 'Notifications',
    subtitle: 'Manage your alerts and system messages',
    markAllRead: 'Mark all as read',
    settings: 'Settings',

    filtres: {
      toutes: 'All',
      non_lues: 'Unread',
      alerte: 'Alerts',
      transaction: 'Transactions',
      systeme: 'System',
    },

    loading: 'Loading…',
    empty: 'No notification',
    emptyUnread: 'All your notifications have been read.',
    emptyCategory: 'No notification in this category.',
    unreadDot: 'Unread',
    markRead: 'Mark as read',
    delete: 'Delete notification',
    prev: 'Previous',
    next: 'Next',
  },

  support: {
    title: 'Support & Tickets',
    subtitle: 'Track your assistance requests',
    newTicket: 'New ticket',
    ticketTitle: 'Issue title',
    description: 'Detailed description',
    category: 'Category',
    priority: 'Priority',
    status: {
      open: 'Open',
      inProgress: 'In progress',
      resolved: 'Resolved',
      closed: 'Closed',
    },
    priority_levels: {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    },
    reply: 'Reply',
    attach: 'Attach a file',
    sendTicket: 'Submit ticket',
    urgentContact: 'Urgent? Contact us directly',
    urgentSub: 'Response guaranteed within 2h for urgent tickets.',
    noTickets: 'No tickets in this category.',
    createFirst: 'Create a new ticket →',
    messages: 'messages',
    updatedAt: 'Updated',
    kpiTotal: 'Total',
    kpiOpen: 'Open',
    kpiInProgress: 'In progress',
    kpiResolved: 'Resolved',
    filterAll: 'All',
    newTicketTitle: 'New support ticket',
    titleRequired: 'Issue title *',
    titlePlaceholder: 'E.g. Transaction stuck, agent cannot log in…',
    descriptionRequired: 'Detailed description *',
    descriptionPlaceholder: 'Describe the issue in detail: steps to reproduce, error messages, references of the transactions concerned…',
    cancel: 'Cancel',
    sending: 'Sending…',
    close: 'Close',
    backToTickets: 'Back to tickets',
    openedAt: 'Opened',
    categoryPrefix: 'Category',
    supportBadge: 'IBIG Soft Support',
    you: 'You',
    replyPlaceholder: 'Your reply… (⌘+Enter to send)',
    categories: {
      technique: 'Technical issue',
      transaction: 'Transaction',
      float: 'Float / Balance',
      agent: 'Agent / Access',
      facturation: 'Billing',
      autre: 'Other',
    },
  },

  aide: {
    title: 'Help Center',
    subtitle: 'GESTMONEY User Guide',
    search: 'Search the guide…',
    searchPlaceholder: 'Search the guide… (e.g. transaction, float, export)',
    exportPdf: 'Export guide as PDF',
    results: 'result(s) for',
    noResults: 'No articles found. Try different keywords.',
    contactSupport: 'Contact support',
    showAll: 'Show all',
    articles: 'article(s)',
    faq: 'Frequently asked questions',
    faqSub: 'The most common questions from users',
    notFound: "Didn't find the answer?",
    notFoundSub: 'Our support team replies within 4 business hours.',
    emailSupport: 'Email support',
    liveChat: 'Live chat',
    centre: {
      badge: 'GESTMONEY Help Centre',
      heroTitle: 'How can we help you?',
      heroSubtitle: 'Full guide, 100 FAQs, support tickets and SARA your AI assistant — all the help you need.',
      searchPlaceholder: 'Search the guide, FAQs, articles…',
      clear: 'Clear',
      noResultFor: 'No results for "{q}"',
      openTicketLink: 'Open a support ticket →',
      resourcesTitle: 'Help resources',
      categories: {
        guide: {
          titre: 'User guide',
          description: 'Complete documentation, step-by-step procedures, tutorials by module.',
          badge: '15 sections',
        },
        faq: {
          titre: 'FAQ — 100 questions',
          description: '100 real questions and answers sorted by module and user role.',
          badge: '12 categories',
        },
        support: {
          titre: 'Support tickets',
          description: 'Open a ticket, track your request, contact the technical team.',
          badge: 'Reply < 4h',
        },
        sara: {
          titre: 'SARA — AI Assistant',
          description: 'Ask SARA, your GESTMONEY AI assistant, any question you like.',
          badge: 'AI available 24/7',
        },
      },
      popularTitle: 'Popular articles',
      seeFullGuide: 'See the full guide',
      articles: {
        a1: { titre: 'Logging in for the first time', section: 'Getting started' },
        a2: { titre: 'Recording a Mobile Money transaction', section: 'Transactions' },
        a3: { titre: 'Understanding roles and permissions', section: 'Security' },
        a4: { titre: 'Configuring float alert thresholds', section: 'Float' },
        a5: { titre: 'Exporting transactions to Excel', section: 'Transactions' },
        a6: { titre: 'Adding a new agent', section: 'Agents' },
        a7: { titre: 'Enabling two-factor authentication', section: 'Security' },
        a8: { titre: 'Generating a monthly report', section: 'Reports' },
      },
      faqTitle: 'Frequently asked questions',
      faqAll: 'All 100 FAQs',
      faqRapide: {
        f1: 'How do I reset an agent\'s password?',
        f2: 'What should I do if a transaction stays stuck?',
        f3: 'What is the difference between AGENT and CASHIER?',
        f4: 'How do I configure commissions?',
        f5: 'Is data backed up automatically?',
      },
      indexFaq: {
        i1: { titre: 'How do I reset an agent\'s password?', sous: 'FAQ · Login' },
        i2: { titre: 'How do I carry out a Mobile Money transaction?', sous: 'FAQ · Transactions' },
        i3: { titre: 'What is the difference between AGENT and MANAGER?', sous: 'FAQ · Permissions' },
        i4: { titre: 'How do I configure commissions per operator?', sous: 'FAQ · Commissions' },
        i5: { titre: 'How do I export transactions to Excel?', sous: 'FAQ · Exports' },
        i6: { titre: 'How do I add an agent?', sous: 'FAQ · Agents' },
        i7: { titre: 'Configuring Mobile Money operators', sous: 'Setup' },
        i8: { titre: 'Enabling two-factor authentication (2FA)', sous: 'Security' },
        i9: { titre: 'Opening a support ticket', sous: 'Support' },
      },
      quickAccessTitle: 'Quick access',
      quickLinks: {
        transaction: 'Record a transaction',
        agent: 'Add an agent',
        float: 'Check the float',
        rapport: 'Generate a report',
        deuxFa: 'Enable 2FA',
        ticket: 'Open a ticket',
      },
      servicesTitle: 'Service status',
      servicesStatus: {
        operationnel: 'Operational',
        degradation: 'Degraded',
        incident: 'Incident',
      },
      services: {
        web: 'Web application',
        api: 'Backend API',
        orange: 'Orange Money (CI)',
        wave: 'Wave Senegal',
        mtn: 'MTN Mobile Money',
        sara: 'SARA AI',
      },
      contactTitle: 'Need urgent help?',
      contactSub: 'Our team replies within 4h on business days. For emergencies, a reply is guaranteed within 2h.',
      openTicket: 'Open a ticket',
      newsTitle: "What's new in v2.1",
      news: {
        n1: 'Excel export with embedded charts',
        n2: 'SARA AI: replies in English and French',
        n3: 'Improved dark mode',
        n4: 'Automatic monthly PDF report',
      },
    },
  },

  onboarding: {
    step: 'Step',
    of: 'of',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    steps: {
      bienvenue: {
        titre: 'Welcome to GESTMONEY',
        description: 'The pan-African Mobile Money management platform. Discover how to set up your workspace in just a few minutes.',
        actionLabel: null,
      },
      operateur: {
        titre: 'Configure your operators',
        description: 'Activate the Mobile Money networks you use: Orange Money, Wave, MTN MoMo, Moov…',
        actionLabel: 'Configure now',
      },
      agent: {
        titre: 'Create your first agent',
        description: 'Add your field agents to start tracking transactions and managing your network.',
        actionLabel: 'Add an agent',
      },
      termine: {
        titre: "You're all set!",
        description: 'Your GESTMONEY workspace is configured. Explore the dashboard and discover all the features.',
        actionLabel: 'Go to dashboard',
      },
    },
  },

  assistant: {
    title: 'GESTMONEY Assistant',
    online: 'Online · Powered by AI',
    placeholder: 'Ask a question…',
    suggestions: [
      'How do I record a transaction?',
      'My float is low, what should I do?',
      'How do I add an agent?',
      'Export reports as PDF',
    ],
  },

  settings: {
    title: 'Settings',
    subtitle: 'Manage your profile, security and preferences',
    profile: 'Profile',
    security: 'Security',
    notifications: 'Notifications',
    appearance: 'Appearance',
    guide: 'Getting started guide',
    guideSub: 'Relaunch the onboarding wizard to rediscover key features',
    relaunchGuide: 'Relaunch guide',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Interface language',
    density: 'Display density',
    compact: 'Compact',
    normal: 'Normal',
    comfortable: 'Comfortable',
    apply: 'Apply',
    changePhoto: 'Change profile picture',
    uploadPhoto: 'Upload a picture',
    defaultUser: 'User',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    languageField: 'Language',
    timezone: 'Time zone',
    oldPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm the new password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    twoFactor: 'Two-factor authentication',
    twoFactorSub: 'Strengthen your account security with a temporary code (TOTP).',
    scanQr: 'Scan this QR code with your authenticator app',
    qrLabel: '2FA QR Code',
    secretCode: 'Secret key:',
    activeSessions: 'Active sessions',
    currentSession: 'Current session',
    revoke: 'Revoke',
    notifCategory: 'Category',
    notifVia: '{cat} via {canal}',
    notifCategories: {
      transactions: 'Transactions',
      float: 'Float',
      commissions: 'Commissions',
      fraude: 'Fraud',
      systeme: 'System',
    },
    notifChannels: {
      email: 'Email',
      sms: 'SMS',
      push: 'Push',
      inApp: 'In-app',
    },
  },

  emails: {
    title: 'Automated emails',
    smtpConfig: 'SMTP Configuration',
    connected: 'Connected',
    preview: 'Preview',
    sendTest: 'Send test',
    testSent: 'Test email sent to',
    categories: {
      auth: 'Authentication',
      transaction: 'Transaction',
      alerte: 'Alert',
      rapport: 'Report',
      reseau: 'Network',
    },
  },

  licences: {
    title: 'Licences & Billing',
    mrr: 'MRR',
    arr: 'Projected ARR',
    trials: 'Active trials',
    toRenew: 'To renew',
    pricing: 'Pricing grid',
    activate: 'Reactivate',
    suspend: 'Suspend',
    renew: 'Renew',
    manage: 'Manage →',
    daysLeft: 'D-',
    expired: 'Expired',
    clients: 'client(s)',
    includedFeatures: 'Included in this plan',
  },

  superadmin: {
    title: 'SuperAdmin Console',
    subtitle: 'Global IBIG Soft management — restricted access',
    operational: 'System operational',
    uptime: 'uptime',
    tenants: 'Active tenants',
    trials: 'Active trials',
    activeUsers: 'Active users',
    todayTx: "Today's tx",
    mrr: 'MRR',
    pendingPayment: 'Pending payment',
    openTickets: 'Open tickets',
    apiLatency: 'API latency',
    clients: 'Clients & tenants',
    auditLog: 'Global audit log',
    auditSub: 'Latest actions across the entire platform',
    entries: 'entry/entries',
    columns: {
      societe: 'Company',
      plan: 'Plan',
      statut: 'Status',
      utilisateurs: 'Users',
      txMois: 'Tx this month',
      renouvellement: 'Renewal',
    },
    statutLabels: {
      ACTIVE: 'Active',
      TRIAL: 'Trial',
      SUSPENDED: 'Suspended',
      EXPIRED: 'Expired',
    },
    kpi: {
      totalSuffix: 'in total',
      expiredSuffix: 'expired',
      registeredSuffix: 'registered',
      arrPrefix: 'ARR:',
      toFollowUp: 'To follow up',
      inProgressSuffix: 'in progress',
      moduleOffline: 'Module not connected',
      errors24h: 'error(s) / 24h',
      monitoringOffline: 'Monitoring not connected',
    },
    quick: {
      emails: 'Automated emails',
      emailsSub: '6 templates · SMTP config',
      licences: 'Licences & Billing',
      licencesSub: 'licences · MRR',
      infra: 'Infrastructure',
      infraSub: 'Coming soon',
    },

    // ── Prospects sub-page (mockup) ─────────────────────────────────────
    prospects: {
      title: 'Prospect CRM',
      subtitle: 'GESTMONEY sales pipeline',
      newProspect: '+ New prospect',
      all: 'All',
      searchPlaceholder: 'Search by name, company, email…',
      view: 'View',
      empty: 'No prospect found.',
      close: 'Close',
      kpi: {
        total: 'Total',
        nouveaux: 'New',
        enCours: 'In progress',
        gagnes: 'Won',
        conversion: 'Conversion',
      },
      statuts: {
        NOUVEAU: 'New',
        QUALIFICATION: 'Qualification',
        PROPOSITION: 'Proposal',
        NEGOCIATION: 'Negotiation',
        GAGNE: 'Won ✓',
        PERDU: 'Lost',
      },
      origines: {
        DEMO: '📅 Demo',
        SITE_WEB: '🌐 Website',
        PARTENAIRE: '🤝 Partner',
        SARA: '🤖 SARA',
        EVENEMENT: '🎪 Event',
        COLD_EMAIL: '📧 Email',
      },
      columns: {
        prospect: 'Prospect',
        entreprise: 'Company',
        statut: 'Status',
        score: 'Score',
        origine: 'Source',
        relance: 'Follow-up',
        ajoute: 'Added',
      },
      detail: {
        email: 'Email',
        telephone: 'Phone',
        secteur: 'Industry',
        origine: 'Source',
        score: 'Score',
        priorite: 'Priority',
        pipeline: 'Pipeline status',
        planDemo: '📅 Schedule demo',
        creerOffre: '📄 Create a quote',
        perdu: 'Lost',
      },
    },

    // ── Demonstrations sub-page (mockup) ────────────────────────────────
    demos: {
      title: 'Demonstrations',
      subtitle: 'Scheduling and tracking of sales demos',
      schedule: '+ Schedule a demo',
      all: 'All',
      at: 'at',
      join: '🔗 Join the meeting',
      close: 'Close',
      kpi: {
        total: 'Total',
        planifiees: 'Scheduled',
        realisees: 'Completed',
        annulees: 'Cancelled',
        tauxReal: 'Completion rate',
      },
      statuts: {
        PLANIFIEE: 'Scheduled',
        REALISEE: 'Completed ✓',
        ANNULEE: 'Cancelled',
      },
      modes: {
        VISIO: '📹 Video',
        PRESENTIEL: '🏢 On-site',
        TELEPHONE: '📞 Phone',
      },
      detail: {
        date: 'Date',
        mode: 'Mode',
        fuseau: 'Time zone',
        animateur: 'Host',
        statut: 'Status',
        email: 'Email',
        notes: 'Notes',
        markDone: '✓ Mark as completed',
        cancel: 'Cancel',
        createOffer: '📄 Create a quote',
      },
      form: {
        title: 'Schedule a demo',
        prospect: 'Prospect (email)',
        prospectPlaceholder: 'prospect@company.com',
        date: 'Date',
        heure: 'Time',
        mode: 'Mode',
        visio: '📹 Video conference',
        presentiel: '🏢 On-site',
        telephone: '📞 Phone',
        confirm: 'Confirm the demonstration',
      },
    },

    // ── Quotes sub-page (mockup) ────────────────────────────────────────
    offres: {
      title: 'Quotes & Proposals',
      subtitle: 'Management of sales proposals',
      newOffer: '+ New quote',
      all: 'All',
      view: 'View',
      close: 'Close',
      kpi: {
        pipeline: 'Pipeline',
        converties: 'Converted',
        enCours: 'In progress',
        tauxConv: 'Conv. rate',
      },
      statuts: {
        BROUILLON: 'Draft',
        ENVOYEE: 'Sent',
        EN_NEGOCIATION: 'Negotiation',
        CONVERTIE: 'Converted ✓',
        REFUSEE: 'Declined',
        EXPIREE: 'Expired',
      },
      columns: {
        reference: 'Reference',
        prospect: 'Prospect',
        plan: 'Plan',
        ht: 'Net',
        remise: 'Discount',
        ttc: 'Gross',
        statut: 'Status',
        expiration: 'Expiry',
      },
      detail: {
        plan: 'Plan',
        prixHT: 'Net price',
        remise: 'Discount',
        aucune: 'None',
        taxes: 'Tax',
        totalTTC: 'Total incl. tax',
        creeeLe: 'Created on',
        expireLe: 'Expires on',
        send: '📧 Send',
        markConverted: '✓ Mark as converted',
        pdf: '📥 PDF',
      },
    },

    // ── Payments sub-page (mockup) ──────────────────────────────────────
    paiements: {
      title: 'Payments & Billing',
      subtitle: 'Tracking of transactions and subscriptions',
      all: 'All',
      view: 'View',
      close: 'Close',
      kpi: {
        encaisse: 'Collected (XOF)',
        enAttente: 'Pending',
        echecs: 'Failures',
        rembourses: 'Refunded',
      },
      statuts: {
        REUSSI: 'Successful ✓',
        EN_ATTENTE: 'Pending',
        ECHEC: 'Failed',
        REMBOURSE: 'Refunded',
        ANNULE: 'Cancelled',
      },
      columns: {
        reference: 'Reference',
        client: 'Client',
        montant: 'Amount',
        provider: 'Provider',
        plan: 'Plan',
        periode: 'Period',
        statut: 'Status',
        date: 'Date',
      },
      detail: {
        provider: 'Provider',
        periode: 'Period',
        date: 'Date',
        email: 'Email',
        recu: '📥 PDF receipt',
        rembourser: '↩ Refund',
        relancer: '🔄 Retry',
      },
    },

    // ── Analytics sub-page (mockup) ─────────────────────────────────────
    analytics: {
      title: 'Platform Analytics',
      subtitle: 'Traffic, engagement and conversions',
      vsPrevious: 'vs previous period',
      trafficTitle: 'Traffic — Sessions',
      lastN: 'Last',
      topPagesTitle: 'Most visited pages',
      topEventsTitle: 'Key events',
      sourcesTitle: 'Traffic sources',
      countriesTitle: 'Top countries',
      kpi: {
        sessions: 'Sessions',
        moyJour: 'Avg. / day',
        rebond: 'Bounce rate',
        conversions: 'Conversions',
      },
      pages: {
        landing: 'Landing page',
        login: 'Sign in',
        dashboard: 'Dashboard',
        tarifs: 'Pricing section',
        cgu: 'Terms of use',
      },
      events: {
        ctaClick: 'Free trial CTA click',
        demoRequest: 'Demo request',
        loginSuccess: 'Successful sign-in',
        pwaPrompt: 'PWA prompt shown',
        saraOpen: 'SARA opened',
      },
      sources: {
        organique: 'Organic',
        direct: 'Direct',
        social: 'Social media',
        partenaires: 'Partners',
        emails: 'Emails',
      },
      pays: {
        ci: 'Ivory Coast',
        sn: 'Senegal',
        gh: 'Ghana',
        ml: 'Mali',
        bj: 'Benin',
      },
    },

    // ── SARA — AI configuration sub-page (mockup) ───────────────────────
    saraConfig: {
      title: 'SARA — AI configuration',
      subtitle: 'Settings for the GESTMONEY intelligent assistant',
      providerTitle: 'Active provider',
      active: '🟢 Active',
      standby: '⚫ Standby',
      modelTitle: 'Model',
      genTitle: 'Generation settings',
      temperature: 'Temperature',
      precise: 'Precise',
      creative: 'Creative',
      maxTokens: 'Max tokens per response',
      promptTitle: 'System prompt',
      reset: '↺ Reset',
      charsSuffix: 'characters',
      tokensEstimated: 'estimated tokens',
      saved: '✓ Configuration saved!',
      save: 'Save configuration',
      quotasTitle: 'Quotas',
      daily: 'Daily',
      monthly: 'Monthly',
      dailyQuota: 'Daily quota',
      monthlyQuota: 'Monthly quota',
      usageTitle: 'Usage by provider',
      tokensSuffix: 'k tokens',
      conversationsTitle: 'Recent conversations',
      msgSuffix: 'msg',
      tokSuffix: 'tok',
      contextes: {
        PUBLIC: '🌐 Public',
        INTERNE: '🔒 Internal',
        SUPPORT: '🎧 Support',
      },
    },

    // ── Licences & Billing sub-page (mockup) ────────────────────────────
    licencesPage: {
      breadcrumb: 'SuperAdmin Console',
      title: 'Licences & Billing',
      countSuffix: 'licences',
      activesSuffix: 'active',
      pricingTitle: 'Pricing table',
      quote: 'On quote',
      perMonthShort: '/month',
      perMonthLong: '/ month',
      free: 'Free',
      clientsSuffix: 'client(s)',
      all: 'All',
      manage: 'Manage →',
      daysLeft: 'D-',
      expired: 'Expired',
      close: 'Close',
      kpi: {
        mrr: 'MRR',
        arr: 'Projected ARR',
        trials: 'Active trials',
        toRenew: 'To renew',
      },
      statuts: {
        ACTIVE: 'Active',
        TRIAL: 'Trial',
        SUSPENDED: 'Suspended',
        EXPIRED: 'Expired',
        PENDING: 'Pending',
      },
      columns: {
        societe: 'Company',
        plan: 'Plan',
        statut: 'Status',
        mrr: 'MRR',
        utilisateurs: 'Users',
        txMois: 'Tx this month',
        expiration: 'Expiry',
      },
      modal: {
        currentPlan: 'Current plan',
        statut: 'Status',
        expiration: 'Expiry',
        utilisateurs: 'Users',
        txMois: 'Tx this month',
        included: 'Included in this plan',
        reactivate: 'Reactivate',
        suspend: 'Suspend',
        renew: 'Renew',
      },
      plans: {
        STARTER: 'Starter',
        PROFESSIONAL: 'Professional',
        ENTERPRISE: 'Enterprise',
        CUSTOM: 'Custom',
      },
      features: {
        starter: ['5 users', '10,000 tx/month', 'Email support', 'CSV exports'],
        professional: ['25 users', '50,000 tx/month', 'Priority support', 'PDF/XLSX exports', 'BI reports'],
        enterprise: ['Unlimited', 'Unlimited transactions', 'Dedicated 24/7 support', 'Full API', 'Multi-country', '99.9% SLA'],
        custom: ['Tailor-made', 'Custom quote'],
      },
    },

    // ── Automated emails sub-page ───────────────────────────────────────
    emailsPage: {
      templates: {
        bienvenue: {
          titre: 'Welcome',
          sujet: 'Welcome to GESTMONEY — your account is active',
          description: 'Sent as soon as a user or operator account is created.',
          declencheur: 'Account creation',
        },
        reset_mdp: {
          titre: 'Password reset',
          sujet: 'Reset your GESTMONEY password',
          description: 'Sent on reset request, with a time-limited link.',
          declencheur: 'Reset request',
        },
        transaction_confirmee: {
          titre: 'Transaction confirmation',
          sujet: 'Your transaction has been confirmed',
          description: 'Sent to the customer once a transaction is approved.',
          declencheur: 'Transaction approved',
        },
        alerte_float: {
          titre: 'Low float alert',
          sujet: 'Alert: insufficient float',
          description: "Sent when an operator's float balance falls below its threshold.",
          declencheur: 'Float threshold reached',
        },
        rapport_mensuel: {
          titre: 'Monthly report',
          sujet: 'Your GESTMONEY monthly report',
          description: 'Activity summary sent automatically at the start of each month.',
          declencheur: 'Start of month',
        },
        invitation_agent: {
          titre: 'Agent invitation',
          sujet: 'You are invited to join GESTMONEY',
          description: 'Sent to an agent invited to join the network.',
          declencheur: 'Invitation sent',
        },
      },
      breadcrumb: 'SuperAdmin Console',
      title: 'Automated emails',
      templatesActive: 'active templates',
      smtpButton: 'SMTP config.',
      smtpAlert: 'Opens the SMTP editor in a real deployment',
      testSentPrefix: 'Test email "',
      testSentSuffix: '" sent to',
      all: 'All',
      enable: 'Enable',
      disable: 'Disable',
      preview: 'Preview',
      sendTest: 'Send a test',
      back: '← Back',
      close: 'Close',
      desktop: 'Desktop',
      mobile: 'Mobile',
      from: 'From:',
      subject: 'Subject:',
      previewTitle: 'Preview:',
      availableVars: 'Available variables',
      smtpTitle: 'SMTP configuration',
      smtpSub: 'Sending settings for transactional emails',
      connected: 'Connected',
      kpi: {
        sent30d: 'Sent (30d)',
        openRate: 'Open rate',
        clickRate: 'Click rate',
        errors: 'Sending errors',
      },
      categories: {
        auth: 'Authentication',
        transaction: 'Transaction',
        alerte: 'Alert',
        rapport: 'Report',
        reseau: 'Network',
      },
      smtpFields: {
        server: 'SMTP server',
        port: 'Port',
        sender: 'Sender',
        displayName: 'Display name',
      },
    },
  },

  // ── User guide ────────────────────────────────────────────────────────
  guide: {
    fil: { accueil: '🏠 Home', aide: 'Help centre', guide: 'User guide' },
    titre: '📘 User guide',
    sousTitreA: 'articles across',
    sousTitreB: 'modules — everything described here exists and works',
    relancerVisite: 'Restart the tour',
    exporterPdf: 'Export PDF',
    retourAide: '← Help centre',
    banniereTitre: 'First time here? Start with the guided tour',
    banniereTexte:
      'About fifteen tooltips that walk you through the main screens. Screens your account cannot access are skipped automatically. You can restart it as often as you like.',
    recherchePlaceholder: 'Search… (e.g. cash, float, commission, prepaid code)',
    rechercheAria: 'Search the guide',
    resultatUn: 'result for',
    resultatPlusieurs: 'results for',
    aucuneFiche: 'No article found. Try another word.',
    voirFaq: 'See the FAQ',
    tousModules: 'All modules',
    pasEncoreDisponible: 'Not available yet',
    bloqueTitre: 'Still stuck?',
    bloqueTexte: 'The FAQ answers in one line; support answers case by case.',
    faq: 'FAQ',
    ouvrirTicket: 'Open a ticket',
    pdf: {
      titre: 'GESTMONEY User Guide',
      fiches: 'articles',
      modules: 'modules',
      colModule: 'Module',
      colFiche: 'Article',
      colObjectif: 'Purpose',
      colRoles: 'Roles',
    },
    sections: {
      demarrage: { titre: 'Getting started', description: 'Your first steps, in order, without missing anything.' },
      navigation: { titre: 'Finding your way around', description: 'The menu, the top bar, and the phone.' },
      tableauDeBord: { titre: 'Dashboard', description: 'The home screen, different depending on your role.' },
      transactions: { titre: 'Transactions', description: 'The journal of all your Mobile Money operations.' },
      float: { titre: 'Float management', description: 'Your balances with each operator, and their replenishment.' },
      caisse: { titre: 'Cash desk', description: 'The cash journal and the end-of-day check.' },
      agences: { titre: 'Branches & POS', description: 'Your points of sale and your network coverage.' },
      agents: { titre: 'Agents', description: "Your agents' accounts and their activity for the day." },
      clients: { titre: 'Clients', description: 'Your client base and KYC tracking.' },
      stock: { titre: 'Stock', description: 'SIM cards, terminals, accessories and consumables.' },
      commissions: { titre: 'Commissions', description: 'Approve and pay what you owe your agents.' },
      performances: { titre: 'Performance', description: 'Your agent rankings and your key indicators.' },
      rapports: { titre: 'Reports & BI', description: 'Generate and share your consolidated figures.' },
      comptabilite: { titre: 'SYSCOHADA accounting', description: 'Your financial statements, generated from your operations.' },
      administration: { titre: 'Administration', description: 'Users, roles and the action log.' },
      audit: { titre: 'Audit & Alerts', description: 'What the page flags — and what it does not say.' },
      abonnement: { titre: 'Subscription & payment', description: 'Pay for your subscription and track your payments.' },
      notifications: { titre: 'Notifications', description: 'Your system alerts and messages.' },
      parametres: { titre: 'Settings', description: 'Profile, security, notifications and appearance.' },
      profil: { titre: 'My profile', description: 'Your information and your recent activity.' },
      aide: { titre: 'Help, support and SARA', description: 'Where to ask when this guide is not enough.' },
    },
    articles: {
      aQuoiSertGestmoney: {
        titre: 'What GESTMONEY is for',
        objectif: 'Understand what the platform does for your Mobile Money business.',
        roles: ['Everyone'],
        tags: ['overview', 'getting started', 'mobile money'],
        contenu: `<p>GESTMONEY exists to <strong>keep the books of a Mobile Money network</strong>: what your agents collect, what you owe each operator, what is left in the cash desk, and what each person has earned.</p>
<p>In practice, the platform answers four questions you ask yourself every day:</p>
<ul>
  <li><strong>How many operations today, and for what amount?</strong> → Transactions, Dashboard</li>
  <li><strong>Do I still have enough float with Orange, Wave, MTN?</strong> → Float management</li>
  <li><strong>Does my cash desk balance tonight?</strong> → Cash desk</li>
  <li><strong>How much do I owe my agents this month?</strong> → Commissions</li>
</ul>
<p>Everything else (branches, clients, stock, reports, accounting) follows from those four.</p>`,
        conseils: ['If you were only to check two screens a day: the Dashboard in the morning, the Cash desk in the evening.'],
      },
      ordreDeConfiguration: {
        titre: 'The order to set everything up in',
        objectif: 'Avoid getting stuck on a step because the previous one was skipped.',
        roles: ['Administrator'],
        tags: ['configuration', 'getting started', 'order', 'checklist'],
        contenu: `<p>Order matters: an agent cannot be attached to a branch that does not exist yet.</p>
<ol>
  <li><strong>Create your branches</strong> (Branches &amp; POS) — at least one, your main point of sale.</li>
  <li><strong>Create your agents</strong> (Agents) and attach them to their branch.</li>
  <li><strong>Record a test operation</strong> (Transactions) to check that everything flows.</li>
  <li><strong>Check the float</strong> (Float management) and note your alert thresholds.</li>
  <li><strong>Review the commissions</strong> (Commissions) after a few days of activity.</li>
</ol>
<p>The <strong>Getting started guide</strong> shown at the top of the dashboard (for administrator accounts) repeats this list as a checklist. You tick each line yourself once it is done — it is not detected automatically.</p>`,
        avertissements: ['The Getting started checkboxes are stored in your browser, not on the server: they will not follow you if you switch devices.'],
        liens: ['Branches & POS', 'Agents'],
      },
      rolesEtAcces: {
        titre: 'Who sees what: roles',
        objectif: 'Understand why a colleague does not see the same menu as you.',
        roles: ['Everyone'],
        tags: ['role', 'access', 'permissions', 'menu'],
        contenu: `<p>The left-hand menu adapts to your role. If a page someone mentions does not appear for you, that is normal: your account does not have access to it.</p>
<ul>
  <li><strong>Administrator / Super admin</strong> — everything, including Administration, Accounting and Audit.</li>
  <li><strong>Supervisor / Manager</strong> — their network: transactions, agents, branches, reports, settings.</li>
  <li><strong>Agent</strong> — the field essentials: transactions, float, cash desk, clients.</li>
  <li><strong>Auditor</strong> — read-only: operations and the audit log.</li>
</ul>
<p>Menu filtering is a display convenience. The real barrier is on the server: even by typing a page address by hand, an unauthorised account is refused the data.</p>`,
        conseils: ['The dashboard also changes its content according to role: an agent sees "My transactions", an administrator sees the whole network.'],
      },
      menuGauche: {
        titre: 'The left-hand menu',
        objectif: 'Find the right module quickly.',
        roles: ['Everyone'],
        tags: ['menu', 'sidebar', 'navigation', 'badge'],
        contenu: `<p>Modules are grouped into four families:</p>
<ul>
  <li><strong>Main</strong> — Dashboard, Transactions, Float management, Cash desk</li>
  <li><strong>Network</strong> — Branches &amp; POS, Agents, Clients, Stock</li>
  <li><strong>Finance &amp; Analysis</strong> — Commissions, Performance, Reports &amp; BI, Accounting</li>
  <li><strong>Administration</strong> — Notifications, Administration, Audit &amp; Alerts, Settings, Subscription, My profile, Support, Help centre</li>
</ul>
<h4>The coloured badges</h4>
<p>Only three entries carry a counter, and it updates on its own:</p>
<ul>
  <li><strong>Transactions</strong> — number of operations awaiting approval</li>
  <li><strong>Float management</strong> — number of open balance alerts</li>
  <li><strong>Notifications</strong> — unread messages (red badge)</li>
</ul>
<p>On a computer, the button at the bottom of the menu collapses it into a column of icons; that choice is remembered.</p>`,
      },
      mobile: {
        titre: 'Using GESTMONEY on a phone',
        objectif: 'Work from the field, without a computer.',
        roles: ['Everyone'],
        tags: ['mobile', 'phone', 'field'],
        contenu: `<p>On a phone, the layout reorganises itself:</p>
<ul>
  <li>The left-hand menu disappears — open it with the <strong>menu button at the top left</strong>.</li>
  <li>A <strong>navigation bar at the bottom of the screen</strong> gives access to the most-used screens.</li>
  <li>Tables <strong>scroll horizontally</strong>: swipe to see the last columns (Status, Actions).</li>
</ul>`,
        conseils: ['On a table, if you cannot see the "Actions" column, drag the table to the left.'],
      },
      barreDuHaut: {
        titre: 'The top bar',
        objectif: 'Notifications, language, theme and account.',
        roles: ['Everyone'],
        tags: ['topbar', 'notifications', 'language', 'theme'],
        contenu: `<p>From left to right: the logo (back to the dashboard), today's date, the <strong>French / English</strong> language switch, the <strong>light / dark</strong> toggle, the <strong>notification bell</strong> with its red counter, then your <strong>avatar</strong>.</p>
<p>The avatar opens your account menu: profile access and sign-out.</p>`,
      },
      lireLeTableauDeBord: {
        titre: 'Reading your dashboard',
        objectif: 'Understand the figures shown when you open it.',
        roles: ['Everyone'],
        tags: ['dashboard', 'kpi', 'home'],
        contenu: `<p>The screen greets you by your first name and shows the time of the last update. The cards displayed depend on your role:</p>
<ul>
  <li><strong>Administrator</strong> — Transactions, Volume for the day, Agents, Branches, Commissions, Operator float, Alerts</li>
  <li><strong>Manager</strong> — Branch transactions, Branch volume, My team, Float alert</li>
  <li><strong>Agent</strong> — My transactions, My float, My commission</li>
  <li><strong>Auditor</strong> — Audited operations, Transactions for the day, Volume for the day</li>
</ul>
<h4>The three buttons at the top</h4>
<ol>
  <li><strong>🔄 Refresh</strong> — reloads the figures without reloading the page</li>
  <li><strong>+ New transaction</strong> — shortcut to recording an operation</li>
  <li><strong>📊 Reports</strong> — opens Reports &amp; BI</li>
</ol>`,
        avertissements: ['If the subtitle says "demonstration data", the server did not respond: the figures shown are examples, not your real activity. Refresh, and tell support if it persists.'],
      },
      enregistrerTransaction: {
        titre: 'Recording an operation',
        objectif: 'Enter a deposit, a withdrawal, a cash in or a cash out.',
        roles: ['Agent', 'Manager', 'Administrator'],
        tags: ['transaction', 'deposit', 'withdrawal', 'cash in', 'cash out', 'entry'],
        contenu: `<p>Four buttons at the top of the page open the right form directly: <strong>+ Deposit</strong>, <strong>+ Withdrawal</strong>, <strong>+ Cash In</strong>, <strong>+ Cash Out</strong>. The type is therefore chosen before the window even opens.</p>
<ol>
  <li>Click the button matching the type of operation.</li>
  <li>Choose the <strong>operator</strong> — mandatory.</li>
  <li>Enter the <strong>amount in FCFA</strong> — mandatory, and strictly greater than zero.</li>
  <li><strong>Client phone</strong> and <strong>Client name</strong> — optional, but very useful for finding the operation later.</li>
  <li>Click <strong>Confirm the transaction</strong>.</li>
</ol>
<p>The operation appears immediately at the top of the list.</p>`,
        avertissements: ['A zero or negative amount is rejected with the message "Invalid amount".'],
        conseils: ["Enter the client's number even when it is not mandatory: it is the only reliable way to find a disputed operation two weeks later."],
        liens: ['Open transactions'],
      },
      statutsTransaction: {
        titre: 'The four statuses, and what to do',
        objectif: 'Know how to react depending on the state of an operation.',
        roles: ['Everyone'],
        tags: ['status', 'pending', 'success', 'failed', 'cancelled', 'approve'],
        contenu: `<table>
  <thead><tr><th>Status</th><th>What it means</th><th>What you do</th></tr></thead>
  <tbody>
    <tr><td><strong>Success</strong></td><td>The operation went through</td><td>Nothing</td></tr>
    <tr><td><strong>Pending</strong></td><td>Not confirmed yet</td><td>A manager can approve it from the Actions column (✓ button)</td></tr>
    <tr><td><strong>Failed</strong></td><td>The operation did not go through</td><td>Check with the operator, then re-enter it if necessary</td></tr>
    <tr><td><strong>Cancelled</strong></td><td>Operation abandoned</td><td>Nothing — it stays in the journal for traceability</td></tr>
  </tbody>
</table>
<p>The approval button (✓) only appears on <strong>Pending</strong> rows. It also appears in the detail window, opened with the 👁 icon.</p>`,
        nonDisponible: ['A transaction cannot be edited or deleted once recorded: this is deliberate, an accounting journal is not rewritten. If you make a mistake, record the correcting entry.'],
      },
      filtrerExporterTransactions: {
        titre: 'Filtering, sorting and exporting',
        objectif: 'Find a specific operation and export the journal.',
        roles: ['Everyone'],
        tags: ['filter', 'export', 'csv', 'search', 'sort'],
        contenu: `<h4>Available filters</h4>
<ul>
  <li><strong>Start date</strong> and <strong>End date</strong></li>
  <li><strong>Type</strong> — Deposit, Withdrawal, Cash In, Cash Out, Transfer, Payment</li>
  <li><strong>Operator</strong></li>
  <li><strong>Status</strong> — Success, Pending, Failed, Cancelled</li>
  <li><strong>Search</strong> — by reference, agent or client</li>
</ul>
<p>The <strong>Reset</strong> button clears all filters at once. Table columns sort by clicking their header.</p>
<h4>Export</h4>
<p>The <strong>📥 Export CSV</strong> button exports the list in spreadsheet format, readable in Excel as well as LibreOffice.</p>`,
        avertissements: ['The export covers the transactions currently loaded on screen: apply your filters first, and check the number of rows obtained before sending the file on.'],
        nonDisponible: ['On this page, only CSV is offered. For a formatted PDF or Excel file, go through Reports & BI.'],
      },
      comprendreFloat: {
        titre: 'Understanding float',
        objectif: 'Know what the coloured gauges represent.',
        roles: ['Everyone'],
        tags: ['float', 'balance', 'liquidity', 'threshold'],
        contenu: `<p><strong>Float</strong> is the electronic money you hold with an operator. It is what limits what you can serve: with no Orange float, you can no longer process an Orange withdrawal, even if your cash desk is full of banknotes.</p>
<p>Each operator has its own card, with a gauge and a state:</p>
<ul>
  <li><strong>✓ OK</strong> — comfortable balance</li>
  <li><strong>⚡ Low</strong> — plan the replenishment ahead</li>
  <li><strong>⚠ Critical</strong> — below the threshold, an alert banner appears at the top of the page</li>
</ul>
<p>The page also shows the time of the last update, just under the title.</p>`,
        conseils: ['Float and cash are two sides of the same coin: a client withdrawal lowers your cash and raises your float. A deposit does the opposite.'],
      },
      demanderReapprovisionnement: {
        titre: 'Requesting a replenishment',
        objectif: 'Flag a float need before running out.',
        roles: ['Agent', 'Manager', 'Administrator'],
        tags: ['replenishment', 'float', 'request'],
        contenu: `<ol>
  <li>Click <strong>+ Replenishment</strong> at the top of the page, or <strong>+ Replenish</strong> directly on the card of the operator concerned.</li>
  <li>Choose the <strong>operator</strong> (already pre-filled if you started from its card).</li>
  <li>Enter the <strong>amount in XOF</strong> — mandatory.</li>
  <li>Add a <strong>comment</strong> if the context warrants it (optional).</li>
  <li><strong>Send the request</strong>.</li>
</ol>
<p>The request appears in the <strong>🔄 Open requests</strong> section and goes through four states: <strong>⏳ Pending</strong>, <strong>↻ Approved</strong>, <strong>✓ Completed</strong>, <strong>✕ Rejected</strong>.</p>
<p>The <strong>📋 Movements of the day</strong> section traces every float inflow and outflow with the time, the amount, the agent and the resulting balance.</p>`,
        avertissements: ['Sending the request does not credit the float. It must be approved and then actually executed with the operator: until the status reads "Completed", the money is not there.'],
        nonDisponible: ['The alert thresholds shown at the bottom of the page are read-only: they can be consulted but not changed from this page.'],
      },
      controleCaisse: {
        titre: 'Doing your evening cash check',
        objectif: 'Verify that the physical cash matches the journal.',
        roles: ['Agent', 'Manager', 'Administrator'],
        tags: ['cash desk', 'discrepancy', 'check', 'closing', 'journal'],
        contenu: `<p>Four figures sum up your day: <strong>Current balance</strong>, <strong>Inflows for the day</strong>, <strong>Outflows for the day</strong> and <strong>Discrepancy</strong>.</p>
<p>The discrepancy is the figure to watch. Below it a clear label is shown: <strong>Cash balanced</strong>, <strong>Surplus</strong> or <strong>Shortfall</strong>.</p>
<h4>The evening routine</h4>
<ol>
  <li>Click <strong>Refresh</strong> to be sure you have everything.</li>
  <li>Physically count your cash.</li>
  <li>Compare it with the <strong>Current balance</strong> shown.</li>
  <li>If the two match: you are done.</li>
  <li>Otherwise, go back up the <strong>Cash journal</strong> line by line — the "Balance after" column shows you at which movement the discrepancy appeared.</li>
</ol>`,
        conseils: ['A recurring shortfall at the same time of day is rarely theft: it is almost always an operation entered twice, or not entered at all.'],
      },
      ecritureManuelleCaisse: {
        titre: 'Making a manual entry',
        objectif: 'Record a cash movement that does not come from a transaction.',
        roles: ['Agent', 'Manager', 'Administrator'],
        tags: ['entry', 'manual', 'inflow', 'outflow', 'cash desk'],
        contenu: `<p>Not all cash that moves comes from a Mobile Money operation: the morning cash injection, transport costs, buying airtime… These movements are entered by hand.</p>
<ol>
  <li>Click <strong>Manual entry</strong>.</li>
  <li>Choose the <strong>Type</strong>: Inflow or Outflow — mandatory.</li>
  <li>Enter the <strong>Label</strong> — mandatory, and it is what you will re-read in three months: be precise.</li>
  <li>Enter the <strong>Amount in FCFA</strong> — mandatory.</li>
  <li>Choose a <strong>Category</strong>: Deposit, Withdrawal, Cash In, Cash Out, Replenishment, Commission, Cash injection or Expenses.</li>
  <li><strong>Save</strong>.</li>
</ol>`,
        avertissements: ['Do not make a manual entry to offset a discrepancy you cannot explain: you would hide the symptom without fixing the cause, and the discrepancy will come back.'],
        nonDisponible: [
          'The "Export" button on the Cash desk page is not connected yet: it produces no file. To export your movements, go through Accounting or Reports & BI.',
          'No filter or search on the cash journal: it shows the current day.',
        ],
      },
      creerAgence: {
        titre: 'Creating a branch',
        objectif: 'Open a new point of sale in the system.',
        roles: ['Manager', 'Administrator'],
        tags: ['branch', 'point of sale', 'creation', 'network'],
        contenu: `<ol>
  <li>Click <strong>+ New branch</strong>.</li>
  <li><strong>Branch name</strong> — mandatory.</li>
  <li><strong>Code</strong> — mandatory. This is the short identifier you will use everywhere else; choose it readable and final (e.g. <code>ABJ-TREICH-01</code>).</li>
  <li><strong>City</strong> — mandatory.</li>
  <li><strong>Phone</strong>, <strong>Address</strong>, <strong>Manager</strong> — optional.</li>
  <li><strong>Create the branch</strong>.</li>
</ol>
<p>The page then shows your branches as cards, each with the number of agents, how many are online, the code and the opening hours. At the top: Active branches, Total agents, Cities covered, Inactive branches.</p>`,
        conseils: ['The search field accepts the name, the city or the code: on a large network, searching by code is fastest.'],
      },
      desactiverAgence: {
        titre: 'Closing a branch without losing its history',
        objectif: 'Remove a point of sale from the active network.',
        roles: ['Manager', 'Administrator'],
        tags: ['deactivate', 'closing', 'branch'],
        contenu: `<p>On the branch card, the <strong>⏸️ Deactivate</strong> button removes it from the active network. It is not deleted: its past transactions stay in the journal and in your reports. The <strong>▶️ Activate</strong> button reverses this.</p>`,
        nonDisponible: ['The "👁️ View details" button on a branch card does not open any detail sheet yet.'],
      },
      creerAgent: {
        titre: 'Creating an agent account',
        objectif: 'Give access to a new team member.',
        roles: ['Manager', 'Administrator'],
        tags: ['agent', 'creation', 'account', 'password'],
        contenu: `<ol>
  <li>Click <strong>+ Create an agent</strong>.</li>
  <li><strong>First name</strong>, <strong>Last name</strong>, <strong>Email</strong>, <strong>Phone</strong> — mandatory.</li>
  <li><strong>Branch</strong> — to be chosen from the list of your existing branches.</li>
  <li><strong>Temporary password</strong> — you set it, and you are the one who must pass it on to the agent.</li>
  <li><strong>✅ Create the agent</strong>.</li>
</ol>`,
        avertissements: [
          'The temporary password is not sent anywhere automatically. Write it down at the moment of creation and hand it to the agent in person: you will not be able to read it again afterwards.',
          'Create the branch BEFORE the agent, otherwise the branch list will be empty when you try to attach them.',
        ],
      },
      suivreAgents: {
        titre: 'Tracking and suspending an agent',
        objectif: "See the day's activity and cut off access if necessary.",
        roles: ['Manager', 'Administrator', 'Supervisor'],
        tags: ['performance', 'suspend', 'activity', 'presence'],
        contenu: `<p>The table gives, agent by agent: phone, branch, <strong>transactions for the day</strong>, <strong>volume for the day</strong>, <strong>commission</strong>, presence, status and registration date. The Agent, Branch, Transactions and Volume columns sort by clicking their header.</p>
<h4>Filters</h4>
<ul>
  <li><strong>Branch</strong></li>
  <li><strong>Status</strong> — Active, Inactive, Online</li>
  <li><strong>Search</strong> — name, email or phone</li>
</ul>
<p>In the Actions column, <strong>🚫 Suspend</strong> immediately cuts off an agent's access; <strong>✅ Activate</strong> restores it.</p>`,
        avertissements: ['The figures in the table cover the CURRENT DAY. To judge an agent over the month, go to Performance or Reports & BI.'],
        nonDisponible: [
          'The "👁️ View" button on an agent row does not open an individual sheet yet.',
          'There is no agent password reset from this page.',
        ],
      },
      gererClients: {
        titre: 'Registering and finding a client',
        objectif: 'Keep a clean client base.',
        roles: ['Agent', 'Manager', 'Administrator'],
        tags: ['client', 'kyc', 'base', 'registration'],
        contenu: `<p>The page subtitle sums up the situation: number of registered clients, how many are active, and how many have a <strong>pending KYC</strong>.</p>
<h4>Creating a client</h4>
<ol>
  <li><strong>New client</strong>.</li>
  <li><strong>First name</strong>, <strong>Last name</strong>, <strong>Phone</strong> — mandatory.</li>
  <li><strong>Email</strong> and <strong>City</strong> — optional.</li>
  <li><strong>Save the client</strong>.</li>
</ol>
<h4>Finding a client</h4>
<p>Search by name, phone or email, plus two filters: <strong>status</strong> (Active, Inactive, Blocked) and <strong>KYC</strong> (Verified, Pending, Rejected).</p>
<p>The table shows for each one: city, operator, wallet balance, number of transactions, total volume, KYC, status and registration date.</p>`,
        nonDisponible: ['The "View" and "Verify KYC" buttons in the Actions column are not connected yet: KYC status can be consulted but not changed from this page.'],
        conseils: ['The same client entered twice with two different spellings distorts their totals: always search by phone before creating a record.'],
      },
      mouvementsStock: {
        titre: 'Recording a stock inflow or outflow',
        objectif: 'Keep an accurate inventory per branch.',
        roles: ['Manager', 'Administrator'],
        tags: ['stock', 'inventory', 'sim', 'inflow', 'outflow'],
        contenu: `<p>Four figures at the top: products in the catalogue, units in stock, low-stock alerts and total valuation.</p>
<h4>Entering a movement</h4>
<ol>
  <li><strong>📥 Stock in</strong> or <strong>📤 Stock out</strong> (or the same buttons on the product row).</li>
  <li><strong>Product</strong> — mandatory, to be chosen from the catalogue.</li>
  <li><strong>Branch</strong> — mandatory, to be typed by hand: this is the branch identifier.</li>
  <li><strong>Quantity</strong> — mandatory, at least 1.</li>
  <li><strong>Reason</strong> — mandatory: Purchase / receipt, Sale, Return, Breakage / damage, Theft / loss, Transfer or Inventory adjustment.</li>
  <li><strong>Reference</strong> and <strong>Notes</strong> — optional.</li>
  <li><strong>Confirm the movement</strong>.</li>
</ol>
<p>Each product's status is computed on its own against its threshold: <strong>● OK</strong>, <strong>⚠️ Low</strong>, <strong>🔴 Critical</strong>.</p>`,
        avertissements: [
          'The "Branch" field expects the branch IDENTIFIER, not its plain name. Get it from the branch record before entering.',
          'The stock-in and stock-out buttons stay inactive as long as no product exists in the catalogue. Stock-out is blocked if the available quantity is zero.',
        ],
        nonDisponible: [
          'No filter or search on this page: neither by category nor by branch.',
          'The product catalogue cannot be created from this page.',
        ],
      },
      validerPayerCommissions: {
        titre: 'Approving then paying commissions',
        objectif: 'Handle agent pay without making mistakes.',
        roles: ['Manager', 'Administrator'],
        tags: ['commission', 'payment', 'approval', 'agent'],
        contenu: `<p>A commission goes through two steps, in this order: <strong>calculated → approved → paid</strong>. The button offered on each row depends on where it stands.</p>
<ol>
  <li>Choose the <strong>period</strong> from the drop-down list.</li>
  <li>Tick the rows concerned, or use <strong>☑️ Select all</strong>.</li>
  <li>Click <strong>✅ Approve</strong> for calculated commissions.</li>
  <li>Then <strong>💳 Pay</strong> for those that are approved.</li>
  <li>A window summarises the number of rows and the <strong>total amount</strong>. Read it again, then <strong>✅ Confirm</strong>.</li>
</ol>
<h4>The three tabs</h4>
<ul>
  <li><strong>💰 Agent commissions</strong> — the month's work</li>
  <li><strong>📅 Payment history</strong> — what has already been settled</li>
  <li><strong>🎯 Targets</strong> — payment progress, highest commission, breakdown by status</li>
</ul>
<p>The <strong>📥 Export CSV</strong> button exports the list for your accountant.</p>`,
        avertissements: [
          'The summary before confirmation is your last safety net: read the total amount out loud before confirming a bulk payment.',
          'If a "Demonstration data" banner appears, the commissions service is unreachable — do not approve or pay anything while it is there.',
        ],
        nonDisponible: [
          'Commission rates and scales cannot be configured from this page.',
          'The list of periods is hard-coded to months in 2024: it is not yet fed by your real financial years.',
        ],
      },
      lirePerformances: {
        titre: 'Reading the Performance page',
        objectif: 'Compare your agents and track your targets.',
        roles: ['Manager', 'Administrator', 'Supervisor'],
        tags: ['performance', 'ranking', 'target', 'success rate'],
        contenu: `<p>Four indicators at the top: <strong>Total volume</strong>, <strong>Number of transactions</strong>, <strong>Success rate</strong> and <strong>Average ticket</strong> (the average amount of an operation).</p>
<p>A period selector offers <strong>This week</strong>, <strong>This month</strong> or <strong>This quarter</strong>.</p>
<p>Below: volume trends, performance by operator, the <strong>agent ranking</strong> (rank, volume, transactions, success rate, trend), and three target cards.</p>`,
        avertissements: [
          'The trend chart shows the last 7 days whatever period is chosen in the selector. Do not read it as a quarterly chart.',
          'The success-rate target shown (95%) is a fixed reference value, not a target you configured.',
        ],
        nonDisponible: ['No export on this page. To share these figures, go through Reports & BI.'],
      },
      genererRapport: {
        titre: 'Generating a report',
        objectif: 'Produce a document to share.',
        roles: ['Manager', 'Administrator', 'Auditor'],
        tags: ['report', 'generation', 'bi', 'kpi'],
        contenu: `<ol>
  <li>Click <strong>📊 Generate report</strong>.</li>
  <li>Choose the <strong>type</strong>: daily, weekly or monthly.</li>
  <li>Choose the <strong>period</strong>.</li>
  <li>Confirm — the report appears in the <strong>Generated reports</strong> list.</li>
</ol>
<p>The page also shows four indicators (revenue, transactions, new clients, average ticket) and a <strong>Quick overview</strong>: breakdown by operator, top agents, progress towards the target.</p>`,
      },
      exporterRapport: {
        titre: 'Exporting to CSV, XLSX or PDF',
        objectif: 'Get the file in the right format.',
        roles: ['Manager', 'Administrator', 'Auditor'],
        tags: ['export', 'pdf', 'xlsx', 'csv'],
        contenu: `<p>On each row of the <strong>Generated reports</strong> list, three buttons appear once the report is <em>available</em>: <strong>📥 CSV</strong>, <strong>📊 XLSX</strong> and <strong>📄 PDF</strong>.</p>
<p>The <strong>📄 Export PDF</strong> button at the top of the page produces an overview of the current page.</p>
<p>A search field and a filter by type (daily / weekly / monthly) let you find an older report.</p>`,
        avertissements: [
          "A row's CSV and XLSX exports contain the report's BREAKDOWN BY OPERATOR (operator, amount, share in %), not the transaction detail. For line-by-line detail, export from the Transactions page.",
          'The period selector at the top of the page offers hard-coded labels (January 2024, December 2023, Q4 2023): they do not match your current financial year.',
        ],
      },
      lireComptabilite: {
        titre: 'The five accounting tabs',
        objectif: 'Know where to find which statement.',
        roles: ['Administrator', 'Accountant', 'Manager'],
        tags: ['accounting', 'syscohada', 'balance sheet', 'trial balance', 'general ledger'],
        contenu: `<p>Entries are produced automatically from your operations, in the <strong>SYSCOHADA chart of accounts</strong>. You first choose your <strong>financial year</strong> at the top of the page.</p>
<p>Four indicators: <strong>Income (class 7)</strong>, <strong>Expenses (class 6)</strong>, <strong>Net result</strong> and <strong>Cash (class 5)</strong>.</p>
<ul>
  <li><strong>General Ledger</strong> — every entry: date, reference, account, label, debit, credit. A marker indicates whether the entry is <em>Auto</em> (from an operation) or <em>Manual</em>.</li>
  <li><strong>Trial Balance</strong> — a summary per account, with the TOTALS row. A banner confirms whether the balance is <strong>balanced</strong> or not.</li>
  <li><strong>Income Statement</strong> — income against expenses, and the net result for the year.</li>
  <li><strong>Balance Sheet</strong> — ASSETS (fixed assets, stock, receivables, cash) against LIABILITIES (equity, debts).</li>
  <li><strong>Chart of accounts</strong> — the list of accounts used, with their normal balance.</li>
</ul>`,
        conseils: ['If the trial balance shows as unbalanced, do not look in the balance sheet: open the General Ledger and work back through the most recent entries.'],
        avertissements: ['The message "Accounting data unavailable" means the service is not responding. No fallback figures are invented here — that is deliberate.'],
        nonDisponible: [
          'No export on this page, and no manual entry input from the interface.',
          'The TAFIRE, the cash flow statement, the notes and the year-end closing are not available yet.',
        ],
      },
      administrationUtilisateurs: {
        titre: 'Users, roles and the log',
        objectif: 'Check who has access to what, and what has been done.',
        roles: ['Administrator'],
        tags: ['administration', 'users', 'roles', 'audit', 'export'],
        contenu: `<p>The page is restricted to administration roles. Any other role will see an <em>Access restricted</em> message and an empty page.</p>
<p>Four figures at the top: total users, configured roles, actions audited over 24 h, audit alerts.</p>
<ul>
  <li><strong>👥 Users</strong> — who, which role, last sign-in, status</li>
  <li><strong>🔐 Roles &amp; permissions</strong> — one card per role, with the number of users and the list of its permissions</li>
  <li><strong>📋 Recent audit log</strong> — date, action, resource, user, IP address</li>
  <li><strong>🚨 Security alerts</strong> — this section only appears if there is genuinely something to report</li>
</ul>
<p>The <strong>📥 Export audit</strong> and <strong>📥 Export CSV</strong> buttons produce the same file: the audit log in CSV format.</p>`,
        nonDisponible: [
          'The only export format offered is CSV.',
          'No system health monitoring, no latency or server load: this information has no real source and was therefore not displayed.',
        ],
      },
      comprendreAlertesAudit: {
        titre: 'What an alert means (and does not mean)',
        objectif: 'Interpret a flag correctly.',
        roles: ['Administrator', 'Auditor'],
        tags: ['audit', 'alert', 'security', 'fraud', 'monitoring'],
        contenu: `<p>The most important point on this page: <strong>there is no fraud detection engine in GESTMONEY.</strong> Nothing here computes a risk score or a fraud probability, and nothing judges an amount.</p>
<p>What the page actually does: it counts actions per user over the last hour, and flags accounts whose volume exceeds a fixed threshold. That is all. The alert type is in fact called "excessive activity" — not "fraud".</p>
<h4>How to react to an alert</h4>
<ol>
  <li>Read the number of actions and the period.</li>
  <li>Ask yourself whether it is explainable: market day, end of month, training, catching up on data entry.</li>
  <li>If so, there is nothing to do.</li>
  <li>Otherwise, open the audit log in Administration to see WHAT was done, not just how much.</li>
</ol>
<p>The page also shows the <strong>security events of the last 7 days</strong> and the <strong>audited financial movements</strong>. The <strong>🔄 Refresh</strong> button reloads everything.</p>`,
        avertissements: ['An alert is NOT an accusation. A very productive agent on a busy day will trigger exactly the same flag as abnormal behaviour. Never confront anyone on the basis of this page alone.'],
        nonDisponible: [
          'No fraud scoring, no amount analysis, no predictive model.',
          'The "Failed sign-ins" and "Locked accounts" counters may stay at zero: the log does not yet distinguish these events.',
          'No export on this page.',
        ],
      },
      payerAbonnement: {
        titre: 'Paying your subscription',
        objectif: 'Pay and have the payment recorded.',
        roles: ['Administrator'],
        tags: ['subscription', 'payment', 'prepaid code', 'licence', 'trial'],
        contenu: `<p>Your account starts with a <strong>14-day trial</strong>. When it ends, a <strong>7-day grace period</strong> gives you time to settle up before access is restricted.</p>
<h4>The payment method active today</h4>
<p>As of today, <strong>only the prepaid code is operational</strong>. The other methods (manual mobile money, bank transfer, cash at a branch, banking gateway…) appear in the list as your administrator configures them; until they are, they are not offered.</p>
<h4>Using a prepaid code</h4>
<ol>
  <li>Open <strong>Subscription &amp; payment</strong>.</li>
  <li>Choose the <strong>🎟️ Prepaid code</strong> method.</li>
  <li>Enter your code and click <strong>Use this code</strong>.</li>
  <li>The payment then appears in <strong>🧾 My payments</strong> (date, reference, amount, channel, status).</li>
</ol>
<p>For a manual payment method, the page shows the <strong>payment instructions</strong>, then you create the payment and send your <strong>proof of payment</strong>. An administrator checks it before approval — so it is not instantaneous.</p>`,
        avertissements: [
          'GESTMONEY will NEVER ask you for your Mobile Money PIN or your password. Anyone asking for it in the name of GESTMONEY is trying to defraud you. This reminder is permanently displayed at the top of the page.',
          'A "Test" badge next to a payment method means it is being configured: a payment made through that channel does not count.',
        ],
      },
      gererNotifications: {
        titre: 'Sorting and handling your notifications',
        objectif: 'Not to miss an important alert.',
        roles: ['Everyone'],
        tags: ['notification', 'alert', 'unread'],
        contenu: `<p>Five filters at the top: <strong>All</strong>, <strong>Unread</strong> (with its counter), <strong>Alerts</strong>, <strong>Transactions</strong>, <strong>System</strong>.</p>
<p>On each notification, on hover: <strong>✓ Mark as read</strong> and <strong>🗑 Delete</strong>. The <strong>Mark all as read</strong> button at the top empties the counter in one go; it is greyed out if there is nothing to read.</p>
<p>The list is paginated by 6.</p>`,
        avertissements: ['"Mark all as read" does not ask for confirmation. Go through the list before clicking.'],
        nonDisponible: [
          'The "Settings" button on this page is not connected yet. Notification preferences are in Settings → Notifications tab.',
          'Float and AI notifications have no dedicated filter: find them via "All".',
        ],
      },
      ongletsParametres: {
        titre: 'The four settings tabs',
        objectif: 'Know what is configured where.',
        roles: ['Manager', 'Administrator'],
        tags: ['settings', 'security', '2fa', 'theme', 'language'],
        contenu: `<ul>
  <li><strong>Profile</strong> — photo, first name, last name, email, phone, language (French / English) and time zone (Abidjan, Dakar, Lagos, Nairobi).</li>
  <li><strong>Security</strong> — password change, two-factor authentication, and the list of your active sessions.</li>
  <li><strong>Notifications</strong> — a table crossing five categories (Transactions, Float, Commissions, Fraud, System) with four channels (Email, SMS, Push, In-app).</li>
  <li><strong>Appearance</strong> — theme (light, dark, system), display density and language.</li>
</ul>
<p>At the bottom of the page, the <strong>Getting started guide</strong> block and its <strong>Restart the guide</strong> button bring back the new-account welcome.</p>`,
        avertissements: ['The time zone determines the time stamped on all your operations. Set it before your first day of activity, not after.'],
        nonDisponible: ['This page is still being connected: the settings you make here are not saved on the server and are lost on reload. Two-factor authentication and the session list are shown as a preview only.'],
      },
      monProfil: {
        titre: 'Viewing your profile',
        objectif: 'Check your information and review your activity.',
        roles: ['Everyone'],
        tags: ['profile', 'account', 'activity', 'sessions'],
        contenu: `<p>The page shows your identity card (initials, role, status, email, registration date), three figures — <strong>Transactions created</strong>, <strong>Sessions</strong>, <strong>Last sign-in</strong> — and the <strong>history of your recent activity</strong> (action, detail, date).</p>
<p>The <strong>Edit profile</strong> button opens a window with first name, last name, email and phone.</p>`,
        conseils: ['The activity history is the simplest way to check whether someone else has used your account: a sign-in at a time when you were not working should alert you.'],
        nonDisponible: [
          'The "Edit profile" window does not save your changes yet.',
          'Neither two-factor authentication nor the password change is here: they are in Settings → Security.',
        ],
      },
      ouChercher: {
        titre: 'Where to look for an answer',
        objectif: 'Go to the right place first time.',
        roles: ['Everyone'],
        tags: ['help', 'faq', 'support', 'ticket'],
        contenu: `<ol>
  <li><strong>This guide</strong> — how to use a module, step by step.</li>
  <li><strong>FAQ</strong> — 100 short questions sorted into 12 categories, with search.</li>
  <li><strong>Help centre</strong> — the quick links and the service status.</li>
  <li><strong>Support</strong> — when none of that answers: open a ticket.</li>
</ol>
<h4>Opening a ticket</h4>
<ol>
  <li><strong>New ticket</strong>.</li>
  <li><strong>Problem title</strong> — mandatory.</li>
  <li><strong>Category</strong>: Technical problem, Transaction, Float, Balance, Agent, Access, Billing, Other.</li>
  <li><strong>Priority</strong>: Low, Normal, High, Urgent.</li>
  <li><strong>Detailed description</strong> — mandatory. Give the operation reference, the time and the exact error message.</li>
</ol>`,
        conseils: ['A ticket containing a transaction reference and a precise time is handled far faster than one that says "it does not work".'],
        liens: ['FAQ — 100 questions', 'Help centre', 'Open a ticket'],
      },
      sara: {
        titre: 'SARA: what you need to know',
        objectif: 'Do not rely on the assistant for now.',
        roles: ['Everyone'],
        tags: ['sara', 'ai', 'assistant'],
        contenu: `<p><strong>SARA is not in service.</strong> The assistant button is present in the interface, but no engine is connected to it: it cannot answer any question.</p>
<p>In the meantime, this guide and the FAQ cover the essentials, and support takes over for the rest.</p>`,
        nonDisponible: ['The SARA assistant is offline. Do not count on it to get an answer.'],
      },
      ecransSuperadmin: {
        titre: 'The Super Admin screens',
        objectif: 'Know what is real and what is not.',
        roles: ['Super admin'],
        tags: ['superadmin', 'mockup', 'prospects', 'licences'],
        contenu: `<p>If your account is a <strong>Super admin</strong> account, you see an extra section in the menu. Eight of these screens are currently <strong>presentation mockups</strong>: prospects, quotes, payments, licences, analytics, emails, SARA and demonstrations.</p>
<p>They display example figures, hard-coded, that come from no database. They exist to show the shape these modules will take, not to work with.</p>`,
        avertissements: ['Do not make any decision based on the figures shown on these eight screens, and do not enter anything important there: nothing is saved.'],
      },
    },
  },

  commandPalette: {
    placeholder: 'Search a page, an action…',
    noResults: 'No results for',
    navigate: 'Navigate',
    open: 'Open',
    close: 'Close',
    category: 'Navigation',
    descriptions: {
      dashboard:    'Real-time overview',
      transactions: 'Deposits, withdrawals, transfers',
      agents:       'Field agent management',
      agences:      'Points of sale and branches',
      clients:      'Client base and loyalty',
      float:        'Balances and restocking',
      caisse:       'Cash journal and vault',
      commissions:  'Agent plans and payments',
      performances: 'Operator comparisons',
      rapports:     'Export and analysis',
      notifications:'Alerts and system messages',
      profile:      'Personal information',
      settings:     'Account configuration',
    },
  },

  caisse: {
    title: 'Cash Register',
    subtitle: "Cash journal and today's movements",
    manualEntry: 'Manual entry',

    stats: {
      soldeActuel: 'Current balance',
      entreesJour: "Today's inflows",
      sortiesJour: "Today's outflows",
      ecart: 'Variance',
      equilibree: 'Cash balanced',
      excedent: 'Surplus',
      deficit: 'Shortfall',
    },

    flux: {
      title: "Today's flows",
      ecrituresSuffix: 'entries',
      entrees: 'Inflows',
      sorties: 'Outflows',
    },

    journalTitle: 'Cash journal — Today',

    columns: {
      date: 'Date / Time',
      reference: 'Reference',
      libelle: 'Label',
      categorie: 'Category',
      agent: 'Agent',
      sens: 'Direction',
      montant: 'Amount',
      soldeApres: 'Balance after',
    },

    sens: {
      entree: 'Inflow',
      sortie: 'Outflow',
    },

    empty: 'No entries',

    categories: {
      depot: 'Deposit',
      retrait: 'Withdrawal',
      cash_in: 'Cash In',
      cash_out: 'Cash Out',
      reappro: 'Top-up',
      commission: 'Commission',
      approvisionnement: 'Funding',
      frais: 'Fees',
    },

    modal: {
      typeLabel: 'Type *',
      libelleLabel: 'Label *',
      libellePlaceholder: 'Description of the entry',
      montantLabel: 'Amount (FCFA) *',
      categorieLabel: 'Category',
      requiredError: 'A label and a valid amount are required.',
      success: 'Entry recorded successfully.',
      saveError: 'Could not save. Please try again.',
    },
  },

  agences: {
    breadcrumb: 'Branches',
    title: '🏪 Branch management',
    subtitleLoading: 'Loading network…',
    subtitleNetwork: 'Network of',
    subtitleActiveAgencies: 'active branch(es)',
    subtitleCities: 'cities covered',
    newAgency: '+ New branch',

    stats: {
      activeAgencies: 'Active branches',
      ofTotalPrefix: 'out of',
      ofTotalSuffix: 'in total',
      totalAgents: 'Total agents',
      onlineNow: 'online now',
      citiesCovered: 'Cities covered',
      topPrefix: 'Top:',
      inactiveAgencies: 'Inactive branches',
      inactiveSub: 'to reactivate or close',
    },

    searchPlaceholder: 'Search a branch (name, city, code)…',
    foundSuffix: 'branch(es) found',
    loadingAgencies: 'Loading branches…',
    emptyAgencies: 'No branches found',

    pillActive: '● Active',
    pillInactive: '● Inactive',

    metrics: {
      agents: 'Agents',
      online: 'Online',
      code: 'Branch code',
      opening: 'Opened',
      respPrefix: 'Mgr.',
    },

    actions: {
      viewDetails: '👁️ View details',
      deactivate: '⏸️ Deactivate',
      activate: '▶️ Activate',
    },

    map: {
      title: '🗺️ Network coverage',
      pointsSuffix: 'location(s)',
      noCity: 'No city recorded',
      agencesSuffix: 'branch(es)',
    },

    csv: {
      nom: 'Name',
      code: 'Code',
      ville: 'City',
      adresse: 'Address',
      telephone: 'Phone',
      responsable: 'Manager',
      agents: 'Agents',
      agentsOnline: 'Agents online',
      statut: 'Status',
      dateCreation: 'Created on',
      active: 'Active',
      inactive: 'Inactive',
    },

    modal: {
      title: 'New branch',
      nomLabel: 'Branch name *',
      nomPlaceholder: 'Downtown branch',
      codeLabel: 'Code *',
      codePlaceholder: 'AG-XXX-001',
      villeLabel: 'City *',
      villePlaceholder: 'Abidjan',
      telephoneLabel: 'Phone',
      telephonePlaceholder: '0701000000',
      adresseLabel: 'Address',
      adressePlaceholder: 'Street, district',
      responsableLabel: 'Manager',
      responsablePlaceholder: 'Manager name',
      requiredFields: 'Please fill in the required fields (name, code, city).',
      createdPrefix: 'Branch',
      createdSuffix: 'created successfully.',
      submit: 'Create branch',
    },
  },

  commissions: {
    breadcrumb: 'Commissions',
    title: '💰 Commissions',
    subtitle: 'Calculation, approval and payment of agent commissions',
    exportCsv: '📥 Export CSV',
    processSelection: '💳 Process selection',

    demoTitle: 'Demo data',
    demoBody: '— the commissions service is unreachable. The amounts shown are fictitious and must not be used to approve or pay anything.',

    stats: {
      total: 'Total commissions',
      commissionsSuffix: 'commission(s)',
      paid: 'Paid',
      pctOfTotalSuffix: 'of the total',
      validated: 'Approved (to pay)',
      pendingValidation: 'Awaiting approval',
      agentsConcerned: 'Agents involved',
      allPeriods: 'All periods',
      periodPrefix: 'Period',
    },

    tabs: {
      agents: '💰 Agent commissions',
      historique: '📅 Payment history',
      objectifs: '🎯 Targets',
    },

    periodOptions: {
      all: 'All periods',
      m202401: 'January 2024',
      m202402: 'February 2024',
      m202403: 'March 2024',
    },

    toolbar: {
      selectedSuffix: 'selected',
      selectAll: '☑️ Select all',
      validate: '✅ Approve',
      pay: '💳 Pay',
      deselect: 'Clear selection',
      selectAllAria: 'Select all',
      selectRowAria: 'Select',
    },

    columns: {
      agent: 'Agent',
      agence: 'Branch',
      periode: 'Period',
      transactions: 'Transactions',
      volTransactions: 'Tx volume',
      taux: 'Rate',
      commission: 'Commission',
      datePaiement: 'Payment date',
      statut: 'Status',
      actions: 'Actions',
      montant: 'Amount',
    },

    table: {
      loading: 'Loading commissions…',
      empty: 'No commissions found for this period',
      emptyHistory: 'No commission payments recorded',
      validate: '✅ Approve',
      pay: '💳 Pay',
    },

    pills: {
      pending: '⏳ Pending',
      validated: '🔵 Approved',
      paid: '✅ Paid',
    },

    statutLabels: {
      calculee: 'Calculated',
      validee: 'Approved',
      payee: 'Paid',
    },

    objectifs: {
      progressTitle: '🎯 Payment progress',
      progressSub: 'Share of commissions already paid',
      topTitle: '🥇 Highest commission',
      volumeSuffix: 'in volume',
      repartitionTitle: '📊 Breakdown by status',
      pendingLabel: '⏳ Pending',
      validatedLabel: '🔵 Approved',
      paidLabel: '✅ Paid',
    },

    modal: {
      title: '💳 Confirmation',
      close: 'Close',
      intro: 'You are about to process the selected commissions.',
      rowSelected: 'Commissions selected',
      rowToValidate: 'To approve',
      rowToPay: 'To mark as paid',
      rowTotal: 'Total amount selected',
      processing: 'Processing…',
      confirm: '✅ Confirm',
    },

    messages: {
      validatedSuffix: 'commission(s) approved.',
      paidSuffix: 'commission(s) marked as paid.',
    },

    csv: {
      agent: 'Agent',
      agence: 'Branch',
      periode: 'Period',
      transactions: 'Transactions',
      montantTransactions: 'Transaction amount (FCFA)',
      taux: 'Rate (%)',
      commission: 'Commission (FCFA)',
      statut: 'Status',
      datePaiement: 'Payment date',
    },
  },

  performances: {
    title: 'Performance',
    subtitle: 'Key indicators for your Mobile Money network',
    periodPlaceholder: 'Period',

    periods: {
      semaine: 'This week',
      mois: 'This month',
      trimestre: 'This quarter',
    },

    periodBadges: {
      semaine: 'Week',
      mois: 'Month',
      trimestre: 'Quarter',
    },

    kpi: {
      volumeTotal: 'Total volume',
      nbTransactions: 'Transaction count',
      tauxSucces: 'Success rate',
      objectif95: 'Target 95%',
      ticketMoyen: 'Average ticket',
    },

    evolution: {
      title: 'Volume trend',
      sub: 'Last 7 days',
      txSuffix: 'tx',
    },

    operatorTitle: 'Performance by operator',

    ranking: {
      title: 'Agent ranking',
      colRang: 'Rank',
      colAgent: 'Agent',
      colVolume: 'Volume',
      colTransactions: 'Transactions',
      colTauxSucces: 'Success rate',
      colEvolution: 'Change',
      ranksSuffix: 'places',
    },

    objectifs: {
      volume: 'Monthly volume target',
      transactions: 'Transaction count target',
      tauxSucces: 'Success rate target',
      reached: 'Target reached ✓',
      onTrack: 'On track',
      attention: 'Needs attention',
      late: 'Behind',
    },
  },

  stock: {
    breadcrumb: 'Stock & Inventory',
    title: '📦 Stock & Inventory',
    subtitle: 'SIM cards, terminals, accessories and consumables',
    refresh: '🔄 Refresh',
    sortieBtn: '📤 Stock out',
    entreeBtn: '📥 Stock in',

    errorTitle: 'Stock data unavailable.',
    errorBody: 'The inventory service did not respond. Use "Refresh" to try again.',

    stats: {
      produits: 'Catalogue products',
      produitsSub: 'Active references',
      unites: 'Units in stock',
      lignesSuffix: 'inventory line(s)',
      alertes: 'Low stock alerts',
      critiquesSuffix: 'critical',
      valorisation: 'Stock valuation',
      valorisationSub: 'Across all branches',
    },

    alerts: {
      alertesSuffix: 'low stock alert(s)',
      dontPrefix: 'including',
      agencePrefix: 'branch',
      othersSuffix: 'more',
    },

    inventaire: {
      sectionTitle: '📋 Product inventory',
      colProduit: 'Product',
      colCategorie: 'Category',
      colAgence: 'Branch',
      colNiveau: 'Stock level',
      colSeuil: 'Alert threshold',
      colValeurUnitaire: 'Unit price',
      colValorisation: 'Valuation',
      colStatut: 'Status',
      colActions: 'Actions',
      loading: 'Loading inventory…',
      error: 'Could not load the inventory.',
      empty: 'No products in stock',
      unknownProduct: 'Unknown product',
      unitDefault: 'u.',
      reservedSuffix: 'reserved',
      totalSuffix: 'in total',
      actionEntree: '📥 In',
      actionSortie: '📤 Out',
    },

    niveaux: {
      ok: '● OK',
      bas: '⚠️ Low',
      critique: '🔴 Critical',
    },

    categories: {
      SIM: 'SIM',
      TERMINAL: 'Terminal',
      ACCESSOIRE: 'Accessory',
      CONSOMMABLE: 'Consumable',
    },

    mouvements: {
      sectionTitle: '🔁 Stock movements',
      colDate: 'Date',
      colProduit: 'Product',
      colAgence: 'Branch',
      colType: 'Type',
      colQuantite: 'Quantity',
      colMotif: 'Reason',
      colReference: 'Reference',
      colNotes: 'Notes',
      loading: 'Loading movements…',
      error: 'Could not load the movements.',
      empty: 'No movements recorded',
    },

    typeMouvement: {
      IN: 'Inbound',
      OUT: 'Outbound',
      TRANSFER: 'Transfer',
      ADJUSTMENT: 'Adjustment',
    },

    motifs: {
      PURCHASE: 'Purchase / receipt',
      SALE: 'Sale',
      RETURN: 'Return',
      DAMAGE: 'Breakage / damage',
      THEFT: 'Theft / loss',
      TRANSFER: 'Transfer',
      INVENTORY: 'Inventory adjustment',
    },

    modal: {
      titleIn: '📥 Stock in',
      titleOut: '📤 Stock out',
      close: 'Close',
      produitLabel: 'Product',
      noProduct: 'No products in the catalogue.',
      agenceLabel: 'Branch (identifier)',
      quantiteLabel: 'Quantity',
      motifLabel: 'Reason',
      referenceLabel: 'Reference',
      notesLabel: 'Notes',
      errProduit: 'Product is required.',
      errAgence: 'Branch identifier is required.',
      errQuantite: 'Invalid quantity (integer ≥ 1).',
      success: 'Movement recorded.',
      errSave: 'Could not record the movement.',
      saving: 'Saving…',
      submit: 'Confirm movement',
    },
  },

  profile: {
    title: 'My profile',
    subtitle: 'View and manage your personal information',
    edit: 'Edit profile',
    active: 'Active',
    notProvided: 'Not provided',
    memberSince: 'Member since {date}',
    defaultUser: 'User',
    statTransactions: 'Transactions created',
    statTransactionsDesc: 'Total since the beginning',
    statSessions: 'Sessions',
    statSessionsDesc: 'Total logins',
    statLastLogin: 'Last login',
    activityTitle: 'Recent activity history',
    lastActions: 'last {n} actions',
    colAction: 'Action',
    colDetail: 'Details',
    colDate: 'Date',
    noActivity: 'No activity recorded',
    modalTitle: 'Edit profile',
    close: 'Close',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    save: 'Save',
    cancel: 'Cancel',
    roles: {
      super_admin: 'Super Administrator',
      SUPER_ADMIN: 'Super Administrator',
      admin: 'Administrator',
      ADMIN: 'Administrator',
      NETWORK_ADMIN: 'Network Admin',
      superviseur: 'Supervisor',
      SUPERVISEUR: 'Supervisor',
      AGENCY_MANAGER: 'Branch Manager',
      agent: 'Agent',
      AGENT: 'Agent',
      ACCOUNTANT: 'Accountant',
      AUDITOR: 'Auditor',
      caissier: 'Cashier',
      CAISSIER: 'Cashier',
      VIEWER: 'Viewer',
    },
  },

  faq: {
    title: 'FAQ — Frequently asked questions',
    subtitle: '{n} real questions organised into {c} categories',
    backToHelp: 'Help Centre',
    fullGuide: 'Full guide',
    searchPlaceholder: 'Search the 100 FAQs… (e.g. password, float, export, commission)',
    clear: 'Clear',
    all: 'All',
    resultOne: '{n} result',
    resultMany: '{n} results',
    inCategory: 'in "{cat}"',
    forQuery: 'for "{q}"',
    questionOne: '{n} question',
    questionMany: '{n} questions',
    empty: 'No FAQ found for this search.',
    openTicketLink: 'Open a support ticket →',
    ctaTitle: 'Your question is not here?',
    ctaSubtitle: 'Check the full guide or open a ticket — our team replies within 4h.',
    ctaTicket: 'Open a ticket',
    rolesAll: 'All',
    categories: {
      general: 'General',
      connexionSecurite: 'Login / Security',
      utilisateursPermissions: 'Users / Permissions',
      parametres: 'Settings',
      transactions: 'Transactions',
      agentsAgences: 'Agents / Branches',
      floatCommissions: 'Float / Commissions',
      rapportsExports: 'Reports / Exports',
      abonnementsLicences: 'Subscriptions / Licences',
      supportTickets: 'Support / Tickets',
      saraIa: 'SARA AI',
      sauvegarde: 'Backup',
    },
    modules: {
      general: 'General',
      parametres: 'Settings',
      support: 'Support',
      securite: 'Security',
      transactions: 'Transactions',
      authentification: 'Authentication',
      profil: 'Profile',
      agents: 'Agents',
      permissions: 'Permissions',
      operateurs: 'Operators',
      parametresSociete: 'Company settings',
      notifications: 'Notifications',
      commissions: 'Commissions',
      api: 'API',
      agences: 'Branches',
      performances: 'Performance',
      float: 'Float',
      exports: 'Exports',
      rapports: 'Reports',
      abonnements: 'Subscriptions',
      saraIa: 'SARA AI',
    },
    items: {
      g1: {
        question: 'What is GESTMONEY?',
        reponse: 'GESTMONEY is a SaaS ERP specialised in Mobile Money, designed for sub-Saharan Africa and the OHADA zone. It allows operators, agent networks and financial institutions to manage Mobile Money transactions (deposits, withdrawals, transfers), float, agents, commissions and reports from a single centralised interface accessible on browser and mobile.',
        motsCles: ['gestmoney', 'overview', 'erp', 'mobile money', 'saas', 'africa'],
      },
      g2: {
        question: 'Which browsers are supported?',
        reponse: 'GESTMONEY works on all modern browsers: Chrome (recommended), Firefox, Edge, Safari and Opera. The minimum recommended version is Chrome 90+. The application is also available as a PWA (Progressive Web App) that can be installed on your Android phone or iPhone without going through an app store.',
        motsCles: ['browser', 'chrome', 'firefox', 'mobile', 'pwa', 'compatibility'],
      },
      g3: {
        question: 'Is GESTMONEY available in English?',
        reponse: 'Yes. GESTMONEY is available in French (default language) and in English. To change the language: go to Settings → General → Language, select "English" and save. The interface updates immediately. The SARA AI assistant also replies in both languages.',
        motsCles: ['language', 'english', 'french', 'internationalisation', 'i18n'],
      },
      g4: {
        question: 'How do I access GESTMONEY on mobile?',
        reponse: 'GESTMONEY is accessible from your phone\'s mobile browser (Chrome, Safari). For the best experience, install it as a PWA: on Chrome Android, tap the 3-dot menu → "Add to Home screen". On iPhone Safari, tap Share → "Add to Home Screen". The application then behaves like a native app.',
        motsCles: ['mobile', 'pwa', 'phone', 'application', 'android', 'iphone'],
      },
      g5: {
        question: 'What is GESTMONEY\'s uptime?',
        reponse: 'GESTMONEY guarantees 99.5% availability per month (SLA). The service status page is accessible from the Help Centre. Scheduled maintenance is announced at least 48h in advance by email and by in-app notification. For incidents, support can be reached at support@ibigsoft.com.',
        motsCles: ['uptime', 'availability', 'sla', 'maintenance', 'incident'],
      },
      g6: {
        question: 'How do I contact IBIG Soft support?',
        reponse: 'Several channels are available: (1) A support ticket inside the application (Support → New ticket) — recommended, as it provides full tracking. (2) Email: support@ibigsoft.com — reply within 4h on business days. (3) WhatsApp Business for emergencies (available on the Enterprise plan). The SARA AI assistant can also answer most of your questions 24/7.',
        motsCles: ['support', 'contact', 'email', 'ticket', 'ibig soft', 'help'],
      },
      g7: {
        question: 'Is the data secure and confidential?',
        reponse: 'Yes. GESTMONEY applies security best practices: TLS 1.3 encryption in transit, AES-256 encryption at rest, strict multi-tenant isolation (your data is inaccessible to other customers), logging of every action (audit log), and GDPR/OHADA compliance. Servers are hosted in ISO 27001 certified datacentres.',
        motsCles: ['security', 'data', 'confidentiality', 'encryption', 'gdpr', 'compliance'],
      },
      g8: {
        question: 'How do I update GESTMONEY?',
        reponse: 'As GESTMONEY is a SaaS product, updates are automatic and transparent. You always get the latest version with no action required on your part. New features are announced in the "What\'s new" section of the Help Centre and by email. No installation or maintenance is required on your side.',
        motsCles: ['update', 'version', 'saas', 'automatic', 'what\'s new'],
      },
      g9: {
        question: 'Can I use GESTMONEY for several companies?',
        reponse: 'GESTMONEY uses a multi-tenant architecture. Each company gets an isolated workspace (tenant) with its own data, agents and configuration. If you manage several entities, each company must have its own subscription. A SUPER_ADMIN can access the SuperAdmin console to oversee all tenants from a single unified view.',
        motsCles: ['multi-tenant', 'several companies', 'super admin', 'entities'],
      },
      g10: {
        question: 'Which Mobile Money operators are supported?',
        reponse: 'GESTMONEY natively supports: Orange Money (CI, SN, CM, ML, BF, GN), Wave (SN, CI), MTN Mobile Money (CI, GH, CM, UG), Moov Money (CI, BF, TG, BJ), Airtel Money (UG, KE, TZ, NG), M-Pesa (KE, TZ, GH). Any operator with a REST API can be integrated in custom mode. Contact support for bespoke integrations.',
        motsCles: ['operator', 'orange money', 'wave', 'mtn', 'moov', 'airtel', 'mpesa'],
      },
      cs1: {
        question: 'How do I reset a forgotten password?',
        reponse: 'On the login page, click "Forgot password?". Enter your email address and click "Send link". You will receive an email containing a reset link valid for 1 hour. Click that link, choose a new password (minimum 12 characters, with uppercase letters, digits and symbols), then log back in with your new credentials.',
        motsCles: ['password', 'forgotten', 'reset', 'email', 'login'],
      },
      cs2: {
        question: 'How do I enable two-factor authentication (2FA)?',
        reponse: 'Go to Settings → Security → Two-factor authentication, then click "Enable 2FA". Scan the QR code with an authenticator app (Google Authenticator, Authy or Microsoft Authenticator). Enter the 6-digit code shown by the app to confirm activation. On every future login you will need to enter this code in addition to your password. Be sure to keep your backup codes safe.',
        motsCles: ['2fa', 'two-factor authentication', 'totp', 'google authenticator', 'security'],
      },
      cs3: {
        question: 'My session has expired, what should I do?',
        reponse: 'GESTMONEY sessions expire after 8 hours of inactivity as a security measure. Simply log back in with your credentials. If you have enabled 2FA, you will also need to enter your code. To keep your session alive, make sure you stay active in the application. On shared workstations, we recommend logging out manually after each use.',
        motsCles: ['session', 'expired', 'logout', 'reconnection', 'inactivity'],
      },
      cs4: {
        question: 'How do I change my login email address?',
        reponse: 'To change your email: Settings → My profile → Personal information → Change email. Enter your new email and your current password to confirm. A verification email is sent to the new address. Click the verification link to complete the change. The old address can no longer be used once confirmed.',
        motsCles: ['email', 'address', 'edit', 'change', 'profile'],
      },
      cs5: {
        question: 'My account is locked, what should I do?',
        reponse: 'An account is locked after 5 consecutive failed login attempts (anti-brute-force protection). It is unlocked automatically after 30 minutes. For immediate unlocking: contact your GESTMONEY administrator, who can unlock the account from Settings → Users → [your account] → Actions → Unlock. In an emergency, contact support@ibigsoft.com.',
        motsCles: ['locked account', 'attempts', 'unlock', 'brute force', 'admin'],
      },
      cs6: {
        question: 'How do I change my password (without having forgotten it)?',
        reponse: 'Go to Settings → Security → Change password. Enter your current password, then enter and confirm the new password. The new password must contain at least 12 characters, including at least one uppercase letter, one digit and one special symbol. Click "Save". Your current session continues without interruption.',
        motsCles: ['password', 'change', 'edit', 'security', 'settings'],
      },
      cs7: {
        question: 'Can I log in from several browsers or devices at the same time?',
        reponse: 'Yes, GESTMONEY allows simultaneous sessions on several devices. However, for the ADMIN and MANAGER roles, an email alert is sent when a login occurs from a new device. You can review and revoke active sessions in Settings → Security → Active sessions. We recommend never sharing your credentials with anyone else.',
        motsCles: ['multi-device', 'sessions', 'browsers', 'simultaneous', 'login'],
      },
      cs8: {
        question: 'How do I disable 2FA if I have lost my phone?',
        reponse: 'If you have lost your phone and can no longer access your authenticator app, use one of your backup codes (provided when you enabled 2FA). On the login page, after your email and password, click "Use a backup code". If you no longer have those codes, contact support@ibigsoft.com urgently with proof of identity.',
        motsCles: ['2fa', 'lost phone', 'backup codes', 'disable', 'recovery'],
      },
      cs9: {
        question: 'How do I reset an agent\'s password?',
        reponse: 'A MANAGER or ADMIN can reset an agent\'s password from: Agents → [Agent name] → Actions → Reset password. An email is automatically sent to the agent with a reset link valid for 24 hours. The agent will have to set a new password at their next login. It is not possible to view an agent\'s current password (it is stored as a hash).',
        motsCles: ['agent password', 'reset', 'manager', 'email'],
      },
      cs10: {
        question: 'How do I review the audit log of logins and actions?',
        reponse: 'The audit log is available to the ADMIN and AUDITOR roles under Settings → Audit log. It lists every action performed in the application: logins, transactions created, settings changes, password resets, with date, time, user and IP address. This log is immutable and can be exported to CSV for archiving.',
        motsCles: ['audit log', 'logs', 'action history', 'logins', 'traceability'],
      },
      up1: {
        question: 'What is the difference between an AGENT and a MANAGER?',
        reponse: 'An AGENT can only record transactions (deposits, withdrawals, transfers) and view their own performance. A MANAGER has broader access: they can approve/reject pending transactions, add and manage agents, view reports for the whole network, configure commissions and export data. A MANAGER can also reset agents\' passwords.',
        motsCles: ['agent', 'manager', 'difference', 'roles', 'permissions', 'rights'],
      },
      up2: {
        question: 'How do I add a new user in GESTMONEY?',
        reponse: 'To add a user: Agents → Add an agent (for a field agent/supervisor) or Settings → Users → Invite a user (for a manager/admin/auditor). Fill in the first name, last name, email and role. GESTMONEY automatically sends an invitation email with temporary credentials. The user must change their password at first login.',
        motsCles: ['add user', 'invitation', 'create account', 'new agent'],
      },
      up3: {
        question: 'How do I change a user\'s role?',
        reponse: 'To change a user\'s role (requires the ADMIN role): Settings → Users → [User name] → Edit → Role. Select the new role and save. The change takes effect immediately: if the user is logged in, their rights change from their next action onwards. Note: an ADMIN cannot change another ADMIN\'s role without going through a SUPER_ADMIN.',
        motsCles: ['role', 'edit', 'change', 'permissions', 'rights', 'admin'],
      },
      up4: {
        question: 'How do I deactivate the account of an agent who has left the company?',
        reponse: 'To deactivate an account without deleting it (data and history are retained): Agents → [Agent name] → Actions → Deactivate account. The agent will no longer be able to log in. Their past transactions remain visible in reports. If you want to reactivate the account later: same menu → Reactivate. Deactivation is recommended over deletion in order to preserve the audit trail.',
        motsCles: ['deactivate', 'agent account', 'leaving', 'departure', 'deactivation'],
      },
      up5: {
        question: 'Can an agent see other agents\' transactions?',
        reponse: 'No. An AGENT only sees their own transactions and their own performance. They cannot access other agents\' data or network-wide reports. A branch SUPERVISOR can see the transactions of the agents in their branch. A MANAGER can see every transaction in the network. An AUDITOR has read-only visibility over all data.',
        motsCles: ['agent', 'visibility', 'other transactions', 'isolation', 'permissions'],
      },
      up6: {
        question: 'What is the AUDITOR role and when should it be used?',
        reponse: 'AUDITOR is a read-only role designed for internal controllers, chartered accountants or external auditors. It can view all transactions, reports, audit logs and network data without being able to modify anything. It is the ideal role for giving an audit firm or your compliance department view access with no risk of accidental changes.',
        motsCles: ['auditor', 'audit', 'read-only', 'control', 'compliance'],
      },
      up7: {
        question: 'Can the transaction amounts an agent may process be capped?',
        reponse: 'Yes. An ADMIN can set transaction limits per agent or per branch from: Agents → [Agent name] → Settings → Limits. You can define a maximum amount per transaction, a daily cap and a monthly cap. Transactions exceeding these limits are automatically blocked and flagged to the supervisor.',
        motsCles: ['limit', 'cap', 'maximum amount', 'agent', 'restriction'],
      },
      up8: {
        question: 'How do I assign an agent to a specific branch?',
        reponse: 'When creating an agent, you choose the branch they are attached to. To change an existing agent\'s branch: Agents → [Agent name] → Edit → Branch. Select the new branch and save. An agent can be attached to only one branch at a time. The branch transfer is recorded in the audit log.',
        motsCles: ['branch', 'attach', 'agent', 'transfer', 'point of sale'],
      },
      up9: {
        question: 'What is the difference between a SUPERVISOR and a MANAGER?',
        reponse: 'A SUPERVISOR oversees one or more specific branches: they see the transactions and agents of their branches and can approve pending transactions within their scope. A MANAGER has network-wide scope across the whole tenant: they manage all agents, all branches, commissions and configuration, and can access every report. A MANAGER can also create/delete SUPERVISOR accounts.',
        motsCles: ['supervisor', 'manager', 'difference', 'branch', 'scope'],
      },
      up10: {
        question: 'How do I see the list of all active users?',
        reponse: 'The full user list is available under Settings → Users (for ADMIN) or Agents (for MANAGER). You can filter by role, status (active/inactive), branch or creation date. The list includes: name, email, role, branch, last login date and account status. It can be exported to CSV for HR purposes.',
        motsCles: ['user list', 'active', 'users', 'management', 'hr'],
      },
      p1: {
        question: 'How do I add a new Mobile Money operator?',
        reponse: 'Go to Settings → Operators → Add an operator. Select the operator from the list or choose "Custom". Enter the API credentials provided by the operator (API key, secret, endpoint URL). Configure the float thresholds and commission rates. Click "Test connection" to validate, then "Activate". The operator then appears in every transaction form.',
        motsCles: ['operator', 'add', 'api', 'configuration', 'mobile money'],
      },
      p2: {
        question: 'How do I change my company logo on PDFs and reports?',
        reponse: 'Go to Settings → Company → Logo. Click "Change logo" and upload your PNG or SVG file (recommended size: 400x100px, transparent background). Click "Save". The new logo appears immediately on newly generated PDFs, reports and receipts. Existing documents are not modified retroactively.',
        motsCles: ['logo', 'company', 'pdf', 'reports', 'image', 'branding'],
      },
      p3: {
        question: 'How do I configure the time zone?',
        reponse: 'The time zone is critical: it affects the timestamp of every transaction and the generation date of reports. To configure it: Settings → Company → Time zone. Select your zone (e.g. "Africa/Abidjan" for Côte d\'Ivoire, "Africa/Dakar" for Senegal). Warning: changing the time zone after transactions have been recorded creates discrepancies in historical reports.',
        motsCles: ['time zone', 'timezone', 'time', 'configuration', 'africa'],
      },
      p4: {
        question: 'How do I configure email notifications?',
        reponse: 'Go to Settings → Notifications → Email. You can configure alerts for: low/critical float (with specific recipients), pending transactions, automatic monthly reports, new support tickets, and logins from new devices. Each alert type can be enabled/disabled independently and sent to different email addresses.',
        motsCles: ['notifications', 'email', 'alerts', 'configuration', 'settings'],
      },
      p5: {
        question: 'How do I configure the currency displayed in GESTMONEY?',
        reponse: 'The currency is configured at company level under Settings → Company → Currency. GESTMONEY supports: XOF (CFA franc — default for WAEMU), XAF (CFA franc — Central Africa), GHS (Ghanaian cedi), NGN (Nigerian naira), KES (Kenyan shilling), UGX (Ugandan shilling). The displayed currency affects the interface, reports and PDFs. Note: amounts are not converted, only the symbol changes.',
        motsCles: ['currency', 'cfa franc', 'xof', 'money', 'symbol', 'currency'],
      },
      p6: {
        question: 'How do I temporarily enable or disable an operator?',
        reponse: 'To temporarily disable an operator (maintenance, technical issue): Settings → Operators → [Operator name] → Deactivate. Agents will no longer be able to create transactions on that operator. Existing transactions are unaffected. To re-enable: same procedure → Activate. Remember to notify your agents of the change.',
        motsCles: ['disable operator', 'maintenance', 'temporary', 'enable', 'block'],
      },
      p7: {
        question: 'How do I configure commission scales?',
        reponse: 'Commissions are configured under Commissions → Scales. For each operator, define: the type (percentage or fixed amount), the rate per operation type (deposit/withdrawal/transfer), and optionally tiers (e.g. 0.5% for 0-100k CFA francs, 1% for 100k-1M CFA francs). Commissions are calculated automatically on each approved transaction and aggregated in the commission reports.',
        motsCles: ['commission', 'scale', 'rate', 'operator', 'configuration', 'tier'],
      },
      p8: {
        question: 'How do I relaunch the onboarding wizard?',
        reponse: 'The initial setup wizard can be relaunched at any time from Settings → Getting started guide → Relaunch guide. This shows the 4 getting-started steps again (Welcome, Operators, First agent, Done). Useful for training new administrators or for quickly reconfiguring the basic settings.',
        motsCles: ['wizard', 'onboarding', 'getting started guide', 'relaunch', 'configuration'],
      },
      p9: {
        question: 'How do I integrate an external API with GESTMONEY?',
        reponse: 'GESTMONEY provides a complete REST API for integration with third-party systems (accounting, CRM, BI). The API documentation is available under Settings → API → Documentation. To generate an API key: Settings → API → Create a key. Each key has a scope (read/write), an optional expiry date and can be revoked at any time. API calls are recorded in the audit log.',
        motsCles: ['api', 'integration', 'api key', 'rest', 'external', 'documentation'],
      },
      p10: {
        question: 'How do I configure transaction receipt messages?',
        reponse: 'Transaction receipts can be customised under Settings → Transactions → Receipt template. You can change: the footer (thank-you message, legal notices), the branch contact details displayed, the inclusion of your logo, and the format (58mm/80mm thermal or A5/A4). These settings apply to every receipt generated by agents.',
        motsCles: ['receipt', 'printing', 'template', 'customisation', 'transaction'],
      },
      t1: {
        question: 'How do I record a Mobile Money transaction?',
        reponse: 'From Transactions → New transaction: (1) Choose the type (Deposit, Withdrawal or Transfer), (2) Select the operator, (3) Enter the amount in CFA francs, (4) Enter the customer\'s phone number, (5) Add the operator reference (code provided by the network), (6) Optional: add an internal note, (7) Click "Confirm". The transaction is recorded and a receipt can be printed immediately.',
        motsCles: ['transaction', 'record', 'deposit', 'withdrawal', 'transfer', 'mobile money'],
      },
      t2: {
        question: 'What should I do if a transaction stays stuck in "Pending"?',
        reponse: 'First check: (1) The float balance of the operator concerned — insufficient float can block withdrawals. (2) The operator reference — an invalid or already-used reference blocks the transaction. If the problem persists, a MANAGER can force approval or rejection from Transactions → [Reference] → Actions → Approve manually / Reject. If in doubt, contact the operator quoting the transaction reference.',
        motsCles: ['stuck transaction', 'pending', 'float', 'reference', 'approve manually'],
      },
      t3: {
        question: 'Can an already-approved transaction be cancelled?',
        reponse: 'An approved transaction cannot be cancelled directly in GESTMONEY (it has already been processed on the operator\'s side). To correct a mistake: (1) Create a reverse transaction (if a deposit was recorded in error, create a withdrawal for the same amount). (2) Record the reason for the correction in the "Internal note" field. (3) For complex situations (duplicate, wrong amount), contact operator support and open a GESTMONEY support ticket.',
        motsCles: ['cancel', 'approved transaction', 'correction', 'reverse', 'error'],
      },
      t4: {
        question: 'How do I search for a specific transaction?',
        reponse: 'On the Transactions page, use the search bar and the available filters: operator reference, customer phone number, exact amount, period (start/end date), type (deposit/withdrawal/transfer), operator, status, agent, branch. You can combine several filters. To find a transaction by reference number: press ⌘K → type the reference → select the transaction from the suggestions.',
        motsCles: ['search', 'transaction', 'reference', 'filter', 'find'],
      },
      t5: {
        question: 'How do I print a transaction receipt?',
        reponse: 'Once a transaction is approved, a "Print receipt" button appears immediately. You can also print the receipt of a past transaction from Transactions → [Reference] → Print receipt. The print format is configurable (58mm thermal, 80mm, or A5). For Bluetooth thermal printers, GESTMONEY supports direct printing via the mobile PWA.',
        motsCles: ['receipt', 'printing', 'printer', 'thermal', 'bluetooth'],
      },
      t6: {
        question: 'What is the maximum amount per transaction?',
        reponse: 'The maximum amount per transaction depends on two limits: (1) The Mobile Money operator\'s limit (e.g. 1,000,000 CFA francs for a standard Wave withdrawal). (2) The limit configured by your administrator in GESTMONEY (Agents → Limits). If a transaction exceeds the limit, it is blocked with an error message stating the applicable limit. Contact your ADMIN to adjust the limits if needed.',
        motsCles: ['maximum amount', 'limit', 'cap', 'transaction', 'operator'],
      },
      t7: {
        question: 'How do I import transactions in bulk?',
        reponse: 'GESTMONEY supports bulk import via CSV or XLSX from Transactions → Import. First download the file template ("Download CSV template"). Fill in the required columns (type, operator, amount, customer number, reference, date). Upload the file and click "Validate import". GESTMONEY checks each row and reports errors before the final import.',
        motsCles: ['import', 'bulk', 'csv', 'xlsx', 'batch', 'bulk import'],
      },
      t8: {
        question: 'How do I set up alerts on large transactions?',
        reponse: 'To receive an alert when a transaction exceeds a threshold: Settings → Notifications → Transactions → Amount alerts. Set the threshold amount (e.g. 500,000 CFA francs). Every time a transaction exceeds that amount, the designated managers receive an email and an in-app notification. Useful for compliance and anti-fraud monitoring.',
        motsCles: ['transaction alert', 'large amount', 'threshold', 'compliance', 'monitoring'],
      },
      t9: {
        question: 'How do I see total transactions for a period?',
        reponse: 'There are several ways to get totals for a period: (1) Dashboard — the "Transactions today/this month" widget. (2) Reports & BI — generate a report for the period you want. (3) Transactions page — apply the period filter and check the summary at the bottom of the table. (4) CSV/XLSX export with a period filter for further processing in Excel.',
        motsCles: ['total transactions', 'period', 'summary', 'statement', 'month'],
      },
      t10: {
        question: 'What is the difference between a deposit, a withdrawal and a transfer?',
        reponse: 'In GESTMONEY: (1) Deposit — a customer pays money into their Mobile Money account (the agent\'s float increases). (2) Withdrawal — a customer takes money out of their Mobile Money account (the agent\'s float decreases). (3) Transfer — money is sent from one number to another with no cash handling (no direct impact on the agent\'s float). Each type may have a different commission rate.',
        motsCles: ['deposit', 'withdrawal', 'transfer', 'difference', 'transaction type', 'float'],
      },
      aa1: {
        question: 'How do I add a new agent to the network?',
        reponse: 'From Agents → Add an agent: (1) Fill in first name, last name, email and phone. (2) Attach them to a branch. (3) Choose their role (AGENT or SUPERVISOR). (4) Set their transaction limits if needed. (5) Click "Create agent". An invitation email is automatically sent with temporary credentials valid for 48h. The agent must change their password at first login.',
        motsCles: ['add agent', 'create', 'invitation', 'new', 'network'],
      },
      aa2: {
        question: 'How do I review an agent\'s performance?',
        reponse: 'From Agents → [Agent name]: open the performance sheet showing transaction volume, total amount processed, average ticket, commissions generated and ranking relative to the network. The main dashboard shows the Top Agent of the month. The Performance page shows the overall ranking with trend charts. An agent can view their own performance but not that of others.',
        motsCles: ['performance', 'agent', 'ranking', 'kpi', 'statistics', 'top agent'],
      },
      aa3: {
        question: 'How many agents can be created in GESTMONEY?',
        reponse: 'The number of agents depends on your plan: Starter (5 agents max), Business (25 agents max), Enterprise (unlimited). If you reach the limit, GESTMONEY notifies you and invites you to upgrade your plan. Inactive (deactivated) agents count towards the quota. To free up slots, you can permanently delete the accounts of agents who have left for good (warning: deletion is irreversible).',
        motsCles: ['number of agents', 'limit', 'quota', 'plan', 'maximum'],
      },
      aa4: {
        question: 'How do I create a new branch (point of sale)?',
        reponse: 'From Branches → New branch: (1) Enter the branch name. (2) Enter the address (city, district, street). (3) Designate the supervisor responsible for the branch. (4) Attach the assigned agents. (5) Enable the operators available at this point of sale. (6) Click "Create branch". The branch then appears in report filters and in agent creation forms.',
        motsCles: ['branch', 'create', 'point of sale', 'new', 'supervisor'],
      },
      aa5: {
        question: 'How do I see the agent ranking for the month?',
        reponse: 'The agent ranking is available in: (1) Dashboard — the "Top agents" widget on the home page (Top 3 of the month). (2) Performance page — full ranking with volumes, amounts and commissions. (3) Reports & BI — the monthly report always includes the full ranking. The ranking can be based on volume (number of transactions) or total amount processed, depending on your configuration.',
        motsCles: ['agent ranking', 'top agent', 'month', 'performance', 'ranking'],
      },
      aa6: {
        question: 'Can an agent be attached to several branches?',
        reponse: 'No. In the current version of GESTMONEY, an agent is attached to only one branch at a time. If an agent works at several points of sale on rotation, the recommended approach is to attach them to their main branch and use transaction notes to identify the point of sale for each operation. Multi-branch assignment per agent is planned for a future release.',
        motsCles: ['agent', 'several branches', 'multi-branch', 'limitation', 'rotation'],
      },
      aa7: {
        question: 'How do I track the transactions of a specific branch?',
        reponse: 'To filter transactions by branch: (1) Transactions page → "Branch" filter → select the branch you want. (2) Reports & BI → generate a report with the branch filter enabled. (3) Branches → [Branch name] → "Transactions" tab — shows every transaction for that branch. Exports also respect the branch filter.',
        motsCles: ['branch transactions', 'filter', 'point of sale', 'tracking'],
      },
      aa8: {
        question: 'How do I handle an agent\'s absence (leave, sickness)?',
        reponse: 'To handle an agent\'s absence temporarily: (1) If the absence is short (a few days), no action is required — the other agents in the branch carry on processing transactions. (2) If the absence is long, deactivate the agent\'s account (Agents → [Agent] → Deactivate) to prevent any unauthorised use of their credentials. (3) Transactions recorded during the absence by a stand-in are attributed to the agent who actually entered them.',
        motsCles: ['agent absence', 'leave', 'deactivate', 'cover', 'temporary'],
      },
      aa9: {
        question: 'How do I permanently delete a branch?',
        reponse: 'To delete a branch (irreversible): Branches → [Branch name] → Actions → Delete branch. WARNING: deletion is not possible if active agents are attached to that branch or if recent transactions are associated with it. Before deleting: move the agents to another branch, and make sure all transactions are finalised. It is often better to deactivate rather than delete.',
        motsCles: ['delete branch', 'closure', 'deactivation', 'irreversible'],
      },
      aa10: {
        question: 'How do I compare the performance of two branches?',
        reponse: 'To compare branches: (1) Reports & BI → generate a report grouped "By branch". (2) Branches page → list view with each branch\'s KPIs (volume, amount, commissions). (3) Export to XLSX and use Excel charts for a visual comparison. A future version of GESTMONEY will include a built-in multi-branch graphical comparison module.',
        motsCles: ['compare branches', 'performance', 'benchmark', 'report', 'kpi'],
      },
      fc1: {
        question: 'What is float and why does it matter?',
        reponse: 'Float is the balance your network holds with each Mobile Money operator. It represents your operational capacity: high float means you can serve more customer withdrawals. If float is low, agents can no longer process withdrawals (the funds are not available). GESTMONEY monitors floats in real time and sends automatic alerts. Proactive float management is essential to keep operations running.',
        motsCles: ['float', 'operator balance', 'capacity', 'liquidity', 'withdrawal'],
      },
      fc2: {
        question: 'How do I set float alert thresholds?',
        reponse: 'Under Float Management → Float settings → [Operator]: set the Low threshold (first alert level, e.g. 500,000 CFA francs) and the Critical threshold (urgent alert plus optional blocking of withdrawals, e.g. 100,000 CFA francs). For each threshold, choose the email alert recipients. GESTMONEY also sends push notifications inside the application. Thresholds can be configured independently for each operator.',
        motsCles: ['float threshold', 'alert', 'configuration', 'low', 'critical'],
      },
      fc3: {
        question: 'How do I record a float top-up (replenishment)?',
        reponse: 'A float top-up is recorded under Float Management → Replenish: select the operator, enter the amount added, the date of the operation and the top-up reference (transfer number or operator reference). Click "Confirm". The new balance is updated and the top-up history is kept for accounting. Low-float alerts stop as soon as the threshold is exceeded.',
        motsCles: ['float top-up', 'replenishment', 'top up', 'balance', 'operator'],
      },
      fc4: {
        question: 'How do I view float history by operator?',
        reponse: 'The full float history is available under Float Management → History. Filter by operator and period to see: the balance trend, the top-ups performed, and the alerts triggered. A float trend chart is available on each operator\'s page. Export the history to CSV for your treasury accounting.',
        motsCles: ['float history', 'trend', 'chart', 'operator', 'treasury'],
      },
      fc5: {
        question: 'How are commissions calculated?',
        reponse: 'Commissions are calculated automatically according to the configured scale: rate × transaction amount (in percentage mode) or a fixed amount per transaction. If tiers are defined, GESTMONEY applies the rate matching the amount bracket. The calculation happens when each transaction is approved. Commissions are aggregated by agent, branch and operator in dedicated reports.',
        motsCles: ['commission calculation', 'rate', 'tier', 'automatic', 'percentage'],
      },
      fc6: {
        question: 'When are commissions paid out to agents?',
        reponse: 'GESTMONEY calculates and displays commissions in real time, but the actual payout to agents (in cash, by bank transfer or via Mobile Money) is handled manually by your organisation according to your internal policy (weekly, monthly, etc.). GESTMONEY provides the report of commissions owed to each agent for the period, which you can export to XLSX to make processing easier.',
        motsCles: ['commission payout', 'agent payment', 'period', 'monthly', 'processing'],
      },
      fc7: {
        question: 'Can float go negative in GESTMONEY?',
        reponse: 'GESTMONEY prevents float from going negative if automatic blocking is enabled (critical threshold → withdrawals blocked). If automatic blocking is not enabled, float can in theory appear negative in GESTMONEY when transactions have been recorded without checking the actual balance. In that case an emergency top-up is required and a reconciliation with the operator must be carried out.',
        motsCles: ['negative float', 'overdraft', 'blocking', 'reconciliation', 'emergency'],
      },
      fc8: {
        question: 'How do I reconcile the GESTMONEY float with the operator\'s actual balance?',
        reponse: 'To reconcile: (1) Obtain the operator\'s actual balance statement (via their app or agent portal). (2) Compare it with the balance shown in GESTMONEY for that operator. (3) If there is a discrepancy: review the last 24h of transactions and identify any transactions not yet synchronised or top-ups not yet recorded. (4) Correct the balance manually under Float Management → Balance adjustment, with a justification.',
        motsCles: ['reconciliation', 'actual balance', 'discrepancy', 'adjustment', 'matching'],
      },
      fc9: {
        question: 'Do commissions change if the scale is modified mid-month?',
        reponse: 'No. Commissions already calculated on past transactions are not recalculated retroactively. A change of scale applies only to new transactions created after the modification date. To avoid any confusion, we recommend changing scales at the start of the month. GESTMONEY logs every scale modification with the date and the author of the change.',
        motsCles: ['scale change', 'retroactive', 'commissions', 'date', 'calculation'],
      },
      fc10: {
        question: 'How do I see the commissions owed to a specific agent?',
        reponse: 'From Commissions → By agent → [Agent name]: view the breakdown of commissions by period, by operator and by transaction type. You see the total amount owed, the transaction-by-transaction detail, and the comparison with the previous month. This report can be exported to PDF (a commission statement ready to hand to the agent) or to XLSX for accounting.',
        motsCles: ['agent commissions', 'detail', 'commission statement', 'export', 'amount owed'],
      },
      re1: {
        question: 'How do I export transactions to Excel?',
        reponse: 'From the Transactions page: (1) Apply your filters (period, operator, branch, status). (2) Click the "Export XLSX" button at the top right. (3) The Excel file downloads automatically with a GESTMONEY header, formatting and total formulas. You can also export to CSV (Excel-compatible) for a lighter file. Exports from Reports & BI include embedded charts.',
        motsCles: ['excel export', 'xlsx', 'csv', 'transactions', 'download'],
      },
      re2: {
        question: 'How do I generate a monthly PDF report?',
        reponse: 'From Reports & BI: (1) Select the period (current month or previous month). (2) Click "Generate report". (3) GESTMONEY computes the KPIs and generates the report (a few seconds). (4) In the report history, click the generated report → "Export PDF". The PDF includes: your company logo, KPIs, charts, agent ranking and breakdown by operator.',
        motsCles: ['pdf report', 'monthly', 'generate', 'kpi', 'chart'],
      },
      re3: {
        question: 'Can reports be emailed automatically on a schedule?',
        reponse: 'Yes. GESTMONEY automatically generates a summary report on the 1st of each month and sends it by email. To configure it: Settings → Notifications → Reports. Add the recipients\' email addresses, choose the format (PDF, XLSX or both) and the preferred send time. Automatic reports include: revenue, variances, top agents, and a link to the full report.',
        motsCles: ['automatic report', 'email', 'scheduling', 'monthly', 'scheduled'],
      },
      re4: {
        question: 'Which export formats are available in GESTMONEY?',
        reponse: 'GESTMONEY supports 3 export formats: (1) CSV — a universal text format, compatible with every spreadsheet tool, ideal for importing into other software. (2) XLSX — native Excel format with formatting, a GESTMONEY header and automatic total formulas. (3) PDF — a formatted document with logo, charts and professional layout, ideal for archiving and sharing. Every export respects the filters active at the time of export.',
        motsCles: ['export format', 'csv', 'xlsx', 'pdf', 'difference'],
      },
      re5: {
        question: 'How do I compare the performance of two periods?',
        reponse: 'In Reports & BI, select "Period comparison" (available at the top of the page). Choose the main period (e.g. July 2026) and the reference period (e.g. June 2026). GESTMONEY shows the variance in value and in percentage for each KPI: revenue, transactions, new customers, commissions. Positive variances are shown in green, negative ones in red.',
        motsCles: ['comparison', 'periods', 'variance', 'kpi', 'trend'],
      },
      re6: {
        question: 'What do the dashboard KPIs mean?',
        reponse: 'The main KPIs: (1) Total revenue — the sum of the amounts of all approved transactions in the period. (2) Transactions — the total number of operations. (3) Average ticket — total revenue ÷ number of transactions. (4) Success rate — % of approved transactions vs the total (approved + rejected + cancelled). (5) New customers — customers making their first transaction in the period. (6) Commissions — total commissions generated.',
        motsCles: ['kpi', 'dashboard', 'revenue', 'average ticket', 'success rate', 'meaning'],
      },
      re7: {
        question: 'How do I export all GESTMONEY data (full backup)?',
        reponse: 'To export all of your data: Settings → Data → Export my data. GESTMONEY prepares a ZIP archive containing: all your transactions (CSV), the agent list (CSV), the generated reports (PDF) and the audit logs (CSV). Preparation may take a few minutes. You receive an email with a download link valid for 24h. This feature is available to ADMIN users only.',
        motsCles: ['full export', 'backup', 'all data', 'archive', 'zip'],
      },
      re8: {
        question: 'How do I generate a report for a specific operator?',
        reponse: 'In Reports & BI: (1) Select the period. (2) In the "Group by" filter, choose "Operator". (3) Click "Generate report". The report shows the KPIs for each operator separately: revenue, transactions, commissions, average float. You can also filter on a single operator for a single-operator report. Export to XLSX for deeper analysis.',
        motsCles: ['operator report', 'by operator', 'filter', 'orange', 'wave', 'mtn'],
      },
      re9: {
        question: 'Do reports include cancelled and rejected transactions?',
        reponse: 'By default, performance reports (revenue, commissions) include only transactions with the "Approved" status. Cancelled and rejected transactions are excluded from revenue but are included in the "Success rate" and "Rejection rate" statistics. For a report covering every status (useful for audits), use the "Status → All" filter on the Transactions page and export from there.',
        motsCles: ['cancelled', 'rejected', 'report', 'include', 'status', 'rejection rate'],
      },
      re10: {
        question: 'How do I share a report with an external partner?',
        reponse: 'To share a report: (1) Generate the report in Reports & BI. (2) Export it to PDF. (3) Share the PDF file by email or through your usual file-sharing system. If the partner needs recurring access, consider creating an AUDITOR account for them (read-only access). Avoid sharing your personal credentials. GESTMONEY does not yet offer public report sharing links.',
        motsCles: ['share report', 'external', 'pdf', 'partner', 'auditor'],
      },
      al1: {
        question: 'What plans are available?',
        reponse: 'GESTMONEY offers 3 plans: (1) Starter — up to 5 agents, 1,000 transactions/month, basic SARA AI, 8h email support. Ideal for small networks getting started. (2) Business — up to 25 agents, 10,000 transactions/month, advanced SARA AI, unlimited exports, 4h email support. For growing networks. (3) Enterprise — unlimited, full SARA AI, API access, 2h priority support, 99.9% SLA. For large organisations. Contact sales@ibigsoft.com for a tailored quote.',
        motsCles: ['plans', 'starter', 'business', 'enterprise', 'subscription', 'pricing'],
      },
      al2: {
        question: 'How do I upgrade to a higher plan?',
        reponse: 'To upgrade your plan: Settings → Subscription → Change plan. Select the target plan and click "Upgrade". The upgrade takes effect immediately. Pro-rata billing is calculated automatically for the remainder of the current month. You will receive an invoice for the adjustment by email. For any billing questions, contact billing@ibigsoft.com.',
        motsCles: ['upgrade', 'change plan', 'upgrade', 'move up', 'billing'],
      },
      al3: {
        question: 'How do I download my GESTMONEY invoices?',
        reponse: 'All your invoices are available under Settings → Subscription → Billing history. Click an invoice to download it as a PDF. Invoices include: a description of the service, the period, the amount excluding and including tax, and IBIG Soft\'s legal information. For older invoices or in the event of a dispute, contact billing@ibigsoft.com.',
        motsCles: ['invoice', 'download', 'history', 'billing', 'accounting'],
      },
      al4: {
        question: 'What happens if I exceed my plan\'s limits?',
        reponse: 'If you reach your plan\'s agent or transaction limit, GESTMONEY sends you progressive alerts (at 80%, 90% and 100% of the limit). Once the limit is reached: new agents can no longer be created (existing ones keep working) and transactions beyond the monthly quota may be blocked depending on your configuration. We recommend upgrading before you reach the limits.',
        motsCles: ['limit exceeded', 'quota', 'blocking', 'upgrade', 'alerts'],
      },
      al5: {
        question: 'How do I cancel my GESTMONEY subscription?',
        reponse: 'To cancel: Settings → Subscription → Cancel subscription. Cancellation takes effect at the end of the current billing period (no pro-rata refund). Before cancelling, export all your data (Settings → Data → Export) because access will be cut off on the end date. After cancellation, your data is retained for 90 days and then permanently deleted. Contact support@ibigsoft.com with any questions.',
        motsCles: ['cancellation', 'cancel subscription', 'end of contract', 'data', 'export'],
      },
      st1: {
        question: 'How do I open a support ticket?',
        reponse: 'From Support → New ticket: (1) Enter the issue title. (2) Select the category (Technical, Transaction, Float, Agent, Billing, Other). (3) Choose the priority (Low/Normal/High/Urgent). (4) Describe the problem in detail with the steps to reproduce it, the error messages and the references concerned. (5) Attach a screenshot if useful. (6) Click "Submit". A ticket number is assigned to you and you can follow its progress.',
        motsCles: ['ticket', 'support', 'open', 'issue', 'assistance'],
      },
      st2: {
        question: 'What are the support response times?',
        reponse: 'Response times are guaranteed according to priority and plan: Urgent priority — 2h (all plans) / High priority — 4 business hours / Normal priority — 8 business hours / Low priority — 24 business hours. Business hours are Monday to Friday, 8am-6pm UTC+0. On Enterprise plans, priority support is available 7 days a week. Weekend tickets are handled first thing on Monday morning.',
        motsCles: ['response time', 'sla', 'support', 'priority', 'business hours'],
      },
      st3: {
        question: 'How do I follow the progress of a support ticket?',
        reponse: 'From Support → [Ticket number]: review the exchange history, the current status (Open, In progress, Waiting, Resolved, Closed) and the support team\'s replies. You are notified by email on every reply. You can add further information or attachments directly in the ticket conversation thread. Resolved tickets remain viewable for 1 year.',
        motsCles: ['ticket tracking', 'status', 'progress', 'support reply', 'history'],
      },
      st4: {
        question: 'Can I escalate a ticket in a critical emergency?',
        reponse: 'To escalate a ticket: (1) Change the priority to "Urgent" on the existing ticket. (2) Send an email to support@ibigsoft.com quoting the ticket number and "URGENT ESCALATION" in the subject line. (3) On the Enterprise plan, use the emergency WhatsApp number shown under Settings → Support → Emergency contact. Escalations are handled with absolute priority.',
        motsCles: ['escalation', 'emergency', 'priority', 'critical', 'support'],
      },
      st5: {
        question: 'What should I do if support has not resolved my issue?',
        reponse: 'If the problem is still unresolved after several exchanges: (1) Ask in the ticket to be escalated to the senior technical team. (2) Explicitly state how much time has elapsed and the operational impact. (3) Contact your IBIG Soft Account Manager directly if you are on a Business or Enterprise plan. (4) For disputes, write to ceo@ibigsoft.com copying your ticket. GESTMONEY commits to resolving every ticket within the SLA timeframes.',
        motsCles: ['unresolved', 'senior escalation', 'dispute', 'account manager', 'sla'],
      },
      si1: {
        question: 'What is SARA and how do I access it?',
        reponse: 'SARA (Smart Assistant for Real-time Assistance) is the AI assistant built into GESTMONEY. Click the green robot icon button at the bottom right of any dashboard page to open SARA. It answers your questions about features, procedures and troubleshooting in real time. SARA is available 24/7 and replies in both French and English.',
        motsCles: ['sara', 'ai assistant', 'chatbot', 'access', 'button'],
      },
      si2: {
        question: 'What can (and cannot) SARA do?',
        reponse: 'SARA can: answer questions about GESTMONEY features, guide you step by step through procedures, explain statuses and errors, point you to the right module, and suggest troubleshooting solutions. SARA cannot: perform actions on your behalf (create a transaction, change a setting), access your specific data (your float amounts, your agents\' names), or replace human support for complex issues.',
        motsCles: ['sara', 'capabilities', 'limits', 'what it can do', 'ai features'],
      },
      si3: {
        question: 'Does SARA reply in English?',
        reponse: 'Yes. SARA automatically detects the language of your question and replies in the same language. Ask your question in French → SARA replies in French. Ask your question in English → SARA answers in English. You can also mix languages within the same conversation. SARA is optimised for French (primary language) and English (secondary language). Further languages will be added in future releases.',
        motsCles: ['sara', 'english', 'language', 'multilingual', 'language detection'],
      },
      si4: {
        question: 'Are conversations with SARA confidential?',
        reponse: 'Yes. Your conversations with SARA remain private. Exchanges are linked to your user account and are not accessible to other users or to IBIG Soft staff (except as part of technical support that you have explicitly authorised). Conversations are not used to train third-party AI models without your consent. SARA history is kept for the duration of your session only.',
        motsCles: ['sara', 'confidentiality', 'privacy', 'history', 'ai data'],
      },
      si5: {
        question: 'Can SARA report an issue to support automatically?',
        reponse: 'Not directly yet, but SARA can guide you to open a support ticket in 2 clicks. During a SARA conversation, type "report an issue" or "open a ticket" and SARA offers to pre-fill a support ticket with the context of your question. Automatic ticket creation through SARA is under development for version 2.2.',
        motsCles: ['sara', 'report issue', 'automatic ticket', 'support', 'ai'],
      },
      sb1: {
        question: 'How often is data backed up?',
        reponse: 'GESTMONEY performs automatic backups at 3 levels: (1) Real time — every transaction is saved instantly to a replicated database. (2) Hourly snapshot — a full database backup every hour, retained for 7 days. (3) Daily backup — retained for 30 days. (4) Weekly backup — retained for 6 months. In the event of an incident, the maximum data loss is 1 hour.',
        motsCles: ['backup', 'backup', 'frequency', 'retention', 'automatic'],
      },
      sb2: {
        question: 'How do I restore accidentally deleted data?',
        reponse: 'In the event of accidental data deletion: (1) Contact technical support immediately (support@ibigsoft.com or an URGENT priority ticket). (2) Specify the data concerned (type, period, identifiers). (3) IBIG Soft performs the restore from the most recent available backup (maximum 1h of loss). (4) The restore is carried out in a test environment before being applied to production. Estimated time: 2 to 4h depending on complexity.',
        motsCles: ['restore', 'deleted data', 'recovery', 'backup', 'emergency'],
      },
      sb3: {
        question: 'How long is my data retained?',
        reponse: 'Data on an active account: retained indefinitely for as long as your subscription is active. Data after cancellation: retained for 90 days after the subscription ends, then permanently deleted. Audit logs: retained for 5 years in accordance with OHADA requirements. We strongly recommend exporting all your data before cancelling your subscription. The full export is available under Settings → Data → Export.',
        motsCles: ['data retention', 'retention period', 'cancellation', 'ohada', 'legal'],
      },
      sb4: {
        question: 'How do I export all my GESTMONEY data?',
        reponse: 'For a full export: Settings → Data → Export my data → "Export everything". GESTMONEY prepares a ZIP archive with: transactions (CSV), agents (CSV), branches (CSV), reports (PDF), commissions (CSV) and audit logs (CSV). Preparation takes 5 to 30 minutes depending on volume. You receive an email with a download link valid for 24h. This operation is restricted to ADMIN users.',
        motsCles: ['full export', 'all data', 'archive', 'zip', 'gdpr'],
      },
      sb5: {
        question: 'Is GESTMONEY compliant with GDPR and OHADA regulations?',
        reponse: 'Yes. GESTMONEY is built for regulatory compliance: (1) GDPR — right to erasure, export of personal data, record of processing activities. (2) OHADA — accounting records retained for 5 years, transaction traceability. (3) WAMU/BCEAO — compliance with WAEMU electronic money directives. (4) ISO 27001 — information security (hosting infrastructure). For a compliance report, contact compliance@ibigsoft.com.',
        motsCles: ['gdpr', 'ohada', 'compliance', 'bceao', 'regulatory', 'lgpd'],
      },
    },
  },

  dateLocale: 'en-GB',
  currencyLocale: 'en-US',
};

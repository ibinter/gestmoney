// ============================================================
// GESTMONEY — Lexique (glossaire) Mobile Money & plateforme
// Module de DONNÉES pur (aucun 'use client').
// Termes bilingues FR/EN. Le tri alphabétique se fait à l'affichage.
// ============================================================

export interface LexiqueEntry {
  id: string;
  fr: { terme: string; definition: string };
  en: { terme: string; definition: string };
}

export const LEXIQUE: LexiqueEntry[] = [
  {
    id: 'float',
    fr: {
      terme: 'Float (liquidité)',
      definition:
        "Réserve d'unités électroniques (e-money) qu'un agent détient pour servir les clients. Le float diminue à chaque cash-in (le client dépose de l'espèce et reçoit de l'électronique) et augmente à chaque cash-out. Sans float suffisant, l'agent ne peut plus effectuer d'opérations.",
    },
    en: {
      terme: 'Float (liquidity)',
      definition:
        "The reserve of electronic money (e-money) an agent holds to serve customers. Float goes down on each cash-in (the customer hands over cash and receives e-money) and up on each cash-out. Without enough float, the agent can no longer process transactions.",
    },
  },
  {
    id: 'cash-in',
    fr: {
      terme: 'Cash-in',
      definition:
        "Opération par laquelle un client remet de l'espèce à l'agent et reçoit en échange le même montant en monnaie électronique sur son portefeuille. C'est l'entrée d'argent liquide dans le circuit Mobile Money.",
    },
    en: {
      terme: 'Cash-in',
      definition:
        "The operation where a customer gives cash to the agent and receives the same amount as e-money in their wallet. It is how physical cash enters the Mobile Money system.",
    },
  },
  {
    id: 'cash-out',
    fr: {
      terme: 'Cash-out',
      definition:
        "Opération inverse du cash-in : le client convertit sa monnaie électronique en espèces auprès d'un agent. L'agent débite le portefeuille du client et lui remet l'équivalent en liquide.",
    },
    en: {
      terme: 'Cash-out',
      definition:
        "The reverse of cash-in: the customer converts e-money into physical cash at an agent. The agent debits the customer's wallet and hands over the equivalent in cash.",
    },
  },
  {
    id: 'depot',
    fr: {
      terme: 'Dépôt',
      definition:
        "Ajout de fonds sur un portefeuille Mobile Money, généralement via un cash-in chez un agent. Le solde du client augmente du montant déposé, minoré des éventuels frais.",
    },
    en: {
      terme: 'Deposit',
      definition:
        "Adding funds to a Mobile Money wallet, usually through a cash-in at an agent. The customer's balance rises by the deposited amount, less any fees.",
    },
  },
  {
    id: 'retrait',
    fr: {
      terme: 'Retrait',
      definition:
        "Sortie de fonds d'un portefeuille sous forme d'espèces, réalisée via un cash-out. Le solde du client diminue du montant retiré, augmenté des frais éventuels.",
    },
    en: {
      terme: 'Withdrawal',
      definition:
        "Taking funds out of a wallet as cash, done through a cash-out. The customer's balance drops by the withdrawn amount, plus any applicable fees.",
    },
  },
  {
    id: 'transfert',
    fr: {
      terme: 'Transfert',
      definition:
        "Envoi de monnaie électronique d'un portefeuille à un autre, entre deux utilisateurs. Le transfert peut être interne à un même opérateur ou interopérable entre réseaux différents.",
    },
    en: {
      terme: 'Transfer',
      definition:
        "Sending e-money from one wallet to another between two users. A transfer can be within a single operator or interoperable across different networks.",
    },
  },
  {
    id: 'agent',
    fr: {
      terme: 'Agent',
      definition:
        "Personne ou point de vente agréé qui réalise les opérations de cash-in et cash-out pour les clients. L'agent est rémunéré par une commission sur chaque transaction et doit maintenir un float suffisant.",
    },
    en: {
      terme: 'Agent',
      definition:
        "An approved person or outlet that performs cash-in and cash-out operations for customers. The agent earns a commission on each transaction and must keep enough float on hand.",
    },
  },
  {
    id: 'super-agent',
    fr: {
      terme: 'Super-agent',
      definition:
        "Agent de niveau supérieur qui approvisionne en float les agents ordinaires de son réseau. Il joue un rôle de grossiste en liquidité électronique et assure la distribution vers les points de vente.",
    },
    en: {
      terme: 'Super-agent',
      definition:
        "A higher-tier agent who supplies float to the ordinary agents in their network. They act as a wholesaler of electronic liquidity, distributing it down to the outlets.",
    },
  },
  {
    id: 'agence-pdv',
    fr: {
      terme: 'Agence / Point de vente (PDV)',
      definition:
        "Emplacement physique où les opérations Mobile Money sont réalisées. Dans GESTMONEY, chaque agence regroupe une caisse, un ou plusieurs agents et un float propre, et sert d'unité de gestion et de reporting.",
    },
    en: {
      terme: 'Branch / Point of sale (POS)',
      definition:
        "The physical location where Mobile Money operations take place. In GESTMONEY, each branch groups a cash desk, one or more agents and its own float, and serves as a unit for management and reporting.",
    },
  },
  {
    id: 'distributeur',
    fr: {
      terme: 'Distributeur',
      definition:
        "Entreprise partenaire de l'opérateur chargée de recruter, approvisionner et animer un réseau d'agents sur un territoire. Le distributeur perçoit une marge sur l'activité de son réseau.",
    },
    en: {
      terme: 'Distributor',
      definition:
        "A company partnering with the operator to recruit, supply and manage a network of agents across a territory. The distributor earns a margin on the activity of its network.",
    },
  },
  {
    id: 'wallet',
    fr: {
      terme: 'Portefeuille (wallet)',
      definition:
        "Compte électronique rattaché à un numéro de téléphone qui stocke la monnaie électronique d'un utilisateur. Il permet de recevoir, envoyer, payer et retirer des fonds.",
    },
    en: {
      terme: 'Wallet',
      definition:
        "An electronic account tied to a phone number that stores a user's e-money. It lets them receive, send, pay and withdraw funds.",
    },
  },
  {
    id: 'unite-uv',
    fr: {
      terme: 'Unité (UV)',
      definition:
        "Unité de Valeur électronique équivalente à une unité de monnaie (par exemple 1 UV = 1 FCFA). Les UV représentent le float de l'agent et circulent à la place des espèces dans le système.",
    },
    en: {
      terme: 'Unit (e-value)',
      definition:
        "An electronic value unit equal to one unit of currency (for example 1 unit = 1 XOF). Units represent the agent's float and circulate in place of cash within the system.",
    },
  },
  {
    id: 'solde',
    fr: {
      terme: 'Solde',
      definition:
        "Montant disponible sur un portefeuille ou dans une caisse à un instant donné. Le solde électronique correspond au float restant, le solde de caisse aux espèces physiques en réserve.",
    },
    en: {
      terme: 'Balance',
      definition:
        "The amount available in a wallet or cash desk at a given moment. The electronic balance is the remaining float; the cash balance is the physical cash in reserve.",
    },
  },
  {
    id: 'seuil-float',
    fr: {
      terme: 'Seuil de float',
      definition:
        "Niveau minimal de liquidité en dessous duquel un agent doit être réapprovisionné pour continuer à servir les clients. GESTMONEY peut déclencher une alerte lorsque le float passe sous ce seuil.",
    },
    en: {
      terme: 'Float threshold',
      definition:
        "The minimum liquidity level below which an agent must be replenished to keep serving customers. GESTMONEY can raise an alert when float drops under this threshold.",
    },
  },
  {
    id: 'reapprovisionnement',
    fr: {
      terme: 'Réapprovisionnement',
      definition:
        "Opération d'ajout de float à un agent ou à une agence, généralement fournie par un super-agent ou un distributeur. Elle permet de reconstituer la liquidité épuisée par les cash-in.",
    },
    en: {
      terme: 'Replenishment',
      definition:
        "Adding float to an agent or branch, usually supplied by a super-agent or distributor. It rebuilds the liquidity consumed by cash-in operations.",
    },
  },
  {
    id: 'commission',
    fr: {
      terme: 'Commission',
      definition:
        "Rémunération versée pour une transaction Mobile Money, calculée selon un barème par palier de montant. Elle est répartie entre l'opérateur, le distributeur et l'agent.",
    },
    en: {
      terme: 'Commission',
      definition:
        "The remuneration paid on a Mobile Money transaction, calculated from a tiered scale based on amount. It is shared between the operator, the distributor and the agent.",
    },
  },
  {
    id: 'part-agent-reseau',
    fr: {
      terme: 'Part agent / part réseau',
      definition:
        "Décomposition de la commission entre ce qui revient à l'agent qui exécute l'opération (part agent) et ce qui revient au réseau ou distributeur (part réseau). GESTMONEY calcule automatiquement ce partage.",
    },
    en: {
      terme: 'Agent share / network share',
      definition:
        "The split of a commission between what goes to the agent performing the operation (agent share) and what goes to the network or distributor (network share). GESTMONEY computes this split automatically.",
    },
  },
  {
    id: 'reconciliation',
    fr: {
      terme: 'Réconciliation',
      definition:
        "Rapprochement entre les mouvements enregistrés dans GESTMONEY et les relevés de l'opérateur ou les comptages physiques. Elle vise à détecter et corriger tout écart avant clôture.",
    },
    en: {
      terme: 'Reconciliation',
      definition:
        "Matching the movements recorded in GESTMONEY against the operator's statements or physical counts. It aims to detect and correct any discrepancy before closing.",
    },
  },
  {
    id: 'ecart-de-caisse',
    fr: {
      terme: 'Écart de caisse',
      definition:
        "Différence constatée entre le solde théorique attendu et le montant réellement compté en caisse. Un écart positif signale un excédent, un écart négatif un manquant à justifier.",
    },
    en: {
      terme: 'Cash discrepancy',
      definition:
        "The gap between the expected theoretical balance and the amount actually counted in the cash desk. A positive gap flags a surplus, a negative one a shortfall to be explained.",
    },
  },
  {
    id: 'caisse',
    fr: {
      terme: 'Caisse',
      definition:
        "Espace de gestion des espèces d'une agence, où sont enregistrées les entrées et sorties de liquide. La caisse est ouverte en début de journée et clôturée après comptage.",
    },
    en: {
      terme: 'Cash desk',
      definition:
        "A branch's cash-management space, where cash inflows and outflows are recorded. The desk is opened at the start of the day and closed after counting.",
    },
  },
  {
    id: 'coffre',
    fr: {
      terme: 'Coffre',
      definition:
        "Réserve sécurisée d'espèces et parfois de float distincte de la caisse courante. Le coffre sert à stocker les excédents et à alimenter la caisse selon les besoins d'exploitation.",
    },
    en: {
      terme: 'Vault',
      definition:
        "A secured reserve of cash, and sometimes float, kept separate from the day-to-day cash desk. The vault stores surpluses and feeds the desk as operating needs require.",
    },
  },
  {
    id: 'operateur-reseau',
    fr: {
      terme: 'Opérateur / Réseau',
      definition:
        "Fournisseur du service Mobile Money (Orange Money, MTN MoMo, Wave, Moov Money…). Chaque opérateur a ses barèmes, ses plafonds et son système ; GESTMONEY permet de gérer plusieurs réseaux en parallèle.",
    },
    en: {
      terme: 'Operator / Network',
      definition:
        "The provider of the Mobile Money service (Orange Money, MTN MoMo, Wave, Moov Money…). Each operator has its own fee scale, limits and system; GESTMONEY lets you manage several networks side by side.",
    },
  },
  {
    id: 'kyc',
    fr: {
      terme: 'KYC (Connaissance du client)',
      definition:
        "Procédure d'identification et de vérification de l'identité d'un client (« Know Your Customer »). Elle est obligatoire pour ouvrir un compte et lutter contre la fraude et le blanchiment.",
    },
    en: {
      terme: 'KYC (Know Your Customer)',
      definition:
        "The procedure to identify and verify a customer's identity. It is mandatory to open an account and helps fight fraud and money laundering.",
    },
  },
  {
    id: 'piece-identite',
    fr: {
      terme: "Pièce d'identité",
      definition:
        "Document officiel (carte nationale, passeport, permis) présenté lors du KYC pour prouver l'identité du client. Ses références sont enregistrées dans GESTMONEY et rattachées au dossier client.",
    },
    en: {
      terme: 'ID document',
      definition:
        "An official document (national ID card, passport, driving licence) shown during KYC to prove the customer's identity. Its details are stored in GESTMONEY and linked to the customer record.",
    },
  },
  {
    id: 'plafond',
    fr: {
      terme: 'Plafond',
      definition:
        "Montant maximal autorisé pour une transaction, un solde ou un cumul sur une période. Les plafonds dépendent du niveau de KYC du client et des règles de l'opérateur.",
    },
    en: {
      terme: 'Limit (cap)',
      definition:
        "The maximum amount allowed for a transaction, a balance or a cumulative total over a period. Limits depend on the customer's KYC level and the operator's rules.",
    },
  },
  {
    id: 'transaction',
    fr: {
      terme: 'Transaction',
      definition:
        "Opération financière unitaire enregistrée dans le système (dépôt, retrait, transfert, paiement…). Chaque transaction porte un montant, une date, un statut et une référence unique.",
    },
    en: {
      terme: 'Transaction',
      definition:
        "A single financial operation recorded in the system (deposit, withdrawal, transfer, payment…). Each transaction carries an amount, a date, a status and a unique reference.",
    },
  },
  {
    id: 'reference',
    fr: {
      terme: 'Référence',
      definition:
        "Identifiant unique attribué à une transaction, permettant de la retrouver et de la tracer. La référence sert de preuve en cas de réclamation ou de rapprochement avec l'opérateur.",
    },
    en: {
      terme: 'Reference',
      definition:
        "A unique identifier assigned to a transaction, used to locate and trace it. The reference serves as proof in case of a dispute or reconciliation with the operator.",
    },
  },
  {
    id: 'statut-transaction',
    fr: {
      terme: 'Statut de transaction',
      definition:
        "État d'avancement d'une opération : en attente, réussie, échouée ou annulée. Le statut indique si les fonds ont bien été déplacés et conditionne l'affichage et la comptabilisation.",
    },
    en: {
      terme: 'Transaction status',
      definition:
        "The progress state of an operation: pending, successful, failed or cancelled. The status shows whether funds actually moved and drives how it is displayed and accounted for.",
    },
  },
  {
    id: 'frais',
    fr: {
      terme: 'Frais',
      definition:
        "Montant prélevé pour l'exécution d'une transaction, à la charge de l'émetteur ou du bénéficiaire. Les frais suivent un barème par palier propre à chaque opérateur.",
    },
    en: {
      terme: 'Fees',
      definition:
        "The amount charged to carry out a transaction, borne by the sender or the recipient. Fees follow a tiered scale specific to each operator.",
    },
  },
  {
    id: 'taxe',
    fr: {
      terme: 'Taxe',
      definition:
        "Prélèvement obligatoire imposé par l'État sur certaines transactions Mobile Money (par exemple une taxe sur les retraits). Elle s'ajoute aux frais et doit être reversée aux autorités.",
    },
    en: {
      terme: 'Tax (levy)',
      definition:
        "A mandatory charge imposed by the government on some Mobile Money transactions (for example a withdrawal levy). It is added on top of the fees and must be remitted to the authorities.",
    },
  },
  {
    id: 'licence',
    fr: {
      terme: 'Licence',
      definition:
        "Droit d'utilisation de la plateforme GESTMONEY, accordé pour une durée et un périmètre donnés. La licence conditionne l'accès aux modules et le nombre d'utilisateurs ou d'agences autorisés.",
    },
    en: {
      terme: 'Licence',
      definition:
        "The right to use the GESTMONEY platform, granted for a set duration and scope. The licence governs access to modules and the number of allowed users or branches.",
    },
  },
  {
    id: 'forfait',
    fr: {
      terme: 'Forfait',
      definition:
        "Formule d'abonnement définissant le prix, les fonctionnalités et les limites d'usage de GESTMONEY. Le choix du forfait détermine les modules activés et le niveau de support.",
    },
    en: {
      terme: 'Plan',
      definition:
        "A subscription package defining the price, features and usage limits of GESTMONEY. The chosen plan determines which modules are enabled and the level of support.",
    },
  },
  {
    id: 'periode-essai',
    fr: {
      terme: "Période d'essai",
      definition:
        "Durée initiale pendant laquelle GESTMONEY est utilisable gratuitement pour évaluer le service. À l'issue de l'essai, un forfait payant doit être souscrit pour continuer.",
    },
    en: {
      terme: 'Trial period',
      definition:
        "The initial stretch during which GESTMONEY can be used free of charge to evaluate the service. When the trial ends, a paid plan must be taken up to continue.",
    },
  },
  {
    id: 'periode-grace',
    fr: {
      terme: 'Période de grâce',
      definition:
        "Délai accordé après l'échéance d'un paiement avant la suspension du compte. Pendant la période de grâce, l'accès reste ouvert pour laisser le temps de régulariser.",
    },
    en: {
      terme: 'Grace period',
      definition:
        "The delay allowed after a payment falls due before the account is suspended. During the grace period, access stays open to give time to settle up.",
    },
  },
  {
    id: 'tenant',
    fr: {
      terme: 'Tenant (locataire)',
      definition:
        "Client-entreprise disposant de son propre espace isolé dans GESTMONEY, avec ses données, ses utilisateurs et ses paramètres. L'architecture multi-locataire garantit l'étanchéité entre organisations.",
    },
    en: {
      terme: 'Tenant',
      definition:
        "A business customer with its own isolated space in GESTMONEY, holding its data, users and settings. The multi-tenant architecture keeps organisations fully separated.",
    },
  },
  {
    id: 'role-permission',
    fr: {
      terme: 'Rôle / Permission',
      definition:
        "Ensemble de droits déterminant ce qu'un utilisateur peut voir et faire dans GESTMONEY. Un rôle (administrateur, caissier, agent…) regroupe des permissions attribuées selon les responsabilités.",
    },
    en: {
      terme: 'Role / Permission',
      definition:
        "A set of rights defining what a user can see and do in GESTMONEY. A role (administrator, cashier, agent…) bundles permissions granted according to responsibilities.",
    },
  },
  {
    id: 'sara',
    fr: {
      terme: 'SARA',
      definition:
        "Système normalisé de déclaration fiscale et réglementaire utilisé en zone UEMOA pour la télédéclaration. GESTMONEY produit des exports compatibles pour faciliter les obligations déclaratives.",
    },
    en: {
      terme: 'SARA',
      definition:
        "A standardised tax and regulatory reporting system used in the WAEMU zone for electronic filing. GESTMONEY produces compatible exports to ease reporting obligations.",
    },
  },
  {
    id: 'syscohada-ohada',
    fr: {
      terme: 'SYSCOHADA / OHADA',
      definition:
        "Référentiel comptable commun aux États membres de l'OHADA en Afrique. La comptabilité de GESTMONEY suit le plan de comptes SYSCOHADA révisé pour garantir la conformité régionale.",
    },
    en: {
      terme: 'SYSCOHADA / OHADA',
      definition:
        "The accounting framework shared by OHADA member states in Africa. GESTMONEY's bookkeeping follows the revised SYSCOHADA chart of accounts to ensure regional compliance.",
    },
  },
  {
    id: 'grand-livre',
    fr: {
      terme: 'Grand livre',
      definition:
        "Registre comptable regroupant, pour chaque compte, tous les mouvements de débit et de crédit. Il permet de connaître le solde de chaque compte et d'établir les états financiers.",
    },
    en: {
      terme: 'General ledger',
      definition:
        "The accounting register gathering, for each account, all debit and credit movements. It gives the balance of every account and underpins the financial statements.",
    },
  },
  {
    id: 'journal',
    fr: {
      terme: 'Journal',
      definition:
        "Livre chronologique où sont enregistrées les écritures comptables au fur et à mesure. Chaque journal (ventes, caisse, opérations diverses…) regroupe les mouvements d'une même nature.",
    },
    en: {
      terme: 'Journal',
      definition:
        "A chronological book where accounting entries are recorded as they occur. Each journal (sales, cash, miscellaneous…) groups movements of the same kind.",
    },
  },
  {
    id: 'balance',
    fr: {
      terme: 'Balance',
      definition:
        "État récapitulant, pour chaque compte, le total des débits, des crédits et le solde. La balance vérifie l'équilibre de la comptabilité et sert de base au bilan et au compte de résultat.",
    },
    en: {
      terme: 'Trial balance',
      definition:
        "A statement summarising, for each account, total debits, total credits and the resulting balance. It checks that the books balance and feeds the balance sheet and income statement.",
    },
  },
  {
    id: 'ttc-ht',
    fr: {
      terme: 'TTC / HT',
      definition:
        "HT (hors taxes) désigne un montant avant application de la TVA ; TTC (toutes taxes comprises) le montant taxe incluse. La différence entre les deux correspond à la taxe à reverser.",
    },
    en: {
      terme: 'Incl. tax / Excl. tax',
      definition:
        "Excl. tax is an amount before VAT is applied; incl. tax is the amount with tax added. The difference between the two is the tax to be remitted.",
    },
  },
  {
    id: 'xof-fcfa',
    fr: {
      terme: 'XOF / FCFA',
      definition:
        "Franc CFA d'Afrique de l'Ouest, monnaie officielle des pays de l'UEMOA (code ISO XOF). C'est la devise de référence des montants affichés et comptabilisés dans GESTMONEY.",
    },
    en: {
      terme: 'XOF / CFA franc',
      definition:
        "The West African CFA franc, official currency of WAEMU countries (ISO code XOF). It is the reference currency for amounts shown and booked in GESTMONEY.",
    },
  },
  {
    id: 'ussd',
    fr: {
      terme: 'USSD',
      definition:
        "Protocole de codes courts (par exemple *144#) permettant d'utiliser les services Mobile Money sans internet, sur tout téléphone. Il ouvre des menus interactifs pour effectuer les opérations.",
    },
    en: {
      terme: 'USSD',
      definition:
        "A short-code protocol (for example *144#) that lets users access Mobile Money services without internet, on any phone. It opens interactive menus to carry out operations.",
    },
  },
  {
    id: 'api-operateur',
    fr: {
      terme: 'API opérateur',
      definition:
        "Interface technique fournie par un opérateur pour connecter GESTMONEY à son système. Elle permet d'automatiser l'exécution des transactions et la récupération des statuts et soldes.",
    },
    en: {
      terme: 'Operator API',
      definition:
        "A technical interface provided by an operator to connect GESTMONEY to its system. It automates the execution of transactions and the retrieval of statuses and balances.",
    },
  },
  {
    id: 'fraude-alerte',
    fr: {
      terme: 'Fraude / Alerte',
      definition:
        "Comportement anormal ou tentative d'escroquerie détecté sur une transaction ou un compte. GESTMONEY génère des alertes (montants suspects, cumuls inhabituels…) pour permettre un contrôle rapide.",
    },
    en: {
      terme: 'Fraud / Alert',
      definition:
        "Abnormal behaviour or an attempted scam detected on a transaction or account. GESTMONEY raises alerts (suspicious amounts, unusual cumulative totals…) to enable a quick review.",
    },
  },
  {
    id: 'interoperabilite',
    fr: {
      terme: 'Interopérabilité',
      definition:
        "Capacité d'envoyer et recevoir de l'argent entre portefeuilles de réseaux différents. Elle permet, par exemple, qu'un client Orange Money reçoive un transfert d'un client MTN MoMo.",
    },
    en: {
      terme: 'Interoperability',
      definition:
        "The ability to send and receive money between wallets on different networks. It allows, for instance, an Orange Money customer to receive a transfer from an MTN MoMo customer.",
    },
  },
  {
    id: 'cloture',
    fr: {
      terme: 'Clôture',
      definition:
        "Opération de fin de journée ou de période qui arrête les compteurs, fige les soldes et contrôle les écarts. Une fois clôturée, une caisse ou une période ne peut plus être modifiée.",
    },
    en: {
      terme: 'Closing',
      definition:
        "The end-of-day or end-of-period operation that stops the counters, freezes balances and checks discrepancies. Once closed, a cash desk or period can no longer be edited.",
    },
  },
  {
    id: 'client',
    fr: {
      terme: 'Client (souscripteur)',
      definition:
        "Utilisateur final titulaire d'un portefeuille Mobile Money qui effectue des dépôts, retraits et transferts. Dans GESTMONEY, sa fiche regroupe ses coordonnées, son KYC et son historique.",
    },
    en: {
      terme: 'Customer (subscriber)',
      definition:
        "The end user holding a Mobile Money wallet who makes deposits, withdrawals and transfers. In GESTMONEY, their record gathers contact details, KYC and history.",
    },
  },
  {
    id: 'e-money',
    fr: {
      terme: 'Monnaie électronique (e-money)',
      definition:
        "Valeur monétaire stockée sous forme électronique, émise en contrepartie de fonds reçus, et acceptée comme moyen de paiement. Elle circule dans les portefeuilles à la place des espèces.",
    },
    en: {
      terme: 'Electronic money (e-money)',
      definition:
        "Monetary value stored electronically, issued in exchange for funds received, and accepted as a means of payment. It circulates in wallets in place of cash.",
    },
  },
];

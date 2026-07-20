/* Configurations des moyens de paiement — squelette de démarrage.
 *
 * ⚠️ AUCUNE COORDONNÉE RÉELLE ICI. Les numéros de réception, IBAN et adresses
 * de wallet sont volontairement des marqueurs « À CONFIGURER ». Inventer une
 * valeur plausible serait dangereux : un client qui la lirait enverrait de
 * l'argent vers un compte inconnu. L'administrateur renseigne les vraies
 * coordonnées depuis la console (/admin/payments/configs), sans toucher au code.
 *
 * Les moyens sont créés DÉSACTIVÉS (actif: false), sauf le voucher qui ne
 * nécessite aucune coordonnée. Activer un moyen sans l'avoir configuré
 * afficherait « À CONFIGURER » à un vrai client.
 *
 * Idempotent : relancer ne duplique rien (contrainte @@unique tenantId+methode+variante).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const A_CONFIGURER = 'À CONFIGURER';

const CONFIGS = [
  // ── Mobile Money manuel (preuve téléversée) ────────────────────────────────
  ...['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY'].map((v, i) => ({
    methode: 'MOBILE_MONEY_MANUEL',
    variante: v,
    libelle: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ordreAffichage: i + 1,
    parametres: {
      numeroReception: A_CONFIGURER,
      titulaire: A_CONFIGURER,
      instructions:
        "Composez le code de paiement de votre opérateur, envoyez le montant exact au numéro indiqué, puis téléversez la capture d'écran de confirmation.",
    },
  })),

  // ── Passerelles automatiques ───────────────────────────────────────────────
  ...['CINETPAY', 'MONEROO', 'FEDAPAY', 'PAYSTACK', 'STRIPE', 'PAYPAL'].map((v, i) => ({
    methode: 'PASSERELLE',
    variante: v,
    libelle: v.charAt(0) + v.slice(1).toLowerCase(),
    ordreAffichage: 10 + i,
    parametres: {
      instructions:
        'Vous serez redirigé vers la plateforme de paiement sécurisée. Votre abonnement sera activé dès confirmation par la passerelle.',
    },
    // Les clés vivent dans `secrets`, chiffrées. Vides tant que non configurées.
    secrets: {},
  })),

  // ── Virements ──────────────────────────────────────────────────────────────
  {
    methode: 'VIREMENT_NATIONAL', variante: '', libelle: 'Virement bancaire', ordreAffichage: 20,
    parametres: {
      banque: A_CONFIGURER, titulaire: A_CONFIGURER,
      numeroCompte: A_CONFIGURER, codeGuichet: A_CONFIGURER,
      instructions: "Effectuez le virement depuis votre banque, puis téléversez le bordereau.",
    },
  },
  {
    methode: 'VIREMENT_INTERNATIONAL', variante: '', libelle: 'Virement international (SWIFT)', ordreAffichage: 21,
    parametres: {
      iban: A_CONFIGURER, bic: A_CONFIGURER,
      banque: A_CONFIGURER, adresseBanque: A_CONFIGURER, titulaire: A_CONFIGURER,
      instructions: 'Les frais de transfert sont à la charge de l’émetteur. Joignez le SWIFT de confirmation.',
    },
  },

  // ── Transferts d'argent ────────────────────────────────────────────────────
  ...['WESTERN_UNION', 'MONEYGRAM', 'RIA'].map((v, i) => ({
    methode: 'TRANSFERT_ARGENT', variante: v,
    libelle: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ordreAffichage: 30 + i,
    parametres: {
      destinataire: A_CONFIGURER, paysReception: A_CONFIGURER,
      instructions: 'Communiquez le numéro de transaction (MTCN) après l’envoi.',
    },
  })),

  // ── Espèces, chèque ────────────────────────────────────────────────────────
  {
    methode: 'ESPECES_AGENCE', variante: '', libelle: 'Espèces en agence', ordreAffichage: 40,
    parametres: {
      pointsCollecte: [],
      instructions: 'Présentez-vous dans un point de collecte, puis saisissez le code figurant sur votre reçu.',
    },
  },
  {
    methode: 'CHEQUE', variante: '', libelle: 'Chèque bancaire', ordreAffichage: 41,
    parametres: {
      ordre: A_CONFIGURER, adresseEnvoi: A_CONFIGURER,
      instructions: "L'abonnement est activé après encaissement effectif du chèque.",
    },
  },

  // ── Cryptomonnaies ─────────────────────────────────────────────────────────
  ...[
    { v: 'USDT_TRC20', l: 'USDT (TRC20)', r: 'TRC20' },
    { v: 'USDT_ERC20', l: 'USDT (ERC20)', r: 'ERC20' },
    { v: 'BITCOIN', l: 'Bitcoin', r: 'Bitcoin' },
    { v: 'ETHEREUM', l: 'Ethereum', r: 'ERC20' },
  ].map((c, i) => ({
    methode: 'CRYPTO', variante: c.v, libelle: c.l, ordreAffichage: 50 + i,
    parametres: {
      adresseWallet: A_CONFIGURER, reseau: c.r,
      instructions: `Envoyez le montant sur le réseau ${c.r} UNIQUEMENT, puis communiquez le hash de la transaction. Un envoi sur un autre réseau est irrécupérable.`,
    },
  })),

  // ── Voucher (aucune coordonnée requise) ────────────────────────────────────
  {
    methode: 'VOUCHER', variante: '', libelle: 'Code prépayé', ordreAffichage: 60, actif: true,
    parametres: {
      instructions: 'Saisissez le code figurant sur votre carte prépayée. L’activation est immédiate.',
    },
  },

  // ── Paiement à la livraison ────────────────────────────────────────────────
  {
    methode: 'PAIEMENT_LIVRAISON', variante: '', libelle: 'Paiement à la livraison', ordreAffichage: 70,
    parametres: {
      zonesLivraison: [],
      instructions: 'Réglez en espèces à la réception. Le livreur confirme le paiement dans le système.',
    },
  },
];

async function main() {
  let crees = 0;
  let existants = 0;

  for (const c of CONFIGS) {
    const cle = { tenantId: null, methode: c.methode, variante: c.variante ?? '' };
    const existe = await prisma.paymentMethodConfig.findFirst({ where: cle });
    if (existe) { existants++; continue; }

    await prisma.paymentMethodConfig.create({
      data: {
        tenantId: null,
        methode: c.methode,
        variante: c.variante ?? '',
        libelle: c.libelle,
        // Désactivé par défaut : un moyen actif mais non configuré afficherait
        // « À CONFIGURER » à un vrai client.
        actif: c.actif ?? false,
        sandbox: true,
        parametres: c.parametres ?? {},
        secrets: {},
        paysAutorises: [],
        plansAutorises: [],
        devises: ['XOF'],
        ordreAffichage: c.ordreAffichage ?? 0,
      },
    });
    crees++;
  }

  const actifs = await prisma.paymentMethodConfig.count({ where: { actif: true } });
  console.log(`Configurations : ${crees} créées, ${existants} déjà présentes.`);
  console.log(`Actives : ${actifs} (les autres attendent leurs coordonnées réelles).`);
  console.log('→ Renseigner les coordonnées puis activer depuis /admin/payments/configs');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });

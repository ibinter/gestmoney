/* Données de DÉMONSTRATION pour GESTMONEY — comptabilité + audit.
 *
 * Tout ce qui est créé ici est marqué [DÉMO] dans sa description afin de
 * pouvoir être retiré sans ambiguïté (voir purge-demo-data.js).
 * Exécuté dans le conteneur API (dispose de @prisma/client).
 *
 * Idempotent : relancer le script ne duplique rien.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = process.env.SEED_TENANT_ID || 'cmrfpl9on0000x4b78n0u1b31';
const MARQUEUR = '[DÉMO]';

// ─── Plan comptable SYSCOHADA (extrait réaliste) ─────────────────────────────
const COMPTES = [
  { code: '101', name: 'Capital social',                    type: 'EQUITY',    normalBalance: 'CREDIT' },
  { code: '106', name: 'Réserves',                          type: 'EQUITY',    normalBalance: 'CREDIT' },
  { code: '120', name: 'Résultat de l\'exercice',           type: 'EQUITY',    normalBalance: 'CREDIT' },
  { code: '244', name: 'Matériel informatique',             type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '311', name: 'Marchandises',                      type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '401', name: 'Fournisseurs',                      type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '411', name: 'Clients',                           type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '421', name: 'Personnel — rémunérations dues',    type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '445', name: 'État — TVA récupérable',            type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '443', name: 'État — TVA facturée',               type: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '521', name: 'Banque',                            type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '531', name: 'Float opérateurs Mobile Money',     type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '571', name: 'Caisse',                            type: 'ASSET',     normalBalance: 'DEBIT'  },
  { code: '601', name: 'Achats de marchandises',            type: 'EXPENSE',   normalBalance: 'DEBIT'  },
  { code: '622', name: 'Locations et charges locatives',    type: 'EXPENSE',   normalBalance: 'DEBIT'  },
  { code: '627', name: 'Services bancaires',                type: 'EXPENSE',   normalBalance: 'DEBIT'  },
  { code: '641', name: 'Impôts et taxes',                   type: 'EXPENSE',   normalBalance: 'DEBIT'  },
  { code: '661', name: 'Rémunérations du personnel',        type: 'EXPENSE',   normalBalance: 'DEBIT'  },
  { code: '701', name: 'Ventes de marchandises',            type: 'REVENUE',   normalBalance: 'CREDIT' },
  { code: '706', name: 'Commissions Mobile Money',          type: 'REVENUE',   normalBalance: 'CREDIT' },
  { code: '707', name: 'Prestations de services',           type: 'REVENUE',   normalBalance: 'CREDIT' },
];

/** Écritures : chaque ligne doit s'équilibrer (débit total = crédit total). */
const ECRITURES = [
  { ref: 'DEM-JAN-001', desc: 'Apport en capital initial',            mois: 0,  lignes: [['521', 25000000, 0], ['101', 0, 25000000]] },
  { ref: 'DEM-JAN-002', desc: 'Achat matériel informatique agences',  mois: 0,  lignes: [['244', 4500000, 0], ['445', 810000, 0], ['521', 0, 5310000]] },
  { ref: 'DEM-FEV-001', desc: 'Approvisionnement float opérateurs',   mois: 1,  lignes: [['531', 12000000, 0], ['521', 0, 12000000]] },
  { ref: 'DEM-FEV-002', desc: 'Commissions Mobile Money février',     mois: 1,  lignes: [['571', 3250000, 0], ['706', 0, 2754237], ['443', 0, 495763]] },
  { ref: 'DEM-MAR-001', desc: 'Loyer trimestriel agences',            mois: 2,  lignes: [['622', 1800000, 0], ['521', 0, 1800000]] },
  { ref: 'DEM-MAR-002', desc: 'Salaires du personnel mars',           mois: 2,  lignes: [['661', 4200000, 0], ['421', 0, 4200000]] },
  { ref: 'DEM-MAR-003', desc: 'Commissions Mobile Money mars',        mois: 2,  lignes: [['571', 3980000, 0], ['706', 0, 3372881], ['443', 0, 607119]] },
  { ref: 'DEM-AVR-001', desc: 'Règlement salaires mars',              mois: 3,  lignes: [['421', 4200000, 0], ['521', 0, 4200000]] },
  { ref: 'DEM-AVR-002', desc: 'Frais et services bancaires',          mois: 3,  lignes: [['627', 385000, 0], ['521', 0, 385000]] },
  { ref: 'DEM-MAI-001', desc: 'Commissions Mobile Money mai',         mois: 4,  lignes: [['571', 4410000, 0], ['706', 0, 3737288], ['443', 0, 672712]] },
  { ref: 'DEM-MAI-002', desc: 'Achat marchandises (SIM, terminaux)',  mois: 4,  lignes: [['601', 6200000, 0], ['445', 1116000, 0], ['401', 0, 7316000]] },
  { ref: 'DEM-JUN-001', desc: 'Règlement fournisseur',                mois: 5,  lignes: [['401', 7316000, 0], ['521', 0, 7316000]] },
  { ref: 'DEM-JUN-002', desc: 'Prestations de services entreprises',  mois: 5,  lignes: [['411', 2950000, 0], ['707', 0, 2500000], ['443', 0, 450000]] },
  { ref: 'DEM-JUL-001', desc: 'Encaissement clients',                 mois: 6,  lignes: [['521', 2950000, 0], ['411', 0, 2950000]] },
  { ref: 'DEM-JUL-002', desc: 'Commissions Mobile Money juillet',     mois: 6,  lignes: [['571', 5120000, 0], ['706', 0, 4338983], ['443', 0, 781017]] },
  { ref: 'DEM-JUL-003', desc: 'Impôts et taxes professionnels',       mois: 6,  lignes: [['641', 1250000, 0], ['521', 0, 1250000]] },
];

async function main() {
  const annee = new Date().getFullYear();

  // ── Utilisateur créateur (admin du tenant) ────────────────────────────────
  const auteur = await prisma.user.findFirst({
    where: { tenantId: TENANT_ID },
    orderBy: { createdAt: 'asc' },
  });
  if (!auteur) throw new Error(`Aucun utilisateur pour le tenant ${TENANT_ID}`);

  // ── 1. Exercice fiscal ────────────────────────────────────────────────────
  const nomExercice = `Exercice ${annee}`;
  let exercice = await prisma.fiscalYear.findFirst({
    where: { tenantId: TENANT_ID, name: nomExercice },
  });
  if (!exercice) {
    exercice = await prisma.fiscalYear.create({
      data: {
        tenantId: TENANT_ID,
        name: nomExercice,
        startDate: new Date(Date.UTC(annee, 0, 1)),
        endDate: new Date(Date.UTC(annee, 11, 31)),
        isClosed: false,
      },
    });
  }

  // ── 2. Plan comptable ─────────────────────────────────────────────────────
  const parCode = {};
  for (const c of COMPTES) {
    const compte = await prisma.accountChart.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: c.code } },
      update: { name: c.name, type: c.type, normalBalance: c.normalBalance, isActive: true },
      create: {
        tenantId: TENANT_ID,
        code: c.code,
        name: c.name,
        type: c.type,
        normalBalance: c.normalBalance,
        level: 1,
        isActive: true,
        description: `${MARQUEUR} Plan comptable SYSCOHADA`,
      },
    });
    parCode[c.code] = compte.id;
  }

  // ── 3. Écritures de journal ───────────────────────────────────────────────
  let creees = 0;
  for (const e of ECRITURES) {
    const existe = await prisma.journalEntry.findFirst({
      where: { tenantId: TENANT_ID, reference: e.ref },
    });
    if (existe) continue;

    const totalDebit = e.lignes.reduce((s, l) => s + l[1], 0);
    const totalCredit = e.lignes.reduce((s, l) => s + l[2], 0);
    if (totalDebit !== totalCredit) {
      throw new Error(`Écriture ${e.ref} déséquilibrée : ${totalDebit} != ${totalCredit}`);
    }

    await prisma.journalEntry.create({
      data: {
        tenantId: TENANT_ID,
        reference: e.ref,
        description: `${MARQUEUR} ${e.desc}`,
        status: 'POSTED',
        totalDebit,
        totalCredit,
        currency: 'XOF',
        entryDate: new Date(Date.UTC(annee, e.mois, 15)),
        fiscalYearId: exercice.id,
        createdById: auteur.id,
        postedById: auteur.id,
        postedAt: new Date(),
        lines: {
          create: e.lignes.map(([code, debit, credit]) => ({
            accountId: parCode[code],
            debit,
            credit,
            currency: 'XOF',
            description: `${MARQUEUR} ${e.desc}`,
          })),
        },
      },
    });
    creees++;
  }

  // ── 4. Journal d'audit ────────────────────────────────────────────────────
  const ressources = ['Transaction', 'Agent', 'Agency', 'Customer', 'Commission', 'FloatAccount'];
  const actions = ['CREATE', 'UPDATE', 'VIEW', 'APPROVE', 'EXPORT', 'LOGIN'];
  const dejaAudit = await prisma.auditLog.count({
    where: { tenantId: TENANT_ID, description: { startsWith: MARQUEUR } },
  });

  let auditCrees = 0;
  if (dejaAudit === 0) {
    const lignes = [];
    // Activité étalée sur 7 jours
    for (let i = 0; i < 120; i++) {
      const il_y_a = Math.floor(Math.random() * 7 * 24 * 60); // minutes
      lignes.push({
        tenantId: TENANT_ID,
        userId: auteur.id,
        action: actions[i % actions.length],
        resource: ressources[i % ressources.length],
        resourceId: `demo-${i}`,
        description: `${MARQUEUR} Activité de démonstration`,
        ipAddress: `41.207.${(i % 200) + 1}.${(i % 250) + 1}`,
        createdAt: new Date(Date.now() - il_y_a * 60 * 1000),
      });
    }
    // Pic d'activité dans la dernière heure : déclenche l'alerte
    // EXCESSIVE_ACTIVITY du service d'audit (seuil : > 50 actions / heure).
    for (let i = 0; i < 65; i++) {
      lignes.push({
        tenantId: TENANT_ID,
        userId: auteur.id,
        action: 'VIEW',
        resource: 'Transaction',
        resourceId: `demo-pic-${i}`,
        description: `${MARQUEUR} Pic d'activité (déclenche l'alerte de volume)`,
        ipAddress: '41.207.12.34',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 50) * 60 * 1000),
      });
    }
    const res = await prisma.auditLog.createMany({ data: lignes });
    auditCrees = res.count;
  }

  console.log('SEED DÉMO OK');
  console.log(`  exercice        : ${exercice.name}`);
  console.log(`  comptes         : ${COMPTES.length}`);
  console.log(`  écritures créées: ${creees} (sur ${ECRITURES.length})`);
  console.log(`  logs d'audit    : ${auditCrees}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('SEED DÉMO ERREUR:', e.message); process.exit(1); });

/* Retire les données de DÉMONSTRATION créées par seed-demo-data.js.
 * Ne touche qu'aux enregistrements marqués [DÉMO] et aux écritures dont la
 * référence commence par DEM- : les données réelles ne sont jamais concernées.
 *
 * Exécution à blanc par défaut. Pour appliquer :  CONFIRMER=oui node purge-demo-data.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = process.env.SEED_TENANT_ID || 'cmrfpl9on0000x4b78n0u1b31';
const MARQUEUR = '[DÉMO]';
const APPLIQUER = process.env.CONFIRMER === 'oui';

async function main() {
  const ecritures = await prisma.journalEntry.findMany({
    where: { tenantId: TENANT_ID, reference: { startsWith: 'DEM-' } },
    select: { id: true, reference: true },
  });
  const audits = await prisma.auditLog.count({
    where: { tenantId: TENANT_ID, description: { startsWith: MARQUEUR } },
  });
  const comptes = await prisma.accountChart.count({
    where: { tenantId: TENANT_ID, description: { startsWith: MARQUEUR } },
  });

  console.log(`À supprimer pour le tenant ${TENANT_ID} :`);
  console.log(`  écritures [DEM-*] : ${ecritures.length} (+ leurs lignes)`);
  console.log(`  logs d'audit      : ${audits}`);
  console.log(`  comptes du plan   : ${comptes} (conservés par défaut)`);

  if (!APPLIQUER) {
    console.log('\nExécution à blanc. Relancer avec CONFIRMER=oui pour appliquer.');
    return;
  }

  // Les lignes partent en cascade avec l'écriture (onDelete: Cascade).
  const e = await prisma.journalEntry.deleteMany({
    where: { tenantId: TENANT_ID, reference: { startsWith: 'DEM-' } },
  });
  const a = await prisma.auditLog.deleteMany({
    where: { tenantId: TENANT_ID, description: { startsWith: MARQUEUR } },
  });
  // Le plan comptable est conservé : il est réutilisable pour de vraies
  // écritures. Le supprimer casserait toute écriture réelle qui s'y rattache.
  console.log(`\nSupprimé : ${e.count} écritures, ${a.count} logs d'audit.`);
  console.log('Plan comptable et exercice fiscal conservés (réutilisables).');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('PURGE ERREUR:', err.message); process.exit(1); });

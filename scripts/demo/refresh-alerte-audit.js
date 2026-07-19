/* Rafraîchit le pic d'activité d'audit pour que l'alerte de démonstration
 * soit visible MAINTENANT.
 *
 * L'alerte EXCESSIVE_ACTIVITY du service d'audit porte sur une fenêtre
 * GLISSANTE d'une heure (> 50 actions / heure / utilisateur). Un pic seedé
 * il y a plus d'une heure disparaît donc naturellement — ce n'est pas un bug.
 * Relancer ce script avant une démonstration.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = process.env.SEED_TENANT_ID || 'cmrfpl9on0000x4b78n0u1b31';
const MARQUEUR = '[DÉMO]';

async function main() {
  const user = await prisma.user.findFirst({
    where: { tenantId: TENANT_ID },
    orderBy: { createdAt: 'asc' },
  });
  if (!user) throw new Error('Aucun utilisateur pour ce tenant');

  // Purge des anciens pics pour ne pas empiler indéfiniment
  await prisma.auditLog.deleteMany({
    where: { tenantId: TENANT_ID, description: { contains: "Pic d'activité" } },
  });

  const lignes = [];
  for (let i = 0; i < 65; i++) {
    lignes.push({
      tenantId: TENANT_ID,
      userId: user.id,
      action: 'VIEW',
      resource: 'Transaction',
      resourceId: `demo-pic-${i}`,
      description: `${MARQUEUR} Pic d'activité (déclenche l'alerte de volume)`,
      ipAddress: '41.207.12.34',
      // Réparti sur les 40 dernières minutes : bien dans la fenêtre d'1 h
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 40) * 60 * 1000),
    });
  }
  const res = await prisma.auditLog.createMany({ data: lignes });
  console.log(`Pic rafraîchi : ${res.count} actions sur les 40 dernières minutes.`);
  console.log("L'alerte de volume doit réapparaître immédiatement.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });

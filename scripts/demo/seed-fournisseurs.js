/* Fournisseurs de démonstration. L'API n'expose pas de POST /stock/suppliers
 * (lecture seule), on les crée donc directement en base. Idempotent. */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = process.env.SEED_TENANT_ID || 'cmrfpl9on0000x4b78n0u1b31';

const FOURNISSEURS = [
  { name: "Orange Côte d'Ivoire",      contact: 'Service Partenaires', phone: '+225 27 20 30 40 50', email: 'partenaires@orange.ci',   address: 'Abidjan, Plateau' },
  { name: 'MTN Business CI',           contact: 'Direction B2B',       phone: '+225 27 20 31 41 51', email: 'b2b@mtn.ci',              address: 'Abidjan, Cocody' },
  { name: 'Ingenico West Africa',      contact: 'Support Terminaux',   phone: '+225 27 21 35 45 55', email: 'wa-support@ingenico.com', address: 'Abidjan, Zone 4' },
  { name: 'Sunmi Distribution CI',     contact: 'Ventes',              phone: '+225 05 06 07 08 09', email: 'ventes@sunmi-ci.com',     address: 'Abidjan, Marcory' },
];

async function main() {
  let crees = 0;
  for (const f of FOURNISSEURS) {
    const existe = await prisma.supplier.findFirst({
      where: { tenantId: TENANT_ID, name: f.name },
    });
    if (existe) continue;
    await prisma.supplier.create({ data: { tenantId: TENANT_ID, ...f, isActive: true } });
    crees++;
  }
  const total = await prisma.supplier.count({ where: { tenantId: TENANT_ID } });
  console.log(`Fournisseurs créés : ${crees} — total en base : ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });

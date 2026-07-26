/**
 * Lanceur autonome du seed de démonstration.
 * Ne dépend pas de SEED_DEMO= : à utiliser directement.
 *
 * Usage :
 *   pnpm db:seed-demo            (depuis la racine du monorepo)
 *   pnpm --filter @gestmoney/database db:seed-demo
 */

import { PrismaClient } from '@prisma/client';
import { seedDemoTenant } from './demo.seed';

const prisma = new PrismaClient({ log: ['error'] });

seedDemoTenant(prisma)
  .then((rapport) => {
    console.log('\n[DEMO] Rapport final :');
    console.table(rapport);
    console.log('\n[DEMO] Identifiants de connexion :');
    console.log('  Email    : demo@gestmoney.ibigsoft.com');
    console.log('  Mot de passe : Demo@2026');
    console.log('  Slug tenant  : demo-client\n');
  })
  .catch((err) => {
    console.error('[DEMO][ERREUR]', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

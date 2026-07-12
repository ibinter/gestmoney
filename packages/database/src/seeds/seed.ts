/**
 * GESTMONEY — Script de seed des données de démonstration
 *
 * Ce script est idempotent : il peut être relancé sans erreur grâce aux
 * appels upsert. L'ordre d'exécution respecte les contraintes de clés
 * étrangères du schéma Prisma.
 *
 * Usage : pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";
import { seedTenant } from "./data/tenant.seed";
import { seedUsers } from "./data/users.seed";
import { seedNetwork } from "./data/network.seed";
import { seedAgencies } from "./data/agencies.seed";
import { seedAgents } from "./data/agents.seed";
import { seedCustomers } from "./data/customers.seed";
import { seedFloatAccounts } from "./data/float-accounts.seed";
import { seedTransactions } from "./data/transactions.seed";
import { seedChartOfAccounts } from "./data/chart-of-accounts.seed";
import { seedJournalEntries } from "./data/journal-entries.seed";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║     GESTMONEY — Seed données de démonstration     ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  // ── 1. TENANT ──────────────────────────────────────────────────────────────
  console.log("[ 1/10 ] Tenant");
  const tenant = await seedTenant(prisma);

  // ── 2. USERS ───────────────────────────────────────────────────────────────
  console.log("\n[ 2/10 ] Utilisateurs");
  const users = await seedUsers(prisma, tenant.id);

  // ── 3. NETWORK ─────────────────────────────────────────────────────────────
  console.log("\n[ 3/10 ] Réseau");
  const network = await seedNetwork(prisma, tenant.id, users.networkAdmin.id);

  // ── 4. AGENCIES ────────────────────────────────────────────────────────────
  console.log("\n[ 4/10 ] Agences");
  const agencies = await seedAgencies(
    prisma,
    tenant.id,
    network.id,
    users.agencyManager.id
  );

  // ── 5. AGENTS ──────────────────────────────────────────────────────────────
  console.log("\n[ 5/10 ] Agents");
  const agents = await seedAgents(prisma, tenant.id, network.id, agencies);

  // ── 6. CUSTOMERS ───────────────────────────────────────────────────────────
  console.log("\n[ 6/10 ] Clients");
  const customers = await seedCustomers(prisma, tenant.id);

  // ── 7. FLOAT ACCOUNTS ──────────────────────────────────────────────────────
  console.log("\n[ 7/10 ] Comptes Float");
  const floatAccounts = await seedFloatAccounts(prisma, tenant.id, agents);

  // ── 8. TRANSACTIONS ────────────────────────────────────────────────────────
  console.log("\n[ 8/10 ] Transactions (500)");
  const transactions = await seedTransactions(
    prisma,
    tenant.id,
    agents,
    floatAccounts,
    customers
  );

  // ── 9. FISCAL YEAR + CHART OF ACCOUNTS ────────────────────────────────────
  console.log("\n[ 9/10 ] Année fiscale + Plan comptable SYSCOHADA");

  // Créer l'année fiscale courante
  const currentYear = new Date().getFullYear();
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: `Exercice ${currentYear}` },
    },
    update: {},
    create: {
      name: `Exercice ${currentYear}`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      isClosed: false,
      tenantId: tenant.id,
    },
  });
  console.log(`     Année fiscale ${currentYear} créée`);

  const accounts = await seedChartOfAccounts(
    prisma,
    tenant.id,
    fiscalYear.id
  );

  // ── 10. JOURNAL ENTRIES ────────────────────────────────────────────────────
  console.log("\n[ 10/10 ] Écritures comptables");
  await seedJournalEntries(
    prisma,
    tenant.id,
    fiscalYear.id,
    transactions,
    accounts
  );

  // ── RÉSUMÉ ─────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║              Seed terminé avec succès             ║");
  console.log("╠═══════════════════════════════════════════════════╣");
  console.log(`║  Durée           : ${elapsed}s`.padEnd(52) + "║");
  console.log(`║  Tenant          : ${tenant.name}`.padEnd(52) + "║");
  console.log(`║  Utilisateurs    : 6`.padEnd(52) + "║");
  console.log(`║  Agences         : ${agencies.length}`.padEnd(52) + "║");
  console.log(`║  Agents          : ${agents.length}`.padEnd(52) + "║");
  console.log(`║  Clients         : ${customers.length}`.padEnd(52) + "║");
  console.log(`║  Comptes float   : ${floatAccounts.length}`.padEnd(52) + "║");
  console.log(`║  Transactions    : ${transactions.length}`.padEnd(52) + "║");
  console.log(`║  Comptes SYSCO.  : ${accounts.length}`.padEnd(52) + "║");
  console.log("╚═══════════════════════════════════════════════════╝");

  console.log("\nComptes de connexion démo :");
  console.log("  admin@gestmoney.demo     → Admin2026!  [SUPER_ADMIN]");
  console.log("  directeur@demo.ci        → Demo2026!   [NETWORK_ADMIN]");
  console.log("  chef.agence@demo.ci      → Demo2026!   [AGENCY_MANAGER]");
  console.log("  agent1@demo.ci           → Demo2026!   [AGENT]");
  console.log("  comptable@demo.ci        → Demo2026!   [ACCOUNTANT]");
  console.log("  auditeur@demo.ci         → Demo2026!   [AUDITOR]\n");
}

main()
  .catch((error) => {
    console.error("\n[ERROR] Seed échoué :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

/**
 * Génère 50 écritures comptables correspondant aux transactions Mobile Money
 * Chaque écriture suit les règles SYSCOHADA :
 * - Dépôt : Débit 53x (Float) / Crédit 52x (Caisse)
 * - Retrait : Débit 52x (Caisse) / Crédit 53x (Float)
 * - Commission reçue : Débit 53x / Crédit 70x
 */

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FLOAT_ACCOUNTS_CODES: Record<string, string> = {
  ORANGE_CI: "531",
  MTN_CI: "532",
  WAVE_CI: "533",
  MOOV_CI: "534",
  AIRTEL_CI: "535",
};

const CAISSE_CODES = ["521", "522", "523", "524", "525", "526"];

const COMMISSION_CODES: Record<string, string> = {
  DEPOSIT: "701",
  WITHDRAWAL: "702",
  CASH_IN: "703",
  CASH_OUT: "704",
};

export async function seedJournalEntries(
  prisma: PrismaClient,
  tenantId: string,
  fiscalYearId: string,
  transactions: any[],
  accounts: any[]
) {
  console.log("  → Seed Journal Entries (50 écritures)...");

  // Récupérer un utilisateur admin pour createdById
  const adminUser = await prisma.user.findFirst({ where: { tenantId } });
  if (!adminUser) throw new Error("No user found for journal entries");
  const createdById = adminUser.id;

  // Index des comptes par code
  const accountByCode: Record<string, any> = {};
  for (const acc of accounts) {
    accountByCode[acc.code] = acc;
  }

  const entries = [];
  // Prendre les 50 premières transactions complètes
  const completedTxs = transactions
    .filter((t) => t.status === "COMPLETED")
    .slice(0, 50);

  let entryNumber = 1;

  for (const tx of completedTxs) {
    const operatorCode = tx.operatorCode ?? "ORANGE_CI";
    const floatCode = FLOAT_ACCOUNTS_CODES[operatorCode] ?? "531";
    const caisseCode = randomFrom(CAISSE_CODES);
    const commissionCode = COMMISSION_CODES[tx.type] ?? "701";

    const floatAccount = accountByCode[floatCode];
    const caisseAccount = accountByCode[caisseCode];
    const commissionAccount = accountByCode[commissionCode];
    const banqueAccount = accountByCode["633"]; // Frais bancaires

    if (!floatAccount || !caisseAccount) continue;

    const reference = `JE-${String(entryNumber).padStart(5, "0")}`;
    const description = `${tx.type} - Réf: ${tx.reference}`;

    let debitAccountId: string;
    let creditAccountId: string;

    // Logique comptable selon le type de transaction
    if (tx.type === "DEPOSIT") {
      // Client dépose des espèces → Float augmente, Caisse augmente
      debitAccountId = floatAccount.id;
      creditAccountId = caisseAccount.id;
    } else if (tx.type === "WITHDRAWAL") {
      // Client retire des espèces → Caisse diminue, Float diminue
      debitAccountId = caisseAccount.id;
      creditAccountId = floatAccount.id;
    } else if (tx.type === "CASH_IN") {
      // Opérateur alimente le float → Float augmente, Banque augmente
      debitAccountId = floatAccount.id;
      creditAccountId = accountByCode["511"]?.id ?? caisseAccount.id;
    } else {
      // CASH_OUT : Float diminue, Banque diminue
      debitAccountId = accountByCode["511"]?.id ?? caisseAccount.id;
      creditAccountId = floatAccount.id;
    }

    const journalEntry = await prisma.journalEntry.create({
      data: {
        reference,
        description,
        entryDate: tx.createdAt,
        status: "POSTED",
        totalDebit: tx.amount,
        totalCredit: tx.amount,
        currency: "XOF",
        tenantId,
        fiscalYearId,
        createdById,
        lines: {
          create: [
            {
              accountId: debitAccountId,
              description: `${description} — Débit`,
              debit: tx.amount,
              credit: 0,
              currency: "XOF",
            },
            {
              accountId: creditAccountId,
              description: `${description} — Crédit`,
              debit: 0,
              credit: tx.amount,
              currency: "XOF",
            },
          ],
        },
        createdAt: tx.createdAt,
        updatedAt: tx.createdAt,
      },
    });

    entries.push(journalEntry);
    entryNumber++;
  }

  console.log(`     ${entries.length} écritures comptables créées`);
  return entries;
}

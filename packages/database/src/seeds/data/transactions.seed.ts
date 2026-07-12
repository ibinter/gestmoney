import { PrismaClient } from "@prisma/client";

const TRANSACTION_TYPES = [
  ...Array(55).fill("DEPOSIT"),
  ...Array(25).fill("WITHDRAWAL"),
  ...Array(10).fill("TRANSFER"),
  ...Array(5).fill("PAYMENT"),
  ...Array(3).fill("FLOAT_REPLENISHMENT"),
  ...Array(2).fill("BILL_PAYMENT"),
];

const TRANSACTION_STATUSES = [
  ...Array(95).fill("COMPLETED"),
  ...Array(3).fill("FAILED"),
  ...Array(2).fill("CANCELLED"),
];

const OPERATORS = ["ORANGE_MONEY", "MTN_MOMO", "WAVE", "MOOV_MONEY", "AIRTEL_MONEY"];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRealisticDate(): Date {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const dayMs = randomBetween(0, 30) * 24 * 60 * 60 * 1000;
  const baseDate = new Date(thirtyDaysAgo + dayMs);
  const rand = Math.random();
  const hour = rand < 0.35 ? randomBetween(10, 11) : rand < 0.65 ? randomBetween(16, 17) : randomBetween(8, 19);
  baseDate.setHours(hour, randomBetween(0, 59), randomBetween(0, 59), 0);
  return baseDate;
}

function generateAmount(): number {
  const rand = Math.random();
  if (rand < 0.5) return randomBetween(2, 100) * 500;
  if (rand < 0.85) return randomBetween(100, 400) * 500;
  return randomBetween(400, 1000) * 500;
}

function generateDescription(type: string): string {
  const descriptions: Record<string, string[]> = {
    DEPOSIT: ["Dépôt Mobile Money", "Versement client", "Dépôt espèces", "Recharge compte"],
    WITHDRAWAL: ["Retrait espèces", "Retrait client", "Cash out", "Retrait Mobile Money"],
    CASH_IN: ["Cash In opérateur", "Approvisionnement float", "Alimentation compte"],
    CASH_OUT: ["Cash Out opérateur", "Décaissement float", "Reversement espèces"],
  };
  const options = descriptions[type] ?? ["Transaction Mobile Money"];
  return options[Math.floor(Math.random() * options.length)];
}

export async function seedTransactions(
  prisma: PrismaClient,
  tenantId: string,
  agents: any[],
  floatAccounts: any[],
  customers: any[]
) {
  console.log("  → Seed Transactions (500 transactions sur 30 jours)...");

  const network = await prisma.network.findFirst({ where: { tenantId } });
  if (!network) throw new Error("Network not found");

  const transactions = [];
  const TOTAL = 500;

  const floatByAgent: Record<string, any[]> = {};
  for (const fa of floatAccounts) {
    if (!floatByAgent[fa.agentId]) floatByAgent[fa.agentId] = [];
    floatByAgent[fa.agentId].push(fa);
  }

  for (let i = 0; i < TOTAL; i++) {
    const agent = randomFrom(agents);
    const floatAccount = (floatByAgent[agent.id] ?? [])[0] ?? null;
    const customer = randomFrom(customers);
    const type = randomFrom(TRANSACTION_TYPES) as any;
    const status = randomFrom(TRANSACTION_STATUSES) as any;
    const amount = generateAmount();
    const createdAt = generateRealisticDate();
    const fee = Math.round(amount * (type === "WITHDRAWAL" ? 0.01 : 0.005) / 5) * 5;
    const commission = Math.round(fee * 0.3 / 5) * 5;
    const netAmount = amount - fee;
    const reference = `TXN-${Date.now()}-${String(i).padStart(5, "0")}`;

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type,
        status,
        amount,
        fee,
        commission,
        netAmount,
        currency: "XOF",
        operatorCode: randomFrom(OPERATORS),
        agentId: agent.id,
        agencyId: agent.agencyId,
        networkId: network.id,
        tenantId,
        senderPhone: customer?.phoneNumber ?? `+225070${String(randomBetween(1000000, 9999999))}`,
        description: generateDescription(type),
        metadata: { channel: randomFrom(["USSD", "APP", "WEB"]) },
        completedAt: status === "COMPLETED" ? new Date(createdAt.getTime() + randomBetween(5, 120) * 1000) : null,
        failureReason: status === "FAILED" ? randomFrom(["Solde insuffisant", "Timeout opérateur", "Numéro invalide"]) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    transactions.push(tx);
  }

  const completed = transactions.filter((t) => t.status === "COMPLETED").length;
  const failed = transactions.filter((t) => t.status === "FAILED").length;
  const cancelled = transactions.filter((t) => t.status === "CANCELLED").length;
  console.log(`     ${transactions.length} transactions créées (${completed} OK, ${failed} échouées, ${cancelled} annulées)`);
  return transactions;
}

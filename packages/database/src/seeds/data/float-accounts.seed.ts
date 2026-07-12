import { PrismaClient } from "@prisma/client";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedFloatAccounts(
  prisma: PrismaClient,
  tenantId: string,
  agents: any[]
) {
  console.log("  → Seed FloatAccounts...");

  // Récupérer le réseau existant
  const network = await prisma.network.findFirst({ where: { tenantId } });
  if (!network) throw new Error("Network not found — run seedNetwork first");

  const floatAccounts = [];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const balance = randomBetween(100_000, 1_500_000);
    const accountNumber = `FA-${network.operatorCode}-${String(i + 1).padStart(4, "0")}`;

    const floatAccount = await prisma.floatAccount.upsert({
      where: { tenantId_accountNumber: { tenantId, accountNumber } },
      update: { balance },
      create: {
        accountNumber,
        agentId: agent.id,
        networkId: network.id,
        tenantId,
        balance,
        maximumBalance: 5_000_000,
        minimumBalance: 50_000,
        currency: "XOF",
        isActive: true,
        lastMovementAt: new Date(Date.now() - randomBetween(0, 3600 * 1000)),
      },
    });

    floatAccounts.push(floatAccount);
  }

  console.log(`     ${floatAccounts.length} comptes float créés`);
  return floatAccounts;
}

import { PrismaClient } from "@prisma/client";

export async function seedNetwork(
  prisma: PrismaClient,
  tenantId: string,
  managerId: string
) {
  console.log("  → Seed Network...");

  const network = await prisma.network.upsert({
    where: { tenantId_operatorCode: { tenantId, operatorCode: "ORANGE_MONEY" } },
    update: {},
    create: {
      name: "Réseau Demo CI",
      operatorCode: "ORANGE_MONEY",
      country: "CI",
      currency: "XOF",
      status: "ACTIVE",
      tenantId,
      settings: {
        commissionModel: "TIERED",
        floatAlertThreshold: 50000,
        autoReplenishment: false,
      },
    },
  });

  console.log(`     Network : ${network.name} (${network.id})`);
  return network;
}

import { PrismaClient } from "@prisma/client";

export async function seedTenant(prisma: PrismaClient) {
  console.log("  → Seed Tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "ibig-demo" },
    update: {},
    create: {
      name: "IBIG Demo Network",
      slug: "ibig-demo",
      plan: "ENTERPRISE",
      country: "CI",
      currency: "XOF",
      timezone: "Africa/Abidjan",
      locale: "fr-CI",
      status: "ACTIVE",
      settings: {
        maxAgents: 500,
        maxAgencies: 50,
        features: {
          accounting: true,
          ai: true,
          hrm: true,
          multiCurrency: false,
        },
        notifications: {
          lowFloat: true,
          dailyReport: true,
          fraudAlerts: true,
        },
      },
    },
  });

  console.log(`     Tenant créé : ${tenant.name} (${tenant.id})`);
  return tenant;
}

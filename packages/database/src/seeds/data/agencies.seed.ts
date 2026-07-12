import { PrismaClient } from "@prisma/client";

const agenciesData = [
  {
    name: "Agence Plateau",
    code: "AGC-PLT-01",
    city: "Abidjan",
    address: "Avenue Houdaille, Plateau, Abidjan",
    phone: "+2250720001001",
    email: "plateau@reseau-demo.ci",
    latitude: 5.3217,
    longitude: -4.0167,
  },
  {
    name: "Agence Cocody",
    code: "AGC-COC-02",
    city: "Abidjan",
    address: "Boulevard des Martyrs, Cocody, Abidjan",
    phone: "+2250720001002",
    email: "cocody@reseau-demo.ci",
    latitude: 5.356,
    longitude: -3.9987,
  },
  {
    name: "Agence Bouaké",
    code: "AGC-BKE-03",
    city: "Bouaké",
    address: "Avenue de la République, Bouaké",
    phone: "+2250720001003",
    email: "bouake@reseau-demo.ci",
    latitude: 7.6906,
    longitude: -5.0387,
  },
  {
    name: "Agence San-Pédro",
    code: "AGC-SPD-04",
    city: "San-Pédro",
    address: "Rue du Commerce, San-Pédro",
    phone: "+2250720001004",
    email: "san-pedro@reseau-demo.ci",
    latitude: 4.7485,
    longitude: -6.636,
  },
  {
    name: "Agence Yamoussoukro",
    code: "AGC-YMK-05",
    city: "Yamoussoukro",
    address: "Avenue Houphouët-Boigny, Yamoussoukro",
    phone: "+2250720001005",
    email: "yamoussoukro@reseau-demo.ci",
    latitude: 6.8277,
    longitude: -5.2892,
  },
];

export async function seedAgencies(
  prisma: PrismaClient,
  tenantId: string,
  networkId: string,
  managerId: string
) {
  console.log("  → Seed Agencies...");

  const agencies = [];

  for (const agencyData of agenciesData) {
    const agency = await prisma.agency.upsert({
      where: { tenantId_networkId_code: { tenantId, networkId, code: agencyData.code } },
      update: {},
      create: {
        ...agencyData,
        status: "ACTIVE",
        tenantId,
        networkId,
        managerId,
        openingHours: "08:00-20:00",
      },
    });

    agencies.push(agency);
    console.log(`     Agence : ${agency.name} [${agency.city}]`);
  }

  return agencies;
}

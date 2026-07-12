import { PrismaClient } from "@prisma/client";

const firstNames = [
  "Kouadio", "Mamadou", "Ibrahim", "Kofi", "Sékou", "Brahima",
  "Aminata", "Fatoumata", "Awa", "Mariam", "Salimata", "Adjoua",
  "Ernest", "Brice", "Nathalie", "Ahou", "Marie", "Thierry",
];

const lastNames = [
  "Coulibaly", "Traoré", "Diallo", "Koné", "Bamba", "Diabaté",
  "Ouattara", "Konaté", "Sanogo", "Dosso", "Yao", "Koffi",
  "Aka", "Guéhi", "Ndiaye", "Touré", "Camara", "Keïta",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCIPhone(i: number): string {
  const prefixes = ["07", "05", "01", "08", "06"];
  const prefix = prefixes[i % prefixes.length];
  const number = String(10000000 + i).padStart(8, "0");
  return `+225${prefix}${number}`;
}

export async function seedCustomers(prisma: PrismaClient, tenantId: string) {
  console.log("  → Seed Customers (100 clients)...");

  const customers = [];

  for (let i = 0; i < 100; i++) {
    const firstName = randomFrom(firstNames);
    const lastName = randomFrom(lastNames);
    const phone = generateCIPhone(i);

    const customer = await prisma.customer.upsert({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber: phone } },
      update: {},
      create: {
        firstName,
        lastName,
        phoneNumber: phone,
        email: Math.random() < 0.3
          ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.ci`
          : null,
        status: Math.random() < 0.95 ? "ACTIVE" : "INACTIVE",
        kycVerified: Math.random() < 0.7,
        totalTransactions: randomBetween(5, 200),
        totalVolume: randomBetween(50_000, 5_000_000),
        loyaltyPoints: randomBetween(0, 5000),
        tenantId,
      },
    });

    customers.push(customer);
  }

  console.log(`     ${customers.length} clients créés`);
  return customers;
}

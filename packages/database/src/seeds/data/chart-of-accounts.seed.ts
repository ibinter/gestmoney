import { PrismaClient } from "@prisma/client";

/**
 * Plan comptable SYSCOHADA révisé
 * Adapté pour les réseaux Mobile Money
 */
const chartOfAccounts = [
  // CLASSE 1 — RESSOURCES DURABLES
  { code: "10", name: "Capital et réserves", type: "EQUITY", isGroup: true },
  { code: "101", name: "Capital social", type: "EQUITY", isGroup: false },
  { code: "106", name: "Réserves", type: "EQUITY", isGroup: false },
  { code: "12", name: "Report à nouveau", type: "EQUITY", isGroup: false },
  { code: "13", name: "Résultat net de l'exercice", type: "EQUITY", isGroup: false },
  { code: "16", name: "Emprunts et dettes financières", type: "LIABILITY", isGroup: true },
  { code: "161", name: "Emprunts bancaires", type: "LIABILITY", isGroup: false },

  // CLASSE 2 — ACTIF IMMOBILISÉ
  { code: "21", name: "Immobilisations incorporelles", type: "ASSET", isGroup: true },
  { code: "211", name: "Frais de développement", type: "ASSET", isGroup: false },
  { code: "212", name: "Brevets, licences, logiciels", type: "ASSET", isGroup: false },
  { code: "22", name: "Terrains", type: "ASSET", isGroup: false },
  { code: "23", name: "Bâtiments", type: "ASSET", isGroup: true },
  { code: "231", name: "Bâtiments administratifs", type: "ASSET", isGroup: false },
  { code: "24", name: "Matériels", type: "ASSET", isGroup: true },
  { code: "241", name: "Matériel informatique", type: "ASSET", isGroup: false },
  { code: "242", name: "Mobilier de bureau", type: "ASSET", isGroup: false },
  { code: "28", name: "Amortissements des immobilisations", type: "ASSET", isGroup: true },
  { code: "281", name: "Amort. immobilisations incorporelles", type: "ASSET", isGroup: false },
  { code: "284", name: "Amort. matériels", type: "ASSET", isGroup: false },

  // CLASSE 3 — STOCKS
  { code: "37", name: "Stocks de marchandises", type: "ASSET", isGroup: true },
  { code: "371", name: "Stocks fournitures bureau", type: "ASSET", isGroup: false },

  // CLASSE 4 — TIERS
  { code: "40", name: "Fournisseurs", type: "LIABILITY", isGroup: true },
  { code: "401", name: "Fournisseurs — dettes en cours", type: "LIABILITY", isGroup: false },
  { code: "408", name: "Fournisseurs — factures non reçues", type: "LIABILITY", isGroup: false },
  { code: "41", name: "Clients", type: "ASSET", isGroup: true },
  { code: "411", name: "Clients — créances", type: "ASSET", isGroup: false },
  { code: "419", name: "Clients créditeurs", type: "LIABILITY", isGroup: false },
  { code: "42", name: "Personnel", type: "LIABILITY", isGroup: true },
  { code: "421", name: "Personnel — rémunérations dues", type: "LIABILITY", isGroup: false },
  { code: "422", name: "Personnel — avances et acomptes", type: "ASSET", isGroup: false },
  { code: "43", name: "Organismes sociaux", type: "LIABILITY", isGroup: true },
  { code: "431", name: "Sécurité sociale — CNPS", type: "LIABILITY", isGroup: false },
  { code: "44", name: "État et collectivités publiques", type: "LIABILITY", isGroup: true },
  { code: "441", name: "État — impôts et taxes", type: "LIABILITY", isGroup: false },
  { code: "4411", name: "TVA collectée", type: "LIABILITY", isGroup: false },
  { code: "4452", name: "TVA déductible sur services", type: "ASSET", isGroup: false },
  { code: "447", name: "État — impôts sur bénéfices", type: "LIABILITY", isGroup: false },
  { code: "47", name: "Débiteurs et créditeurs divers", type: "LIABILITY", isGroup: true },
  { code: "471", name: "Débiteurs divers", type: "ASSET", isGroup: false },
  { code: "472", name: "Créditeurs divers", type: "LIABILITY", isGroup: false },

  // CLASSE 5 — TRÉSORERIE
  { code: "50", name: "Valeurs mobilières de placement", type: "ASSET", isGroup: false },
  { code: "51", name: "Banques et établissements financiers", type: "ASSET", isGroup: true },
  { code: "511", name: "Banque principale", type: "ASSET", isGroup: false },
  { code: "512", name: "Compte courant Orange Money", type: "ASSET", isGroup: false },
  { code: "513", name: "Compte courant MTN Money", type: "ASSET", isGroup: false },
  { code: "514", name: "Compte courant Wave", type: "ASSET", isGroup: false },
  { code: "515", name: "Compte courant Moov Money", type: "ASSET", isGroup: false },
  { code: "52", name: "Caisse", type: "ASSET", isGroup: true },
  { code: "521", name: "Caisse siège", type: "ASSET", isGroup: false },
  { code: "522", name: "Caisse Agence Plateau", type: "ASSET", isGroup: false },
  { code: "523", name: "Caisse Agence Cocody", type: "ASSET", isGroup: false },
  { code: "524", name: "Caisse Agence Bouaké", type: "ASSET", isGroup: false },
  { code: "525", name: "Caisse Agence San-Pédro", type: "ASSET", isGroup: false },
  { code: "526", name: "Caisse Agence Yamoussoukro", type: "ASSET", isGroup: false },
  { code: "53", name: "Float Mobile Money", type: "ASSET", isGroup: true },
  { code: "531", name: "Float Orange Money", type: "ASSET", isGroup: false },
  { code: "532", name: "Float MTN Money", type: "ASSET", isGroup: false },
  { code: "533", name: "Float Wave", type: "ASSET", isGroup: false },
  { code: "534", name: "Float Moov Money", type: "ASSET", isGroup: false },
  { code: "535", name: "Float Airtel Money", type: "ASSET", isGroup: false },

  // CLASSE 6 — CHARGES
  { code: "60", name: "Achats et variations de stocks", type: "EXPENSE", isGroup: true },
  { code: "601", name: "Achats de marchandises", type: "EXPENSE", isGroup: false },
  { code: "61", name: "Transports", type: "EXPENSE", isGroup: false },
  { code: "62", name: "Services extérieurs A", type: "EXPENSE", isGroup: true },
  { code: "621", name: "Loyers et charges locatives", type: "EXPENSE", isGroup: false },
  { code: "622", name: "Redevances licences logiciels", type: "EXPENSE", isGroup: false },
  { code: "63", name: "Services extérieurs B", type: "EXPENSE", isGroup: true },
  { code: "631", name: "Publicité et communication", type: "EXPENSE", isGroup: false },
  { code: "632", name: "Frais de télécommunication", type: "EXPENSE", isGroup: false },
  { code: "633", name: "Frais bancaires et commissions", type: "EXPENSE", isGroup: false },
  { code: "64", name: "Impôts et taxes", type: "EXPENSE", isGroup: true },
  { code: "641", name: "Impôts et taxes locaux", type: "EXPENSE", isGroup: false },
  { code: "65", name: "Autres charges", type: "EXPENSE", isGroup: false },
  { code: "66", name: "Charges de personnel", type: "EXPENSE", isGroup: true },
  { code: "661", name: "Rémunérations du personnel", type: "EXPENSE", isGroup: false },
  { code: "662", name: "Charges sociales patronales", type: "EXPENSE", isGroup: false },
  { code: "681", name: "Dotations aux amortissements", type: "EXPENSE", isGroup: false },

  // CLASSE 7 — PRODUITS
  { code: "70", name: "Ventes et produits annexes", type: "REVENUE", isGroup: true },
  { code: "701", name: "Commissions dépôts Mobile Money", type: "REVENUE", isGroup: false },
  { code: "702", name: "Commissions retraits Mobile Money", type: "REVENUE", isGroup: false },
  { code: "703", name: "Commissions cash in opérateurs", type: "REVENUE", isGroup: false },
  { code: "704", name: "Commissions cash out opérateurs", type: "REVENUE", isGroup: false },
  { code: "705", name: "Frais de gestion réseau", type: "REVENUE", isGroup: false },
  { code: "706", name: "Commissions fidélité", type: "REVENUE", isGroup: false },
  { code: "71", name: "Subventions d'exploitation", type: "REVENUE", isGroup: false },
  { code: "75", name: "Autres produits", type: "REVENUE", isGroup: false },
  { code: "77", name: "Produits financiers", type: "REVENUE", isGroup: false },
];

export async function seedChartOfAccounts(
  prisma: PrismaClient,
  tenantId: string,
  fiscalYearId: string
) {
  console.log("  → Seed Plan Comptable SYSCOHADA...");

  const accounts = [];

  for (const account of chartOfAccounts) {
    const acc = await prisma.accountChart.upsert({
      where: {
        tenantId_code: { tenantId, code: account.code },
      },
      update: { name: account.name },
      create: {
        code: account.code,
        name: account.name,
        type: account.type as any,
        isActive: true,
        tenantId,
        level: account.code.length <= 2 ? 1 : account.code.length <= 3 ? 2 : 3,
        normalBalance: ["1","2","6"].some(p => account.code.startsWith(p)) ? "DEBIT" : "CREDIT",
      },
    });

    accounts.push(acc);
  }

  console.log(`     ${accounts.length} comptes créés (SYSCOHADA Mobile Money)`);
  return accounts;
}

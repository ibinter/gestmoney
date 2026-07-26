import { PrismaClient } from "@prisma/client";

const TAUX_PAR_DEFAUT = [
  { deviseBase: "XOF", deviseCible: "EUR", taux: 0.00152 }, // 1 EUR ≈ 655 FCFA
  { deviseBase: "XOF", deviseCible: "USD", taux: 0.00165 }, // 1 USD ≈ 607 FCFA
  { deviseBase: "XOF", deviseCible: "GBP", taux: 0.00126 }, // 1 GBP ≈ 794 FCFA
  { deviseBase: "XOF", deviseCible: "CNY", taux: 0.01196 }, // 1 CNY ≈ 84 FCFA
];

export async function seedTauxChange(prisma: PrismaClient) {
  let count = 0;
  for (const taux of TAUX_PAR_DEFAUT) {
    await prisma.tauxChange.upsert({
      where: {
        deviseBase_deviseCible: {
          deviseBase: taux.deviseBase,
          deviseCible: taux.deviseCible,
        },
      },
      update: { taux: taux.taux },
      create: { ...taux, source: "MANUAL" },
    });
    count++;
    console.log(
      `   ✓ Taux ${taux.deviseBase} → ${taux.deviseCible} : ${taux.taux}`,
    );
  }
  return count;
}

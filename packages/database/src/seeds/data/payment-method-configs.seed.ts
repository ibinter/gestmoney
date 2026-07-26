/**
 * Seed — PaymentMethodConfig (Mobile Money IBIG SARL)
 *
 * Crée (ou met à jour) les quatre comptes Mobile Money de la plateforme.
 * Ces entrées sont globales (tenantId = null) et servent à tous les tenants
 * sauf si un tenant définit les siennes (contrainte unique tenantId+methode+variante).
 *
 * Idempotent : peut être relancé sans erreur grâce aux upserts.
 */

import { PrismaClient } from "@prisma/client";

const INSTRUCTION_MOBILE_MONEY =
  "Effectuez votre paiement au numéro indiqué ci-dessous, puis envoyez votre reçu via le formulaire ci-dessous.";

const COMPTES_MOBILE_MONEY = [
  {
    variante: "ORANGE_MONEY",
    libelle: "Orange Money — IBIG SARL",
    numero: "+225 07 78 88 25 92",
    ordreAffichage: 1,
  },
  {
    variante: "MOOV_MONEY",
    libelle: "Moov Money — IBIG SARL",
    numero: "+225 01 53 59 55 44",
    ordreAffichage: 2,
  },
  {
    variante: "MTN_MOMO",
    libelle: "MTN MoMo — IBIG SARL",
    numero: "+225 05 55 05 99 01",
    ordreAffichage: 3,
  },
  {
    variante: "WAVE",
    libelle: "Wave — IBIG SARL",
    numero: "+225 07 78 88 25 92",
    ordreAffichage: 4,
  },
] as const;

export async function seedPaymentMethodConfigs(
  prisma: PrismaClient
): Promise<void> {
  console.log("  → Moyens de paiement Mobile Money IBIG SARL");

  for (const compte of COMPTES_MOBILE_MONEY) {
    const donnees = {
      libelle: compte.libelle,
      actif: true,
      sandbox: false,
      parametres: {
        titulaire: "IBIG SARL",
        numero: compte.numero,
        instructions: INSTRUCTION_MOBILE_MONEY,
      },
      devises: ["XOF"],
      ordreAffichage: compte.ordreAffichage,
    };

    // Prisma's unique key includes nullable tenantId : on cherche d'abord
    // puis on crée ou met à jour — plus fiable que upsert sur clé avec null.
    const existant = await prisma.paymentMethodConfig.findFirst({
      where: {
        tenantId: null,
        methode: "MOBILE_MONEY_MANUEL",
        variante: compte.variante,
      },
    });

    if (existant) {
      await prisma.paymentMethodConfig.update({
        where: { id: existant.id },
        data: donnees,
      });
    } else {
      await prisma.paymentMethodConfig.create({
        data: {
          tenantId: null,
          methode: "MOBILE_MONEY_MANUEL",
          variante: compte.variante,
          secrets: {},
          paysAutorises: [],
          plansAutorises: [],
          ...donnees,
        },
      });
    }

    console.log(`     ✓ ${compte.libelle} (${compte.numero})`);
  }
}

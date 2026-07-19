-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY_MANUEL', 'PASSERELLE', 'VIREMENT_NATIONAL', 'VIREMENT_INTERNATIONAL', 'TRANSFERT_ARGENT', 'ESPECES_AGENCE', 'CHEQUE', 'CRYPTO', 'VOUCHER', 'PAIEMENT_LIVRAISON');

-- CreateEnum
CREATE TYPE "ProofStatut" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "VoucherStatut" AS ENUM ('DISPONIBLE', 'UTILISE', 'EXPIRE', 'ANNULE');

-- CreateTable
CREATE TABLE "payment_method_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "methode" "PaymentMethod" NOT NULL,
    "variante" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "parametres" JSONB NOT NULL DEFAULT '{}',
    "secrets" JSONB NOT NULL DEFAULT '{}',
    "paysAutorises" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plansAutorises" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "devises" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordreAffichage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_config_audits" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "userId" TEXT,
    "champ" TEXT NOT NULL,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_config_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "paiementId" TEXT NOT NULL,
    "cheminFichier" TEXT,
    "nomOriginal" TEXT,
    "mimeType" TEXT,
    "tailleOctets" INTEGER,
    "hashSha256" TEXT,
    "referenceTexte" TEXT,
    "statut" "ProofStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRejet" TEXT,
    "revuPar" TEXT,
    "revuAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "traite" BOOLEAN NOT NULL DEFAULT false,
    "traiteAt" TIMESTAMP(3),
    "erreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "lot" TEXT,
    "plan" TEXT,
    "valeur" DECIMAL(15,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "dureeJours" INTEGER NOT NULL DEFAULT 30,
    "statut" "VoucherStatut" NOT NULL DEFAULT 'DISPONIBLE',
    "utilisePar" TEXT,
    "utiliseAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_method_configs_actif_idx" ON "payment_method_configs"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_configs_tenantId_methode_variante_key" ON "payment_method_configs"("tenantId", "methode", "variante");

-- CreateIndex
CREATE INDEX "payment_config_audits_configId_idx" ON "payment_config_audits"("configId");

-- CreateIndex
CREATE INDEX "payment_config_audits_createdAt_idx" ON "payment_config_audits"("createdAt");

-- CreateIndex
CREATE INDEX "payment_proofs_paiementId_idx" ON "payment_proofs"("paiementId");

-- CreateIndex
CREATE INDEX "payment_proofs_hashSha256_idx" ON "payment_proofs"("hashSha256");

-- CreateIndex
CREATE INDEX "payment_proofs_statut_idx" ON "payment_proofs"("statut");

-- CreateIndex
CREATE INDEX "webhook_events_traite_idx" ON "webhook_events"("traite");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_statut_idx" ON "vouchers"("statut");

-- CreateIndex
CREATE INDEX "vouchers_lot_idx" ON "vouchers"("lot");

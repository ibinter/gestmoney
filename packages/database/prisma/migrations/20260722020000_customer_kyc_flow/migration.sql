-- Flux KYC client : statut 3 états + document (base64) + motif de rejet.
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycRejectionReason" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycDocumentUrl" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycDocumentType" TEXT;
-- Backfill : les clients déjà vérifiés passent à VERIFIED.
UPDATE "customers" SET "kycStatus" = 'VERIFIED' WHERE "kycVerified" = true;

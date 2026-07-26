-- Migration: Add ImpersonationSession table
-- Run: prisma migrate dev --name add_impersonation_session

CREATE TABLE "impersonation_sessions" (
    "id"             TEXT NOT NULL,
    "superAdminId"   TEXT NOT NULL,
    "targetUserId"   TEXT NOT NULL,
    "targetTenantId" TEXT NOT NULL,
    "raison"         TEXT NOT NULL,
    "token"          TEXT NOT NULL,
    "actif"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt"   TIMESTAMP(3),
    "ipAddress"      TEXT,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "impersonation_sessions_token_key" ON "impersonation_sessions"("token");
CREATE INDEX "impersonation_sessions_superAdminId_idx" ON "impersonation_sessions"("superAdminId");
CREATE INDEX "impersonation_sessions_targetUserId_idx" ON "impersonation_sessions"("targetUserId");
CREATE INDEX "impersonation_sessions_actif_idx" ON "impersonation_sessions"("actif");

-- Pièces jointes des messages de ticket : stockées en data URL base64
-- (Cloudflare réinitialise les uploads multipart — cf. avatar).
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "pieceJointe" TEXT;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "pieceJointeNom" TEXT;

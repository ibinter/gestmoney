-- Ajoute un champ WhatsApp distinct sur les comptes utilisateurs.
-- Additif et idempotent : aucune donnée existante n'est touchée.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

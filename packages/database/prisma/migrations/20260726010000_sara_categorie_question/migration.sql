-- Migration : ajout des colonnes categorieQuestion et escaladeHumain
-- sur la table sara_conversations pour les métriques SARA.

ALTER TABLE "sara_conversations"
  ADD COLUMN IF NOT EXISTS "categorieQuestion" TEXT NOT NULL DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS "escaladeHumain"    BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "sara_conversations_categorieQuestion_idx"
  ON "sara_conversations" ("categorieQuestion");

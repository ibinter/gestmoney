-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProspectOrigine" AS ENUM ('SITE_WEB', 'SARA', 'WHATSAPP', 'REFERRAL', 'IBIG_PARTNERS', 'SALON', 'COLD_CALL', 'EMAIL_CAMPAGNE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ProspectPriorite" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "ProspectStatut" AS ENUM ('NOUVEAU', 'A_CONTACTER', 'CONTACTE', 'QUALIFIE', 'DEMO_PREVUE', 'DEMO_REALISEE', 'OFFRE_ENVOYEE', 'NEGOCIATION', 'GAGNE', 'PERDU', 'A_RELANCER');

-- CreateEnum
CREATE TYPE "DemoMode" AS ENUM ('VISIO', 'PRESENTIEL', 'TELEPHONE', 'ENREGISTREMENT');

-- CreateEnum
CREATE TYPE "DemoStatut" AS ENUM ('PLANIFIEE', 'CONFIRMEE', 'REALISEE', 'ANNULEE', 'REPORTEE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "OffreStatut" AS ENUM ('BROUILLON', 'ENVOYEE', 'CONSULTEE', 'ACCEPTEE', 'REFUSEE', 'EXPIREE', 'CONVERTIE');

-- CreateEnum
CREATE TYPE "LicenceEventType" AS ENUM ('ESSAI_ACTIVE', 'ABONNEMENT_ACTIVE', 'ABONNEMENT_RENOUVELE', 'ABONNEMENT_UPGRAYE', 'ABONNEMENT_DEGRADE', 'ABONNEMENT_SUSPENDU', 'ABONNEMENT_EXPIRE', 'ABONNEMENT_REACTIVE', 'PERIODE_GRACE_ACTIVEE', 'COUPON_APPLIQUE', 'REMBOURSEMENT');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CINETPAY', 'MONEROO', 'FEDAPAY', 'PAYSTACK', 'FLUTTERWAVE', 'STRIPE', 'MOBILE_MONEY', 'VIREMENT', 'ESPECES', 'MANUEL');

-- CreateEnum
CREATE TYPE "PaiementStatut" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'REUSSI', 'ECHOUE', 'REMBOURSE', 'ANNULE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "TicketPriorite" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "TicketStatut" AS ENUM ('NOUVEAU', 'OUVERT', 'EN_COURS', 'ATTENTE_CLIENT', 'ESCALADE', 'RESOLU', 'FERME');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "agencyId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "expectedDeliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "entreprise" TEXT,
    "fonction" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "whatsapp" TEXT,
    "pays" TEXT,
    "secteur" TEXT,
    "tailleEntreprise" TEXT,
    "logiciel" TEXT NOT NULL DEFAULT 'GESTMONEY',
    "besoin" TEXT,
    "budgetIndicatif" TEXT,
    "origine" "ProspectOrigine" NOT NULL DEFAULT 'SITE_WEB',
    "campagne" TEXT,
    "responsableId" TEXT,
    "priorite" "ProspectPriorite" NOT NULL DEFAULT 'NORMALE',
    "score" INTEGER NOT NULL DEFAULT 0,
    "statut" "ProspectStatut" NOT NULL DEFAULT 'NOUVEAU',
    "consentement" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "prochainerAction" TEXT,
    "dateRelance" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstrations" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "entreprise" TEXT NOT NULL,
    "logiciel" TEXT NOT NULL DEFAULT 'GESTMONEY',
    "date" TIMESTAMP(3) NOT NULL,
    "fuseau" TEXT NOT NULL DEFAULT 'Africa/Abidjan',
    "mode" "DemoMode" NOT NULL DEFAULT 'VISIO',
    "lienVisio" TEXT,
    "agentId" TEXT,
    "besoins" TEXT,
    "notes" TEXT,
    "statut" "DemoStatut" NOT NULL DEFAULT 'PLANIFIEE',
    "compteRendu" TEXT,
    "prochainerEtape" TEXT,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "confirme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demonstrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offres" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "prospectId" TEXT,
    "entreprise" TEXT NOT NULL,
    "logiciel" TEXT NOT NULL DEFAULT 'GESTMONEY',
    "formule" TEXT,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "nbUtilisateurs" INTEGER NOT NULL DEFAULT 1,
    "nbSites" INTEGER NOT NULL DEFAULT 1,
    "dureesMois" INTEGER NOT NULL DEFAULT 12,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "prixHT" DECIMAL(15,2) NOT NULL,
    "remise" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "prixTTC" DECIMAL(15,2) NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "formation" BOOLEAN NOT NULL DEFAULT false,
    "migration" BOOLEAN NOT NULL DEFAULT false,
    "accompagnement" BOOLEAN NOT NULL DEFAULT false,
    "validiteJours" INTEGER NOT NULL DEFAULT 30,
    "conditions" TEXT,
    "statut" "OffreStatut" NOT NULL DEFAULT 'BROUILLON',
    "signeeAt" TIMESTAMP(3),
    "accepteeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "demonstrationId" TEXT,

    CONSTRAINT "offres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licence_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "offreId" TEXT,
    "type" "LicenceEventType" NOT NULL,
    "plan" TEXT,
    "montant" DECIMAL(15,2),
    "devise" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "periodeGrace" TIMESTAMP(3),
    "motif" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "licence_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "reference" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT,
    "statut" "PaiementStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "webhookPayload" JSONB,
    "validePar" TEXT,
    "valideAt" TIMESTAMP(3),
    "rembourseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sara_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'PUBLIC',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "prospect" JSONB,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "modele" TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sara_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sara_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "modele" TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "systemPrompt" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "quotaJournalier" INTEGER NOT NULL DEFAULT 100,
    "quotaMensuel" INTEGER NOT NULL DEFAULT 2000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sara_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages_legales" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titreFr" TEXT NOT NULL,
    "titreEn" TEXT NOT NULL,
    "contenuFr" TEXT NOT NULL,
    "contenuEn" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "publiee" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pages_legales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "page" TEXT,
    "element" TEXT,
    "valeur" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "userAgent" TEXT,
    "pays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sujetFr" TEXT NOT NULL,
    "sujetEn" TEXT NOT NULL,
    "htmlFr" TEXT NOT NULL,
    "htmlEn" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "to" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "template" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'PENDING',
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "objet" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT,
    "priorite" "TicketPriorite" NOT NULL DEFAULT 'NORMALE',
    "logiciel" TEXT NOT NULL DEFAULT 'GESTMONEY',
    "module" TEXT,
    "navigateur" TEXT,
    "appareil" TEXT,
    "statut" "TicketStatut" NOT NULL DEFAULT 'NOUVEAU',
    "agentId" TEXT,
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "auteurId" TEXT,
    "contenu" TEXT NOT NULL,
    "interne" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenantId_name_key" ON "suppliers"("tenantId", "name");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_idx" ON "purchase_orders"("tenantId");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_tenantId_reference_key" ON "purchase_orders"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "purchase_order_lines_purchaseOrderId_idx" ON "purchase_order_lines"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "prospects_statut_idx" ON "prospects"("statut");

-- CreateIndex
CREATE INDEX "prospects_email_idx" ON "prospects"("email");

-- CreateIndex
CREATE INDEX "prospects_createdAt_idx" ON "prospects"("createdAt");

-- CreateIndex
CREATE INDEX "demonstrations_date_idx" ON "demonstrations"("date");

-- CreateIndex
CREATE INDEX "demonstrations_statut_idx" ON "demonstrations"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "offres_reference_key" ON "offres"("reference");

-- CreateIndex
CREATE INDEX "offres_statut_idx" ON "offres"("statut");

-- CreateIndex
CREATE INDEX "offres_createdAt_idx" ON "offres"("createdAt");

-- CreateIndex
CREATE INDEX "licence_events_tenantId_idx" ON "licence_events"("tenantId");

-- CreateIndex
CREATE INDEX "licence_events_type_idx" ON "licence_events"("type");

-- CreateIndex
CREATE INDEX "licence_events_createdAt_idx" ON "licence_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_tenantId_idx" ON "paiements"("tenantId");

-- CreateIndex
CREATE INDEX "paiements_statut_idx" ON "paiements"("statut");

-- CreateIndex
CREATE INDEX "paiements_provider_idx" ON "paiements"("provider");

-- CreateIndex
CREATE INDEX "paiements_createdAt_idx" ON "paiements"("createdAt");

-- CreateIndex
CREATE INDEX "sara_conversations_tenantId_idx" ON "sara_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "sara_conversations_sessionId_idx" ON "sara_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "sara_conversations_createdAt_idx" ON "sara_conversations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sara_configs_tenantId_key" ON "sara_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_legales_slug_key" ON "pages_legales"("slug");

-- CreateIndex
CREATE INDEX "analytics_events_type_idx" ON "analytics_events"("type");

-- CreateIndex
CREATE INDEX "analytics_events_tenantId_idx" ON "analytics_events"("tenantId");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_slug_key" ON "email_templates"("slug");

-- CreateIndex
CREATE INDEX "email_logs_tenantId_idx" ON "email_logs"("tenantId");

-- CreateIndex
CREATE INDEX "email_logs_statut_idx" ON "email_logs"("statut");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_key" ON "tickets"("numero");

-- CreateIndex
CREATE INDEX "tickets_tenantId_idx" ON "tickets"("tenantId");

-- CreateIndex
CREATE INDEX "tickets_statut_idx" ON "tickets"("statut");

-- CreateIndex
CREATE INDEX "tickets_createdAt_idx" ON "tickets"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstrations" ADD CONSTRAINT "demonstrations_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offres" ADD CONSTRAINT "offres_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offres" ADD CONSTRAINT "offres_demonstrationId_fkey" FOREIGN KEY ("demonstrationId") REFERENCES "demonstrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licence_events" ADD CONSTRAINT "licence_events_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "offres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;


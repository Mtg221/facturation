-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'COMPTABLE', 'CAISSIER', 'LECTURE');

-- CreateEnum
CREATE TYPE "StatutFacture" AS ENUM ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE', 'CARTE', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('FACTURE_CREEE', 'FACTURE_ENVOYEE', 'PAIEMENT_RECU', 'FACTURE_EN_RETARD', 'SYSTEME');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LECTURE',
    "avatar" TEXT,
    "telephone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "refreshTokenDevice" TEXT,
    "refreshTokenIP" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secteurs_activite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "secteurs_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone1" TEXT,
    "telephone2" TEXT,
    "telephone3" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Sénégal',
    "localisation" TEXT,
    "ninea" TEXT,
    "rc" TEXT,
    "commentaire" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_secteurs" (
    "clientId" TEXT NOT NULL,
    "secteurId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_secteurs_pkey" PRIMARY KEY ("clientId","secteurId")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "prix" DECIMAL(15,2) NOT NULL,
    "tva" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "unite" TEXT NOT NULL DEFAULT 'unité',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "statut" "StatutFacture" NOT NULL DEFAULT 'BROUILLON',
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "conditionsPaiement" TEXT,
    "remiseGlobale" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "montantHT" DECIMAL(15,2) NOT NULL,
    "montantTVA" DECIMAL(15,2) NOT NULL,
    "montantTTC" DECIMAL(15,2) NOT NULL,
    "montantPaye" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "resteAPayer" DECIMAL(15,2) NOT NULL,
    "montantEnLettres" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_factures" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "produitId" TEXT,
    "designation" TEXT NOT NULL,
    "quantite" DECIMAL(10,3) NOT NULL,
    "prixUnitaire" DECIMAL(15,2) NOT NULL,
    "tva" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "remise" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "montantHT" DECIMAL(15,2) NOT NULL,
    "montantTVA" DECIMAL(15,2) NOT NULL,
    "montantTTC" DECIMAL(15,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "detail_factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "numeroCheque" TEXT,
    "banque" TEXT,
    "reference" TEXT,
    "commentaire" TEXT,
    "recuPar" TEXT,
    "payePar" TEXT,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "utilisateur" TEXT,
    "action" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "entityId" TEXT,
    "ancienneValeur" JSONB,
    "nouvelleValeur" JSONB,
    "adresseIP" TEXT,
    "navigateur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "data" JSONB,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_refreshToken_idx" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "secteurs_activite_nom_key" ON "secteurs_activite"("nom");

-- CreateIndex
CREATE INDEX "secteurs_activite_deletedAt_idx" ON "secteurs_activite"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE INDEX "clients_nom_idx" ON "clients"("nom");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_telephone1_idx" ON "clients"("telephone1");

-- CreateIndex
CREATE INDEX "clients_deletedAt_idx" ON "clients"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "produits_reference_key" ON "produits"("reference");

-- CreateIndex
CREATE INDEX "produits_designation_idx" ON "produits"("designation");

-- CreateIndex
CREATE INDEX "produits_deletedAt_idx" ON "produits"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE INDEX "factures_clientId_idx" ON "factures"("clientId");

-- CreateIndex
CREATE INDEX "factures_statut_idx" ON "factures"("statut");

-- CreateIndex
CREATE INDEX "factures_dateEmission_idx" ON "factures"("dateEmission");

-- CreateIndex
CREATE INDEX "factures_dateEcheance_idx" ON "factures"("dateEcheance");

-- CreateIndex
CREATE INDEX "factures_numero_idx" ON "factures"("numero");

-- CreateIndex
CREATE INDEX "factures_deletedAt_idx" ON "factures"("deletedAt");

-- CreateIndex
CREATE INDEX "detail_factures_factureId_idx" ON "detail_factures"("factureId");

-- CreateIndex
CREATE INDEX "paiements_factureId_idx" ON "paiements"("factureId");

-- CreateIndex
CREATE INDEX "paiements_datePaiement_idx" ON "paiements"("datePaiement");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_table_idx" ON "audit_logs"("table");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_lu_idx" ON "notifications"("lu");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_secteurs" ADD CONSTRAINT "client_secteurs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_secteurs" ADD CONSTRAINT "client_secteurs_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "secteurs_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_factures" ADD CONSTRAINT "detail_factures_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_factures" ADD CONSTRAINT "detail_factures_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

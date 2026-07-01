-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- DropIndex
DROP INDEX "clients_code_key";

-- DropIndex
DROP INDEX "factures_numero_key";

-- DropIndex
DROP INDEX "produits_reference_key";

-- DropIndex
DROP INDEX "secteurs_activite_nom_key";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "factures" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "produits" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "secteurs_activite" ADD COLUMN     "societeId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "societeId" TEXT;

-- CreateTable
CREATE TABLE "societes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "ninea" TEXT,
    "rc" TEXT,
    "banque" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "societes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "societes_deletedAt_idx" ON "societes"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_societeId_idx" ON "audit_logs"("societeId");

-- CreateIndex
CREATE INDEX "clients_societeId_idx" ON "clients"("societeId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_societeId_code_key" ON "clients"("societeId", "code");

-- CreateIndex
CREATE INDEX "factures_societeId_idx" ON "factures"("societeId");

-- CreateIndex
CREATE UNIQUE INDEX "factures_societeId_numero_key" ON "factures"("societeId", "numero");

-- CreateIndex
CREATE INDEX "paiements_societeId_idx" ON "paiements"("societeId");

-- CreateIndex
CREATE INDEX "produits_societeId_idx" ON "produits"("societeId");

-- CreateIndex
CREATE UNIQUE INDEX "produits_societeId_reference_key" ON "produits"("societeId", "reference");

-- CreateIndex
CREATE INDEX "secteurs_activite_societeId_idx" ON "secteurs_activite"("societeId");

-- CreateIndex
CREATE INDEX "users_societeId_idx" ON "users"("societeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secteurs_activite" ADD CONSTRAINT "secteurs_activite_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;


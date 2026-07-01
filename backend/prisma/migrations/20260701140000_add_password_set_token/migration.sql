-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordSetToken" TEXT,
ADD COLUMN "passwordSetTokenExpiry" TIMESTAMP(3);

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RiskType" ADD VALUE 'COMPLIANCE';
ALTER TYPE "RiskType" ADD VALUE 'FINANCIAL';
ALTER TYPE "RiskType" ADD VALUE 'LEGAL';
ALTER TYPE "RiskType" ADD VALUE 'OPERATIONAL';
ALTER TYPE "RiskType" ADD VALUE 'REPUTATIONAL';

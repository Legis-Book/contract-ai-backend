/*
  Warnings:

  - Added the required column `analysisId` to the `Clause` table without a default value. This is not possible if the table is not empty.
  - Added the required column `analysisId` to the `RiskFlag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clause" ADD COLUMN     "analysisId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RiskFlag" ADD COLUMN     "analysisId" TEXT NOT NULL,
ADD COLUMN     "confidence" DOUBLE PRECISION;

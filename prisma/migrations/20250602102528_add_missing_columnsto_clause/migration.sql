-- CreateEnum
CREATE TYPE "ClauseRiskLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "Clause" ADD COLUMN     "amounts" TEXT,
ADD COLUMN     "classification" TEXT,
ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "dates" TEXT,
ADD COLUMN     "entities" TEXT,
ADD COLUMN     "legalReferences" TEXT,
ADD COLUMN     "obligation" TEXT,
ADD COLUMN     "riskJustification" TEXT,
ADD COLUMN     "riskLevel" "ClauseRiskLevel",
ADD COLUMN     "title" TEXT,
ALTER COLUMN "endIndex" DROP NOT NULL,
ALTER COLUMN "startIndex" DROP NOT NULL;

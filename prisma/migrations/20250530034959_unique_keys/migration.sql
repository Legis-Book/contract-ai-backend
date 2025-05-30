/*
  Warnings:

  - The `allowedDeviations` column on the `StandardClause` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[socialId,provider]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[socialId,provider]` on the table `UserEntity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,repoId]` on the table `VcRef` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `number` on the `Clause` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `notes` to the `RiskFlag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `RiskFlag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RiskFlagStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- AlterTable
ALTER TABLE "Clause" DROP COLUMN "number",
ADD COLUMN     "number" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RiskFlag" ADD COLUMN     "notes" TEXT NOT NULL,
ADD COLUMN     "status" "RiskFlagStatus" NOT NULL;

-- AlterTable
ALTER TABLE "StandardClause" ADD COLUMN     "isActive" BOOLEAN,
ADD COLUMN     "isLatest" BOOLEAN,
DROP COLUMN "allowedDeviations",
ADD COLUMN     "allowedDeviations" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "User_socialId_provider_key" ON "User"("socialId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserEntity_socialId_provider_key" ON "UserEntity"("socialId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "VcRef_id_repoId_key" ON "VcRef"("id", "repoId");

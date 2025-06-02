/*
  Warnings:

  - A unique constraint covering the columns `[uniqueHash]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueHash` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "uniqueHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_uniqueHash_key" ON "Contract"("uniqueHash");

/*
  Warnings:

  - Added the required column `endIndex` to the `Clause` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startIndex` to the `Clause` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clause" ADD COLUMN     "endIndex" INTEGER NOT NULL,
ADD COLUMN     "startIndex" INTEGER NOT NULL;

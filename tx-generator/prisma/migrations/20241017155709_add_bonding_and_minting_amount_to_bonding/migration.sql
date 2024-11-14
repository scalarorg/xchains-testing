/*
  Warnings:

  - Added the required column `bondAmount` to the `BondingTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mintAmount` to the `BondingTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BondingTransaction" ADD COLUMN     "bondAmount" BIGINT NOT NULL,
ADD COLUMN     "mintAmount" BIGINT NOT NULL;

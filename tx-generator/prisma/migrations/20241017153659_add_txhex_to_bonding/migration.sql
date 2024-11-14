/*
  Warnings:

  - Added the required column `txhex` to the `BondingTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BondingTransaction" ADD COLUMN     "txhex" TEXT NOT NULL;

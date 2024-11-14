/*
  Warnings:

  - You are about to drop the column `amount` on the `BondingTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `BondingTransaction` table. All the data in the column will be lost.
  - Added the required column `staker_address` to the `BondingTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staker_pubkey` to the `BondingTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BondingTransaction" DROP COLUMN "amount",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "staker_address" TEXT NOT NULL,
ADD COLUMN     "staker_pubkey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BondingTransaction" (
    "id" SERIAL NOT NULL,
    "txid" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BondingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BondingTransaction_txid_key" ON "BondingTransaction"("txid");

-- CreateTable
CREATE TABLE "FundedAccount" (
    "id" TEXT NOT NULL,
    "btcAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "FundedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FundedAccount_btcAddress_key" ON "FundedAccount"("btcAddress");

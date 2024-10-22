import { ProjectENV } from "@/env";
import { sendBitcoin } from "@/transactions/sendBitcoin";
import { sendEther } from "@/transactions/sendEther";
import { BitcoinAccount } from "@/types/bitcoin";
import { EthereumAccount } from "@/types/eth";
import { StakerAccount } from "@/types/staker";
import { getAccountsPath } from "@/utils/path";
import prisma from "@/utils/prisma";
import fs from "fs";

export const performFunding = async (): Promise<
  | {
      btcTxid?: string;
      ethTxHash?: string;
      btcFundingAmount?: number;
      ethFundingAmount?: number;
    }
  | undefined
> => {
  const networkName = ProjectENV.NETWORK;
  const accountFileName = ProjectENV.ACCOUNT_FILE_NAME;
  const btcFundingAmount = Number(ProjectENV.BTC_FUNDING_AMOUNT);
  const ethFundingAmount = ProjectENV.ETH_FUNDING_AMOUNT;
  const ethRpcUrl = ProjectENV.ETH_RPC_URL;
  const btcSenderAccount: BitcoinAccount = {
    address: ProjectENV.FUNDING_BTC_ADDRESS,
    privateKeyWIF: ProjectENV.FUNDING_BTC_PRIVATE_KEY_WIF,
    publicKey: ProjectENV.FUNDING_BTC_PUBLIC_KEY,
    privateKeyHex: ProjectENV.FUNDING_BTC_PRIVATE_KEY_HEX,
  };
  const ethSenderAccount: EthereumAccount = {
    address: ProjectENV.FUNDING_ETH_ADDRESS,
    privateKey: ProjectENV.FUNDING_ETH_PRIVATE_KEY,
  };

  // Get accounts to fund
  const accountsFilePath = getAccountsPath(networkName, accountFileName);
  const candidateAccounts: StakerAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );

  // Choose a random account from the candidate accounts that hasn't been funded yet
  // Get funded accounts from prisma
  const fundedAccounts = await prisma.fundedAccount.findMany({
    select: { btcAddress: true },
  });

  // Create a Set of funded BTC addresses for efficient lookup
  const fundedBtcAddresses = new Set(
    fundedAccounts.map((account: { btcAddress: string }) => account.btcAddress)
  );

  // Filter out accounts that have already been funded
  const unfundedAccounts = candidateAccounts.filter(
    (account) => !fundedBtcAddresses.has(account.btcAddress)
  );

  if (unfundedAccounts.length === 0) {
    console.log("All accounts have been funded");
    return;
  }

  // Choose a random account from the unfunded accounts
  const randomIndex = Math.floor(Math.random() * unfundedAccounts.length);
  const selectedAccount = unfundedAccounts[randomIndex];

  if (!selectedAccount) {
    console.error("Selected account not found");
    return;
  }

  const result: {
    btcTxid?: string;
    ethTxHash?: string;
    btcFundingAmount?: number;
    ethFundingAmount?: number;
  } = {};

  try {
    // Fund Bitcoin
    const btcTxid = await sendBitcoin(
      btcSenderAccount,
      selectedAccount.btcAddress,
      btcFundingAmount,
      networkName
    );
    console.log(
      "Bitcoin funding transaction sent successfully. TXID:",
      btcTxid
    );
    result.btcTxid = btcTxid;
    result.btcFundingAmount = btcFundingAmount;

    // Fund Ethereum
    const ethTxHash = await sendEther(
      ethSenderAccount,
      selectedAccount.ethAddress,
      ethFundingAmount,
      ethRpcUrl
    );
    console.log(
      "Ethereum funding transaction sent successfully. TX Hash:",
      ethTxHash
    );
    result.ethTxHash = ethTxHash;
    result.ethFundingAmount = Number(ethFundingAmount);

    // Update or create the funded account record
    // Save BTC address and status
    await prisma.fundedAccount.upsert({
      where: { btcAddress: selectedAccount.btcAddress },
      update: {
        btcAddress: selectedAccount.btcAddress,
        status: "FUNDED",
      },
      create: {
        btcAddress: selectedAccount.btcAddress,
        status: "FUNDED",
      },
    });

    console.log("--- Funding completed");

    return result;
  } catch (error) {
    console.error("Error sending funding transactions:", error);
  }
};

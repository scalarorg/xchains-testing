import { ProjectENV } from "@/env";
import { sendBitcoin } from "@/transactions/sendBitcoin";
import { sendEther } from "@/transactions/sendEther";
import { BitcoinAccount } from "@/types/bitcoin";
import { EthereumAccount } from "@/types/eth";
import { StakerAccount } from "@/types/staker";
import { getAccountsPath, getFundingConfigPath } from "@/utils/path";
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
  const configPath = getFundingConfigPath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const {
    senderAccount,
    btcFundingAmount,
    ethFundingAmount,
    accountFileName,
    ethRpcUrl,
  } = config;
  const networkName = ProjectENV.NETWORK;

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
    fundedAccounts.map((account) => account.btcAddress)
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
    const btcSenderAccount: BitcoinAccount = {
      address: senderAccount.btcAddress,
      privateKeyWIF: senderAccount.btcPrivateKeyWIF,
      publicKey: senderAccount.btcPublicKey,
      privateKeyHex: senderAccount.btcPrivateKeyHex,
    };
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
    const ethSenderAccount: EthereumAccount = {
      address: senderAccount.ethAddress,
      privateKey: senderAccount.ethPrivateKey,
    };
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
    result.ethFundingAmount = ethFundingAmount;

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

    return result;
  } catch (error) {
    console.error("Error sending funding transactions:", error);
  }
};

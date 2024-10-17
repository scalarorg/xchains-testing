import { ProjectENV } from "@/env";
import { sendBondingTx } from "@/transactions/sendBondingTx";
import { BitcoinAccount } from "@/types/bitcoin";
import { StakerAccount } from "@/types/staker";
import { getAccountsPath, getStakingConfigPath } from "@/utils/path";
import prisma from "@/utils/prisma";
import fs from "fs";

export const performStaking = async (): Promise<
  | {
      txid: string;
      stakingAmount: number;
    }
  | undefined
> => {
  const configPath = getStakingConfigPath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const {
    covenantQuorum,
    tag,
    version,
    destChainId,
    mintAddress,
    stakingAmount,
    accountFileName,
  } = config;
  const networkName = ProjectENV.NETWORK;
  const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

  // Get one user to stake
  const accountsFilePath = getAccountsPath(networkName, accountFileName);
  const candidateAccounts: StakerAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );

  // Get funded accounts from prisma
  const fundedAccounts = await prisma.fundedAccount.findMany({
    where: { status: "FUNDED" },
    select: { btcAddress: true },
  });

  // Create a Set of funded BTC addresses for efficient lookup
  const fundedBtcAddresses = new Set(
    fundedAccounts.map((account) => account.btcAddress)
  );

  // Filter candidate accounts to only include funded accounts
  const fundedCandidateAccounts = candidateAccounts.filter((account) =>
    fundedBtcAddresses.has(account.btcAddress)
  );

  if (fundedCandidateAccounts.length === 0) {
    console.log("No funded accounts available for staking");
    return;
  }

  // Choose a random account from the funded candidate accounts
  const randomIndex = Math.floor(
    Math.random() * fundedCandidateAccounts.length
  );
  const selectedAccount = fundedCandidateAccounts[randomIndex];

  // Update the stakerAccount with the randomly selected account
  const stakerAccount: BitcoinAccount = {
    address: selectedAccount.btcAddress,
    privateKeyWIF: selectedAccount.btcPrivateKeyWIF,
    publicKey: selectedAccount.btcPublicKey,
    privateKeyHex: selectedAccount.btcPrivateKeyHex,
  };

  // Check if this account has already staked
  const existingStake = await prisma.bondingTransaction.findFirst({
    where: {
      staker_address: stakerAccount.address,
      status: { in: ["STAKED"] },
    },
  });

  if (existingStake) {
    console.log(`Account ${stakerAccount.address} has already staked`);
    return;
  }

  // TODO: implement checking balance

  try {
    const txid = await sendBondingTx(
      stakerAccount,
      protocolPublicKey,
      covenantPublicKeys,
      covenantQuorum,
      tag,
      version,
      destChainId,
      selectedAccount.ethAddress,
      mintAddress,
      stakingAmount,
      networkName
    );
    console.log("Staking transaction sent successfully. TXID:", txid);
    await prisma.bondingTransaction.create({
      data: {
        txid,
        staker_pubkey: stakerAccount.publicKey,
        staker_address: stakerAccount.address,
        status: "PENDING",
      },
    });
    await prisma.fundedAccount.update({
      where: { btcAddress: stakerAccount.address },
      data: { status: "STAKED" },
    });
    return { txid, stakingAmount };
  } catch (error) {
    console.error("Error sending staking transaction:", error);
  }
};

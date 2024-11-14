import { ProjectENV } from "@/env";
import { sendBondingTx } from "@/transactions/sendBondingTx";
import { BitcoinAccount } from "@/types/bitcoin";
import { StakerAccount } from "@/types/staker";
import { getAccountsPath } from "@/utils/path";
import prisma from "@/utils/prisma";
import fs from "fs";

export const performStaking = async (): Promise<
  | {
      txid: string;
      stakingAmount: number;
    }
  | undefined
> => {
  const networkName = ProjectENV.NETWORK;
  const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");
  const accountFileName = ProjectENV.ACCOUNT_FILE_NAME;
  const stakingAmount = Number(ProjectENV.STAKING_AMOUNT);
  const mintingAmount = Number(ProjectENV.MINTING_AMOUNT);
  const tag = ProjectENV.TAG;
  const version = Number(ProjectENV.VERSION);
  const destChainId = ProjectENV.DEST_CHAIN_ID;
  const mintAddress = ProjectENV.MINT_ADDRESS;
  const covenantQuorum = Number(ProjectENV.COVENANT_QUORUM);

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
    fundedAccounts.map((account: { btcAddress: string }) => account.btcAddress)
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
    const { txid, txhex } = await sendBondingTx(
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
      mintingAmount,
      networkName
    );
    console.log("Staking transaction sent successfully. TXID:", txid);
    await prisma.bondingTransaction.create({
      data: {
        txid,
        txhex,
        bondAmount: BigInt(stakingAmount),
        mintAmount: BigInt(mintingAmount),
        staker_pubkey: stakerAccount.publicKey,
        staker_address: stakerAccount.address,
        status: "PENDING",
      },
    });
    await prisma.fundedAccount.update({
      where: { btcAddress: stakerAccount.address },
      data: { status: "STAKED" },
    });

    console.log("--- Staking completed");

    return { txid, stakingAmount };
  } catch (error) {
    console.error("Error sending staking transaction:", error);
  }
};

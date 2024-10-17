import { ProjectENV } from "@/env";
import { sendBondingTx } from "@/transactions/sendBondingTx";
import { BitcoinAccount } from "@/types/bitcoin";
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
    recipientEthAddress,
    mintAddress,
    stakingAmount,
    accountFileName,
  } = config;
  const networkName = ProjectENV.NETWORK;
  const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

  //   Get one user to stake
  const accountsFilePath = getAccountsPath(networkName, accountFileName);
  const candidateAccounts: BitcoinAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );

  // Choose a random account from the candidate accounts
  const randomIndex = Math.floor(Math.random() * candidateAccounts.length);
  const selectedAccount = candidateAccounts[randomIndex];

  // Update the stakerAccount with the randomly selected account
  const stakerAccount = {
    address: selectedAccount.address,
    privateKeyWIF: selectedAccount.privateKeyWIF,
    publicKey: selectedAccount.publicKey,
    privateKeyHex: selectedAccount.privateKeyHex,
  };

  //   TODO: implement checking balance and if this person has already staked

  try {
    const txid = await sendBondingTx(
      stakerAccount,
      protocolPublicKey,
      covenantPublicKeys,
      covenantQuorum,
      tag,
      version,
      destChainId,
      recipientEthAddress,
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
    return { txid, stakingAmount };
  } catch (error) {
    console.error("Error sending staking transaction:", error);
  }
};

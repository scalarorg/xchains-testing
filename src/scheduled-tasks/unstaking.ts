import { callXchainsApi } from "@/app/api/xchains-api";
import { ProjectENV } from "@/env";
import { unbondingServiceTx } from "@/transactions/unbondingServiceTx";
import { BitcoinAccount } from "@/types/bitcoin";
import { getAccountsPath, getUnstakingConfigPath } from "@/utils/path";
import prisma from "@/utils/prisma";
import fs from "fs";

export const performUnstaking = async (): Promise<
  | {
      txHash: string;
      tokenBurnAmount: number;
    }
  | undefined
> => {
  const configPath = getUnstakingConfigPath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const {
    covenantQuorum,
    burnContractAddress,
    burnDestinationChain,
    burnDestinationAddress,
    sBTCContractAddress,
    ethRpcUrl,
    ethPrivateKey,
    accountFileName,
  } = config;
  const networkName = ProjectENV.NETWORK;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

  // Get one bonding TX randomly from the database to unstake
  const bondingTx = await prisma.bondingTransaction.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    skip: Math.floor(Math.random() * (await prisma.bondingTransaction.count())),
    take: 1,
  });

  if (!bondingTx) {
    console.error("Bonding transaction not found");
    return;
  }
  if (bondingTx.status === "UNSTAKED") {
    console.error("Bonding transaction is already unstaked");
    return;
  }

  //   Get more info from xchains-api
  const vaultTxsData = await callXchainsApi("v1/vault/searchVault", "POST", {
    stakerPubkey: bondingTx.staker_pubkey.slice(2),
  });
  const unstakeTxFromApi = vaultTxsData.data.find(
    (tx: any) => tx.source_tx_hash.slice(2) === bondingTx.txid
  );
  if (!unstakeTxFromApi) {
    console.error("Unstake transaction not found");
    return;
  }
  if (unstakeTxFromApi.executed_amount) {
    console.error("Unstake transaction already executed");
    return;
  }

  const hexTx = unstakeTxFromApi.source_tx_hex;
  const tokenBurnAmount = Number(unstakeTxFromApi.amount);

  // Get the original account that made the bonding tx
  const accountsFilePath = getAccountsPath(networkName, accountFileName);
  const candidateAccounts: BitcoinAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );
  const selectedAccount = candidateAccounts.find(
    (account) => account.address === bondingTx.staker_address
  );

  if (!selectedAccount) {
    console.error("Selected account not found");
    return;
  }

  const stakerAccount = {
    address: selectedAccount.address,
    privateKeyWIF: selectedAccount.privateKeyWIF,
    publicKey: selectedAccount.publicKey,
    privateKeyHex: selectedAccount.privateKeyHex,
  };
  const receiveAddress = stakerAccount.address;

  try {
    const txHash = await unbondingServiceTx(
      stakerAccount,
      receiveAddress,
      hexTx,
      covenantPublicKeys,
      covenantQuorum,
      burnContractAddress,
      burnDestinationChain,
      burnDestinationAddress,
      sBTCContractAddress,
      tokenBurnAmount,
      ethRpcUrl,
      ethPrivateKey,
      networkName
    );
    console.log("Unstaking transaction sent successfully. TX Hash:", txHash);
    await prisma.bondingTransaction.update({
      where: { txid: bondingTx.txid },
      data: { status: "UNSTAKED" },
    });
    return { txHash, tokenBurnAmount };
  } catch (error) {
    console.error("Error sending unstaking transaction:", error);
  }
};

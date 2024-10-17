import { callXchainsApi } from "@/app/api/xchains-api";
import { ProjectENV } from "@/env";
import { unbondingServiceTx } from "@/transactions/unbondingServiceTx";
import { BitcoinAccount } from "@/types/bitcoin";
import { StakerAccount } from "@/types/staker";
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

  // Get more info from xchains-api
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
  const candidateAccounts: StakerAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );
  const selectedAccount = candidateAccounts.find(
    (account) => account.btcAddress === bondingTx.staker_address
  );

  if (!selectedAccount) {
    console.error("Selected account not found");
    return;
  }

  const stakerAccount: BitcoinAccount = {
    address: selectedAccount.btcAddress,
    privateKeyWIF: selectedAccount.btcPrivateKeyWIF,
    publicKey: selectedAccount.btcPublicKey,
    privateKeyHex: selectedAccount.btcPrivateKeyHex,
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
      selectedAccount.ethPrivateKey,
      networkName
    );
    console.log("Unstaking transaction sent successfully. TX Hash:", txHash);
    await prisma.bondingTransaction.update({
      where: { txid: bondingTx.txid },
      data: { status: "UNSTAKED" },
    });
    // Update the fundedAccount status to 'UNSTAKED'
    await prisma.fundedAccount.update({
      where: { btcAddress: stakerAccount.address },
      data: { status: "FUNDED" },
    });
    console.log(
      `Updated fundedAccount status to FUNDED for address: ${stakerAccount.address}`
    );
    return { txHash, tokenBurnAmount };
  } catch (error) {
    console.error("Error sending unstaking transaction:", error);
  }
};

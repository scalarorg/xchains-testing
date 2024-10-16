import { getBitcoinNetwork, getPublicKeyFromPrivateKeyWIF } from "@/bitcoin";
import { sendBondingTx } from "@/transactions/sendBondingTx";
import { getBondingTxExpExamplePath } from "@/utils/path";
import fs from "fs";

export const bondingTxExp = async (): Promise<
  | {
      txid: string;
      bondingAmount: number;
    }
  | undefined
> => {
  const configPath = getBondingTxExpExamplePath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const networkName = config.networkName;
  const stakerAccount = config.stakerAccount;
  const protocolPublicKey = config.protocolPublicKey;
  const covenantPublicKeys = config.covenantPublicKeys;
  const covenantQuorum = config.covenantQuorum;
  const tag = config.tag;
  const version = config.version;
  const destChainId = config.destChainId;
  const recipientEthAddress = config.recipientEthAddress;
  const mintAddress = config.mintAddress;
  const bondingAmount = config.bondingAmount;

  stakerAccount.publicKey = getPublicKeyFromPrivateKeyWIF(
    stakerAccount.privateKeyWIF,
    getBitcoinNetwork(networkName)
  );

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
      bondingAmount,
      networkName
    );
    console.log("Bonding transaction sent successfully. TXID:", txid);
    return { txid, bondingAmount };
  } catch (error) {
    console.error("Error sending bonding transaction:", error);
  }
};

bondingTxExp();

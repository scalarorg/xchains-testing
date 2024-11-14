import {
  getBitcoinNetwork,
  getPublicKeyFromPrivateKeyWIF,
} from "@/utils/bitcoin";
import { ProjectENV } from "@/env";
import { sendBondingTx } from "@/transactions/sendBondingTx";
import { BitcoinAccount } from "@/types/bitcoin";

export const bondingTxExp = async (): Promise<
  | {
      txid: string;
      bondingAmount: number;
    }
  | undefined
> => {
  // const networkName = config.networkName;
  // const stakerAccount = config.stakerAccount;
  // const covenantQuorum = config.covenantQuorum;
  // const tag = config.tag;
  // const version = config.version;
  // const destChainId = config.destChainId;
  // const recipientEthAddress = config.recipientEthAddress;
  // const mintAddress = config.mintAddress;
  // const bondingAmount = config.bondingAmount;
  // const mintingAmount = config.mintingAmount;

  const networkName = ProjectENV.NETWORK;
  const stakerAccount: BitcoinAccount = {
    publicKey: ProjectENV.FUNDING_BTC_PUBLIC_KEY,
    address: ProjectENV.FUNDING_BTC_ADDRESS,
    privateKeyHex: ProjectENV.FUNDING_BTC_PRIVATE_KEY_HEX,
    privateKeyWIF: ProjectENV.FUNDING_BTC_PRIVATE_KEY_WIF,
  };
  const covenantQuorum = Number(ProjectENV.COVENANT_QUORUM);
  const tag = ProjectENV.TAG;
  const version = Number(ProjectENV.VERSION);
  const destChainId = ProjectENV.DEST_CHAIN_ID;
  const recipientEthAddress = ProjectENV.FUNDING_ETH_ADDRESS;
  const mintAddress = ProjectENV.MINT_ADDRESS;
  const bondingAmount = Number(ProjectENV.STAKING_AMOUNT);
  const mintingAmount = Number(ProjectENV.MINTING_AMOUNT);
  const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

  stakerAccount.publicKey = getPublicKeyFromPrivateKeyWIF(
    stakerAccount.privateKeyWIF,
    getBitcoinNetwork(networkName)
  );

  try {
    const { txid, txhex } = await sendBondingTx(
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
      mintingAmount,
      networkName
    );
    console.log("Bonding transaction sent successfully. TXID:", txid);
    console.log("Transaction hex:", txhex);
    return { txid, bondingAmount };
  } catch (error) {
    console.error("Error sending bonding transaction:", error);
  }
};

bondingTxExp();

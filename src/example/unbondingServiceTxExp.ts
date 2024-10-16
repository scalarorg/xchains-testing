import { unbondingServiceTx } from "@/transactions/unbondingServiceTx";
import { getUnbondingServiceTxExpExamplePath } from "@/utils/path";
import fs from "fs";

export const unbondingServiceTxExp = async (): Promise<
  | {
      txHash: string;
      tokenBurnAmount: number;
    }
  | undefined
> => {
  const configPath = getUnbondingServiceTxExpExamplePath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const networkName = config.networkName;
  const stakerAccount = config.stakerAccount;
  const receiveAddress = config.receiveAddress;
  const hexTx = config.hexTx;
  const covenantPublicKeys = config.covenantPublicKeys;
  const covenantQuorum = config.covenantQuorum;
  const burnContractAddress = config.burnContractAddress;
  const burnDestinationChain = config.burnDestinationChain;
  const burnDestinationAddress = config.burnDestinationAddress;
  const sBTCContractAddress = config.sBTCContractAddress;
  const tokenBurnAmount = config.tokenBurnAmount;
  const ethRpcUrl = config.ethRpcUrl;
  const ethPrivateKey = config.ethPrivateKey;

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
    console.log(
      "Unbonding service transaction sent successfully. TX Hash:",
      txHash
    );
    return { txHash, tokenBurnAmount };
  } catch (error) {
    console.error("Error sending unbonding service transaction:", error);
  }
};

unbondingServiceTxExp();

import { ProjectENV } from "@/env";
import { unbondingServiceTx } from "@/transactions/unbondingServiceTx";
import { BitcoinAccount } from "@/types/bitcoin";

export const unbondingServiceTxExp = async (): Promise<
  | {
      txHash: string;
      tokenBurnAmount: number;
    }
  | undefined
> => {
  const hexTx =
    "020000000001014c96a0dff0a9dcd69e547a58b389317020691225d19825a62de66d2c5aa54c780000000000fdffffff03102700000000000022512004e4fa0dc037da6bc90ef980ce3a96b7d262f8780d1b852b2384388a8c590f2a00000000000000003d6a013504010203040100080000000000000539141f98c06d8734d5a9ff0b53e3294626e62e4d232c14ce49f891044ac2cddf6dec24b070a7a875ffb9251403500900000000160014d833ff55ff5b54b84473d603e81934a7ddaaa9f102483045022100f405b199b88858e07ebe5d3c1e903d752cd405f9b4642f23f225cb6273c36ec902205233335466cee7bd37f165bbd1e6df9eee6d5db0b31c2c3db34ef671d04da7060121031304b869fe2b2cccc08a97ab9a6ae131bad268b0f243fd5ae490523463416e0b00000000";

  const networkName = ProjectENV.NETWORK;
  const stakerAccount: BitcoinAccount = {
    publicKey: ProjectENV.FUNDING_BTC_PUBLIC_KEY,
    address: ProjectENV.FUNDING_BTC_ADDRESS,
    privateKeyHex: ProjectENV.FUNDING_BTC_PRIVATE_KEY_HEX,
    privateKeyWIF: ProjectENV.FUNDING_BTC_PRIVATE_KEY_WIF,
  };
  const receiveAddress = stakerAccount.address;
  const covenantQuorum = Number(ProjectENV.COVENANT_QUORUM);
  const burnContractAddress = ProjectENV.BURN_CONTRACT_ADDRESS;
  const burnDestinationChain = ProjectENV.BURN_DESTINATION_CHAIN;
  const burnDestinationAddress = ProjectENV.BURN_DESTINATION_ADDRESS;
  const sBTCContractAddress = ProjectENV.SBTC_CONTRACT_ADDRESS;
  const tokenBurnAmount = Number(ProjectENV.MINTING_AMOUNT);
  const ethRpcUrl = ProjectENV.ETH_RPC_URL;
  const ethPrivateKey = ProjectENV.FUNDING_ETH_PRIVATE_KEY;
  const tag = ProjectENV.TAG;
  const version = Number(ProjectENV.VERSION);
  const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
  const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

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
      networkName,
      tag,
      version,
      protocolPublicKey
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

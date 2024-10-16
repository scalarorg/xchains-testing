import { BitcoinAccount } from "../types/bitcoin";
import { getBitcoinNetwork } from "../bitcoin";
import { BtcMempool } from "../client";
import * as vault from "xchains-bitcoin-ts/src/index";
import { psbt } from "xchains-bitcoin-ts/src/utils/psbt";
import { ethers } from "ethers";
import burnContractJSON from "@/abis/burn-contract.json";
import sBTCJSON from "@/abis/sbtc.json";

export async function unbondingServiceTx(
  stakerAccount: BitcoinAccount,
  receiveAddress: string,
  hexTx: string,
  covenantPublicKeys: string[],
  covenantQuorum: number,
  burnContractAddress: string,
  burnDestinationChain: string,
  burnDestinationAddress: string,
  sBTCContractAddress: string,
  tokenBurnAmount: number,
  ethRpcUrl: string,
  ethPrivateKey: string,
  networkName: string = "testnet"
): Promise<string> {
  const mempoolClient = new BtcMempool();
  const network = getBitcoinNetwork(networkName);
  // ---
  const burnContractABI = burnContractJSON.abi;
  const sBTCABI = sBTCJSON.abi;
  const provider = new ethers.JsonRpcProvider(ethRpcUrl);
  const signer = new ethers.Wallet(ethPrivateKey, provider);
  const burnContract = new ethers.Contract(
    burnContractAddress,
    burnContractABI,
    signer
  );
  const sBTC = new ethers.Contract(sBTCContractAddress, sBTCABI, signer);
  // ---
  const { fees } = mempoolClient;
  const { fastestFee: feeRate } = await fees.getFeesRecommended();
  const rbf = true;
  const unStaker = new vault.UnStaker(
    stakerAccount.address,
    hexTx,
    covenantPublicKeys,
    covenantQuorum
  );
  const { psbt: unsignedPsbt, burningLeaf } =
    await unStaker.getUnsignedBurningPsbt(receiveAddress, feeRate, rbf);

  // Simulate staker signing
  const stakerSignedPsbt = psbt.signInputs(
    stakerAccount.privateKeyWIF,
    network,
    unsignedPsbt.toBase64(),
    false
  );
  const amountToBurn = ethers.parseUnits(tokenBurnAmount.toString(), 0);
  const txApprove = await sBTC.approve(burnContractAddress, amountToBurn);
  await txApprove.wait();
  const txCallBurn = await burnContract.callBurn(
    burnDestinationChain,
    burnDestinationAddress,
    amountToBurn,
    stakerSignedPsbt.toBase64()
  );
  await txCallBurn.wait();
  return txCallBurn.hash;
}

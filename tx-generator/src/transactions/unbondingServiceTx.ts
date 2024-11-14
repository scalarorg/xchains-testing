import { BitcoinAccount } from "../types/bitcoin";
import { getBitcoinNetwork } from "../utils/bitcoin";
import { ethers } from "ethers";
import protocolJSON from "@/abis/protocol.json";
import sBTCJSON from "@/abis/sbtc.json";
// import { getMempoolAxiosClient } from "@/client/mempool-axios";
import {
  buildUnsignedUnstakingUserProtocolPsbt,
  bytesToHex,
  signPsbt,
} from "@scalar-lab/bitcoin-vault";
import { Psbt } from "bitcoinjs-lib";
import * as bitcoin from "bitcoinjs-lib";

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
  networkName: string = "testnet",
  tag: string,
  version: number,
  protocolPublicKey: string
): Promise<string> {
  // const mempoolAxiosClient = getMempoolAxiosClient();
  const network = getBitcoinNetwork(networkName);
  // ---
  const protocolABI = protocolJSON;
  const sBTCABI = sBTCJSON.abi;
  const provider = new ethers.JsonRpcProvider(ethRpcUrl);
  const signer = new ethers.Wallet(ethPrivateKey, provider);
  const protocol = new ethers.Contract(
    burnContractAddress, // protocolAddress
    protocolABI,
    signer
  );
  const sBTC = new ethers.Contract(sBTCContractAddress, sBTCABI, signer);
  // ---
  // const { fastestFee: feeRate } = await mempoolAxiosClient.getFeesRecommended();
  const rbf = true;

  const tx = bitcoin.Transaction.fromHex(hexTx);
  const txid = tx.getId();
  const scriptPubkeyOfLocking = tx.outs[0].script;
  const valueOfLocking = tx.outs[0].value;

  const p2wpkhScript = bitcoin.payments.p2wpkh({
    pubkey: new Uint8Array(Buffer.from(stakerAccount.publicKey, "hex")),
  }).output;

  const psbtHex = buildUnsignedUnstakingUserProtocolPsbt(
    tag,
    version,
    {
      txid,
      vout: 0,
      value: valueOfLocking,
      script_pubkey: scriptPubkeyOfLocking,
    },
    {
      script: p2wpkhScript!,
      value: valueOfLocking - BigInt(1_000),
    },
    new Uint8Array(Buffer.from(stakerAccount.publicKey, "hex")),
    new Uint8Array(Buffer.from(protocolPublicKey, "hex")),
    new Uint8Array(
      Buffer.concat(covenantPublicKeys.map((key) => Buffer.from(key, "hex")))
    ),
    covenantQuorum,
    false,
    rbf
  );

  const psbtStr = bytesToHex(psbtHex);
  const psbt = Psbt.fromHex(psbtStr);

  const { signedPsbt: stakerSignedPsbt } = signPsbt(
    network,
    stakerAccount.privateKeyWIF,
    psbt,
    false
  );

  const amountToBurn = ethers.parseUnits(tokenBurnAmount.toString(), 0);
  const txApprove = await sBTC.approve(burnContractAddress, amountToBurn);
  await txApprove.wait();
  const txCallBurn = await protocol.unstake(
    burnDestinationChain,
    burnDestinationAddress,
    amountToBurn,
    stakerSignedPsbt.toBase64()
  );
  await txCallBurn.wait();
  return txCallBurn.hash;
}

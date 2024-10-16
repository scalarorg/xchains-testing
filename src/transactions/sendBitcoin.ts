import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { BitcoinAccount } from "../types/bitcoin";
import { fromBtcUnspentToMempoolUTXO, getBitcoinNetwork } from "../bitcoin";
import { getClient } from "../client/bitcoin";
import { BtcMempool } from "../client";
import { prepareTx, toPsbt } from "xchains-bitcoin-ts/src/utils/bitcoin";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export async function sendBitcoin(
  sender: BitcoinAccount,
  recipientAddress: string,
  amount: number,
  networkName: string = "testnet"
): Promise<string> {
  const mempoolClient = new BtcMempool();
  const btcClient = getClient();
  const network = getBitcoinNetwork(networkName);

  // Fetch UTXOs for the sender's address
  const utxos: AddressTxsUtxo[] =
    networkName === "regtest"
      ? (
          await btcClient.command("listunspent", 0, 9999999, [sender.address])
        ).map(fromBtcUnspentToMempoolUTXO)
      : await mempoolClient.addresses.getAddressTxsUtxo({
          address: sender.address,
        });

  const feeRate = (await mempoolClient.fees.getFeesRecommended()).hourFee;
  const rbf = false;

  const outputs = [
    {
      address: recipientAddress,
      value: amount,
    },
  ];

  let { ok, error } = prepareTx({
    inputs: [],
    outputs,
    regularUTXOs: utxos,
    feeRate,
    address: sender.address,
  });

  if (!ok) {
    throw new Error(error);
  }

  const psbt = toPsbt({
    tx: ok,
    pubkey: Buffer.from(sender.publicKey, "hex"),
    rbf,
  });

  // Sign the inputs
  const keyPair = ECPair.fromWIF(sender.privateKeyWIF, network);
  psbt.signAllInputs(keyPair);

  // Validate and finalize the transaction
  psbt.finalizeAllInputs();

  // Get the transaction hex
  const txHex = psbt.extractTransaction().toHex();

  // Broadcast the transaction
  const response = await btcClient.command("sendrawtransaction", txHex);

  return response;
}

import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { BitcoinAccount } from "../types/bitcoin";
import {
  fromBtcUnspentToMempoolUTXO,
  getBitcoinNetwork,
} from "../utils/bitcoin";
import { getClient } from "../client/bitcoin";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { getMempoolAxiosClient } from "@/client/mempool-axios";
import {
  createStakingPsbt,
  getStakingTxInputUTXOsAndFees,
  prepareExtraInputByAddress,
  PsbtOutputExtended,
  UTXO,
} from "@scalar-lab/bitcoin-vault";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export async function sendBitcoin(
  sender: BitcoinAccount,
  recipientAddress: string,
  amount: number,
  networkName: string = "testnet"
): Promise<string> {
  const mempoolAxiosClient = getMempoolAxiosClient();
  const btcClient = getClient();
  const network = getBitcoinNetwork(networkName);

  // Fetch UTXOs for the sender's address
  const utxos: AddressTxsUtxo[] =
    networkName === "regtest"
      ? (
          await btcClient.command("listunspent", 0, 9999999, [sender.address])
        ).map(fromBtcUnspentToMempoolUTXO)
      : await mempoolAxiosClient.getAddressTxsUtxo(sender.address);

  const feeRate = (await mempoolAxiosClient.getFeesRecommended()).hourFee;
  const rbf = false;

  const outputs: PsbtOutputExtended[] = [
    {
      address: recipientAddress,
      value: BigInt(amount),
    },
  ];

  const inputByAddress = prepareExtraInputByAddress(
    sender.address,
    Buffer.from(sender.publicKey, "hex"),
    network
  );

  const regularUTXOs: UTXO[] = utxos.map(
    ({ txid, vout, value }: AddressTxsUtxo) => ({
      txid,
      vout,
      value,
    })
  );

  const { selectedUTXOs, fee } = getStakingTxInputUTXOsAndFees(
    network,
    regularUTXOs,
    inputByAddress.outputScriptSize,
    amount,
    feeRate,
    outputs
  );

  const { psbt } = createStakingPsbt(
    network,
    inputByAddress,
    selectedUTXOs,
    outputs,
    amount,
    fee,
    sender.address,
    rbf
  );

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

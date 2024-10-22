import { BitcoinAccount } from "../types/bitcoin";
import {
  fromBtcUnspentToMempoolUTXO,
  getBitcoinNetwork,
} from "../utils/bitcoin";
import { getClient } from "../client/bitcoin";
import * as vault from "xchains-bitcoin-ts/src/index";
import { psbt } from "xchains-bitcoin-ts/src/utils/psbt";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { getMempoolAxiosClient } from "@/client/mempool-axios";

export async function sendBondingTx(
  stakerAccount: BitcoinAccount,
  protocolPublicKey: string,
  covenantPublicKeys: string[],
  covenantQuorum: number,
  tag: string,
  version: number,
  destChainId: string,
  recipientEthAddress: string,
  mintAddress: string,
  bondingAmount: number,
  mintingAmount: number,
  networkName: string = "testnet"
): Promise<{ txid: string; txhex: string }> {
  const mempoolAxiosClient = getMempoolAxiosClient();
  const btcClient = getClient();
  const network = getBitcoinNetwork(networkName);

  let destChainIdHex = Number(destChainId || "").toString(16);
  if (destChainIdHex.length % 2) {
    destChainIdHex = "0" + destChainIdHex;
  }

  const staker = new vault.Staker(
    stakerAccount.address,
    stakerAccount.publicKey,
    protocolPublicKey,
    covenantPublicKeys,
    covenantQuorum,
    tag,
    version,
    destChainIdHex,
    recipientEthAddress,
    mintAddress,
    mintingAmount
  );
  // --- Get UTXOs
  const utxos: AddressTxsUtxo[] =
    networkName === "regtest"
      ? (
          await btcClient.command("listunspent", 0, 9999999, [
            stakerAccount.address,
          ])
        ).map(fromBtcUnspentToMempoolUTXO)
      : await mempoolAxiosClient.getAddressTxsUtxo(stakerAccount.address);

  const { fastestFee: feeRate } = await mempoolAxiosClient.getFeesRecommended();
  const rbf = true; // Replace by fee, need to be true if we want to replace the transaction when the fee is low
  const { psbt: unsignedVaultPsbt } = await staker.getUnsignedVaultPsbt(
    utxos,
    bondingAmount,
    feeRate,
    rbf
  );

  // Simulate signing
  const signedPsbt = psbt.signInputs(
    stakerAccount.privateKeyWIF,
    network,
    unsignedVaultPsbt.toBase64(),
    true
  );

  const hexTxfromPsbt = signedPsbt.extractTransaction().toHex();

  // Broadcast the transaction
  const txid = await btcClient.command("sendrawtransaction", hexTxfromPsbt);

  return { txid, txhex: hexTxfromPsbt };
}

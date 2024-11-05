import { BitcoinAccount } from "../types/bitcoin";
import {
  fromBtcUnspentToMempoolUTXO,
  getBitcoinNetwork,
} from "../utils/bitcoin";
import { getClient } from "../client/bitcoin";
import { buildUnsignedStakingPsbt, signPsbt } from "@scalar-lab/bitcoin-vault";
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

  const { psbt: unsignedVaultPsbt } = buildUnsignedStakingPsbt(
    tag,
    version,
    network,
    stakerAccount.address,
    new Uint8Array(Buffer.from(stakerAccount.publicKey, "hex")),
    new Uint8Array(Buffer.from(protocolPublicKey, "hex")),
    new Uint8Array(
      Buffer.concat(covenantPublicKeys.map((key) => Buffer.from(key, "hex")))
    ),
    covenantQuorum,
    false,
    BigInt(destChainId || ""),
    new Uint8Array(Buffer.from(mintAddress, "hex")),
    new Uint8Array(Buffer.from(recipientEthAddress, "hex")),
    utxos,
    feeRate,
    BigInt(bondingAmount),
    rbf
  );

  const { signedPsbt } = signPsbt(
    network,
    stakerAccount.privateKeyWIF,
    unsignedVaultPsbt
  );

  const hexTxfromPsbt = signedPsbt.extractTransaction().toHex();

  // Broadcast the transaction
  const txid = await btcClient.command("sendrawtransaction", hexTxfromPsbt);

  return { txid, txhex: hexTxfromPsbt };
}

import * as bitcoin from "bitcoinjs-lib";
import { Network } from "bitcoinjs-lib";
import { AddressType } from "../types/bitcoin";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { BtcUnspent } from "../types/bitcoin";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33);

export function getBitcoinNetwork(networkName?: string): Network {
  switch (networkName) {
    case "regtest":
      return bitcoin.networks.regtest;
    case "testnet":
      return bitcoin.networks.testnet;
    default:
      return bitcoin.networks.bitcoin;
  }
}

export function getBitcoinAddressType(typeName: string) {
  switch (typeName) {
    case "P2PKH":
      return AddressType.P2PKH;
    case "P2WPKH":
      return AddressType.P2WPKH;
    case "P2TR":
      return AddressType.P2TR;
    case "P2SH_P2WPKH":
      return AddressType.P2SH_P2WPKH;
    default:
      throw new Error("Unknown address type");
  }
}

export function publicKeyToPayment(
  publicKey: Buffer,
  type: AddressType,
  network: Network
) {
  if (type === AddressType.P2PKH) {
    return bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: network,
    });
  } else if (type === AddressType.P2WPKH) {
    return bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network: network,
    });
  } else if (type === AddressType.P2TR) {
    return bitcoin.payments.p2tr({
      internalPubkey: toXOnly(publicKey),
      network: network,
    });
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network: network,
    });
    return bitcoin.payments.p2sh({
      pubkey: publicKey,
      network: network,
      redeem: data,
    });
  }
  throw new Error("Unknown address type");
}

export function getPublicKeyFromPrivateKeyWIF(
  privateKeyWIF: string,
  network?: Network
) {
  const wif = ECPair.fromWIF(privateKeyWIF, network);
  return wif.publicKey.toString("hex");
}

export const fromBtcUnspentToMempoolUTXO = (
  utxo: BtcUnspent
): AddressTxsUtxo => {
  return {
    txid: utxo.txid,
    vout: utxo.vout,
    value: Math.round(utxo.amount * 100000000), // convert to satoshis
    status: {
      confirmed: utxo.confirmations > 0,
      block_height: 0,
      block_hash: "",
      block_time: 0,
    },
  };
};

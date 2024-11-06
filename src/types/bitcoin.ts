import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { Network } from "bitcoinjs-lib";

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
}

export interface BitcoinAccount {
  publicKey: string;
  address: string;
  privateKeyHex: string;
  privateKeyWIF: string;
}

export type Output =
  | { address: string; value: number }
  | { script: Buffer; value: number };

export interface CalcFeeOptions {
  inputs: AddressTxsUtxo[];
  outputs: Output[];
  addressType: AddressType;
  feeRate: number;
  network: Network;
  autoFinalized?: boolean;
}

export type SignPsbtWithRandomWIFOptions = Omit<CalcFeeOptions, "feeRate">;

export interface ToSignInput {
  index: number;
  pubkey: Buffer;
  sighashTypes?: number[];
}

export interface SignOptions {
  inputs?: ToSignInput[];
  autoFinalized?: boolean;
}

export type BtcUnspent = {
  txid: string;
  vout: number;
  address: string;
  label?: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
  solvable: boolean;
  desc: string;
  parent_descs?: string[];
  safe: boolean;
};

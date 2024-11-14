import * as bitcoin from "bitcoinjs-lib";
import * as crypto from "crypto";
import * as ecc from "@bitcoinerlab/secp256k1";
import { ECPairFactory } from "ecpair";
import {
  getBitcoinAddressType,
  getBitcoinNetwork,
  publicKeyToPayment,
} from "./bitcoin";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export function generateKeys(
  typeName: string = "P2WPKH",
  networkName: string = "testnet"
) {
  // Generate a random private key
  const privateKey = crypto.randomBytes(32);

  // Get the network
  const network = getBitcoinNetwork(networkName);

  // Create a key pair from the private key, specifying the network
  const keyPair = ECPair.fromPrivateKey(privateKey, { network });

  // Get the public key in hex
  const publicKey = Buffer.from(keyPair.publicKey).toString("hex");

  // Convert public key to address
  const type = getBitcoinAddressType(typeName);
  const address = publicKeyToPayment(
    Buffer.from(keyPair.publicKey),
    type,
    network
  ).address;

  return {
    publicKey,
    address,
    privateKeyHex: privateKey.toString("hex"),
    privateKeyWIF: keyPair.toWIF(),
  };
}

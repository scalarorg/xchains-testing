// bun test src/test/funding.test.ts --env-file=.env.test.local

import { sendBitcoin } from "@/transactions/sendBitcoin";
import { describe, it } from "bun:test";
import { BitcoinAccount } from "@/types/bitcoin";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

describe("Funding", () => {
  // Set timeout for all tests in this describe block
  Bun.env.BUN_TEST_TIMEOUT = "30000"; // 30 seconds

  it("should fund bitcoin", async () => {
    const networkName = "testnet";
    const btcFundingAmount = 10000;
    const senderPrivateKeyHex =
      "5ff8c8370cea8ceeb618956ba8bedb6103d714121aa7d759b0ae934c042e5b5f";
    const recipientAddress = "tb1qyawwqrnhx63dpgk6ga0r5yjevqs6989j7r05ny";

    const network = bitcoin.networks[networkName];
    const keyPair = ECPair.fromPrivateKey(
      Buffer.from(senderPrivateKeyHex, "hex"),
      { network }
    );
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    });

    const selectedAccount: BitcoinAccount = {
      address: address!,
      privateKeyWIF: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString("hex"),
      privateKeyHex: senderPrivateKeyHex,
    };

    // Fund Bitcoin
    const btcTxid = await sendBitcoin(
      selectedAccount,
      recipientAddress,
      btcFundingAmount,
      networkName
    );
    console.log(
      "Bitcoin funding transaction sent successfully. TXID:",
      btcTxid
    );
  });
});

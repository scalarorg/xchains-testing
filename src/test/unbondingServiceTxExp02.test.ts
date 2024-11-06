// bun test src/test/unbondingServiceTxExp02.test.ts --env-file=.env.local

import { ProjectENV } from "@/env";
import { getBitcoinNetwork } from "@/utils/bitcoin";
import { BitcoinAccount } from "@/types/bitcoin";
import {
  buildUnsignedUnstakingUserProtocolPsbt,
  bytesToHex,
  signPsbt,
} from "@scalar-lab/bitcoin-vault";
import { Psbt } from "bitcoinjs-lib";
import { describe, it } from "bun:test";
import * as bitcoin from "bitcoinjs-lib";
import { getClient } from "@/client/bitcoin";

describe("Unbonding Service Tx", () => {
  it("should create, signed and broadcast unbonding service psbt", async () => {
    const hexTx =
      "020000000001010c2b255454cd273b839cca3c4d98b6b1f1b15c1d6969540f184cbf54b27267c20000000000fdffffff03102700000000000022512004e4fa0dc037da6bc90ef980ce3a96b7d262f8780d1b852b2384388a8c590f2a00000000000000003d6a013504010203040100080000000000000539141f98c06d8734d5a9ff0b53e3294626e62e4d232c14ce49f891044ac2cddf6dec24b070a7a875ffb9256f04500900000000160014d833ff55ff5b54b84473d603e81934a7ddaaa9f102483045022100837063a9e59239dad6fa6fd568ecdbc3bd0d130dddc1ae50ccdef8397ed23fe002201353869d9093f0e0d064aacd801c7c5b63e8f11635672b1c50ef3e9522ac9ca30121031304b869fe2b2cccc08a97ab9a6ae131bad268b0f243fd5ae490523463416e0b00000000";

    const btcClient = getClient();

    const networkName = ProjectENV.NETWORK;
    const stakerAccount: BitcoinAccount = {
      publicKey: ProjectENV.FUNDING_BTC_PUBLIC_KEY,
      address: ProjectENV.FUNDING_BTC_ADDRESS,
      privateKeyHex: ProjectENV.FUNDING_BTC_PRIVATE_KEY_HEX,
      privateKeyWIF: ProjectENV.FUNDING_BTC_PRIVATE_KEY_WIF,
    };
    const covenantQuorum = Number(ProjectENV.COVENANT_QUORUM);
    const tag = ProjectENV.TAG;
    const version = Number(ProjectENV.VERSION);
    const protocolPublicKey = ProjectENV.PROTOCOL_PUBLIC_KEY;
    const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");

    const network = getBitcoinNetwork(networkName);
    // ---
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

    const { signedPsbt: protocolSignedPsbt } = signPsbt(
      network,
      ProjectENV.PROTOCOL_PRIVATE_KEY,
      stakerSignedPsbt,
      true
    );

    const hexTxfromPsbt = protocolSignedPsbt.extractTransaction().toHex();

    console.log("==== hexTxfromPsbt ====");
    console.log(hexTxfromPsbt);

    console.log("==== sendrawtransaction ====");
    const sent_txid = await btcClient.command(
      "sendrawtransaction",
      hexTxfromPsbt
    );
    console.log("sent_txid", sent_txid);
  });
});

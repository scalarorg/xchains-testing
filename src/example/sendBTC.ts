import { sendBitcoin } from "@/transactions/sendBitcoin";
import { getBitcoinNetwork, getPublicKeyFromPrivateKeyWIF } from "@/utils/bitcoin";
import { BitcoinAccount } from "@/types/bitcoin";
import fs from "fs";
import { getSendBTCExamplePath } from "@/utils/path";

const sendBTC = async (
  sender: BitcoinAccount,
  recipientAddress: string,
  amountInSatoshis: number,
  networkName: string = "testnet"
) => {
  try {
    const txid = await sendBitcoin(
      sender,
      recipientAddress,
      amountInSatoshis,
      networkName
    );
    console.log("Transaction sent successfully. TXID:", txid);
  } catch (error) {
    console.error("Error sending Bitcoin:", error);
  }
};

// Read configuration from JSON file
const configPath = getSendBTCExamplePath();
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const networkName = config.networkName;
const sender = config.sender;
const recipientAddress = config.recipientAddress;
const amountInSatoshis = config.amountInSatoshis;

sender.publicKey = getPublicKeyFromPrivateKeyWIF(
  sender.privateKeyWIF,
  getBitcoinNetwork(networkName)
);

sendBTC(sender, recipientAddress, amountInSatoshis, networkName);

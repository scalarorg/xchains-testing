import {
  getBitcoinNetwork,
  getPublicKeyFromPrivateKeyWIF,
} from "@/utils/bitcoin";
import { sendBitcoin } from "@/transactions/sendBitcoin";
import { getScheduledTransactionExamplePath } from "@/utils/path";
import fs from "fs";

export const scheduledTransaction = async () => {
  const configPath = getScheduledTransactionExamplePath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const networkName = config.networkName;
  const sender = config.sender;
  const recipientAddress = config.recipientAddress;
  const amountInSatoshis = config.amountInSatoshis;

  sender.publicKey = getPublicKeyFromPrivateKeyWIF(
    sender.privateKeyWIF,
    getBitcoinNetwork(networkName)
  );

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

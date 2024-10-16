import { sendBitcoin } from "@/transactions/sendBitcoin";
import { BitcoinAccount } from "@/types/bitcoin";

async function fundingAccountsTx(
  senderAccount: BitcoinAccount,
  recipientAccounts: BitcoinAccount[],
  amountPerAccount: number,
  networkName: string = "regtest"
): Promise<void> {
  for (const account of recipientAccounts) {
    try {
      const txid = await sendBitcoin(
        senderAccount,
        account.address,
        amountPerAccount,
        networkName
      );
      console.log(
        `Funded ${account.address} with ${amountPerAccount} satoshis. TXID: ${txid}`
      );
    } catch (error) {
      console.error(`Error funding ${account.address}:`, error);
    }
  }
}

export { fundingAccountsTx };

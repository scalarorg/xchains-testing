import { getClient } from "@/client/bitcoin";
import { BitcoinAccount } from "@/types/bitcoin";
import { getAccountsPath, getImportBtcAddressExamplePath } from "@/utils/path";
import fs from "fs";

interface BtcAddress {
  address: string;
  label?: string;
  rescan?: boolean;
}

async function importBtcAddressesFromFile() {
  try {
    const btcClient = getClient();
    const configPath = getImportBtcAddressExamplePath();
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const networkName = config.networkName;
    const accountFileName = config.accountFileName;

    const accountsFilePath = getAccountsPath(networkName, accountFileName);
    const importAddresses: BtcAddress[] = JSON.parse(
      fs.readFileSync(accountsFilePath, "utf-8")
    ).map((account: BitcoinAccount) => ({
      address: account.address,
    }));

    // Import each address
    for (const { address, label, rescan } of importAddresses) {
      await btcClient.command(
        "importaddress",
        address,
        label || "",
        rescan || false
      );
      console.log(`Imported address: ${address}`);
    }

    console.log("All addresses imported successfully");
  } catch (error) {
    console.error("Error importing addresses:", error);
    throw error;
  }
}

importBtcAddressesFromFile();

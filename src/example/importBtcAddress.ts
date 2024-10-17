import { getClient } from "@/client/bitcoin";
import { ProjectENV } from "@/env";
import { StakerAccount } from "@/types/staker";
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

    const networkName = ProjectENV.NETWORK;
    const accountFileName = config.accountFileName;

    const accountsFilePath = getAccountsPath(networkName, accountFileName);
    const importAddresses: BtcAddress[] = JSON.parse(
      fs.readFileSync(accountsFilePath, "utf-8")
    ).map((account: StakerAccount) => ({
      address: account.btcAddress,
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

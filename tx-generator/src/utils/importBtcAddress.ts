import { getClient } from "@/client/bitcoin";
import { ProjectENV } from "@/env";
import { StakerAccount } from "@/types/staker";
import { getAccountsPath } from "@/utils/path";
import fs from "fs";

interface BtcAddress {
  address: string;
  label?: string;
  rescan?: boolean;
}

export async function importBtcAddressesFromFile() {
  try {
    const btcClient = getClient();

    const networkName = ProjectENV.NETWORK;
    const accountFileName = ProjectENV.ACCOUNT_FILE_NAME;

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

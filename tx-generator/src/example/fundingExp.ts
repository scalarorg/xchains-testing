import { fundingAccountsTx } from "@/transactions/fundingAccountsTx";
import { BitcoinAccount } from "@/types/bitcoin";
import { getAccountsPath, getFundingExpExamplePath } from "@/utils/path";
import fs from "fs";

async function runFundingExperiment() {
  const configPath = getFundingExpExamplePath();
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const networkName = config.networkName;
  const accountFileName = config.accountFileName;
  const senderAccount = config.senderAccount;
  const amountPerAccount = config.amountPerAccount;

  const accountsFilePath = getAccountsPath(networkName, accountFileName);
  const recipientAccounts: BitcoinAccount[] = JSON.parse(
    fs.readFileSync(accountsFilePath, "utf-8")
  );

  try {
    await fundingAccountsTx(
      senderAccount,
      recipientAccounts,
      amountPerAccount,
      networkName
    );
    console.log("Funding experiment completed successfully.");
  } catch (error) {
    console.error("Error running funding experiment:", error);
  }
}

runFundingExperiment();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getBitcoinDirectoryPath() {
  return path.join(__dirname, "..", "..", ".bitcoin");
}

export function getAddressGeneratorPath() {
  return path.join(getBitcoinDirectoryPath(), "accounts");
}

export function getNetworkConfigPath() {
  return path.join(getBitcoinDirectoryPath(), "networks");
}

export function getSendBTCExamplePath() {
  return path.join(__dirname, "..", "..", ".example", "sendBTC.json");
}

export function getScheduledTransactionExamplePath() {
  return path.join(
    __dirname,
    "..",
    "..",
    ".example",
    "scheduledTransaction.json"
  );
}

export function getBondingTxExpExamplePath() {
  return path.join(__dirname, "..", "..", ".example", "bondingTxExp.json");
}

export function getUnbondingServiceTxExpExamplePath() {
  return path.join(
    __dirname,
    "..",
    "..",
    ".example",
    "unbondingServiceTxExp.json"
  );
}

export function getFundingExpExamplePath() {
  return path.join(__dirname, "..", "..", ".example", "fundingExp.json");
}

export function getAccountsPath(networkName: string, fileName: string) {
  return path.join(
    getBitcoinDirectoryPath(),
    "accounts",
    networkName,
    fileName
  );
}

export function getImportBtcAddressExamplePath() {
  return path.join(
    __dirname,
    "..",
    "..",
    ".example",
    "importBtcAddressExp.json"
  );
}

export function getStakingConfigPath() {
  return path.join(
    __dirname,
    "..",
    "..",
    ".bitcoin",
    "scheduled",
    "staking.json"
  );
}

export function getUnstakingConfigPath() {
  return path.join(
    __dirname,
    "..",
    "..",
    ".bitcoin",
    "scheduled",
    "unstaking.json"
  );
}

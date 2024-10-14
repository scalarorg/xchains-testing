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

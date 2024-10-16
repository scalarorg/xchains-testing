import path from "path";
import { generateKeys } from "./key";
import { BitcoinAccount } from "./types/bitcoin";
import * as fs from "fs";
import { getAddressGeneratorPath } from "./utils/path";

export function generateBtcAccounts(
  count: number,
  typeName: string,
  networkName: string
): BitcoinAccount[] {
  const accounts: BitcoinAccount[] = [];
  for (let i = 0; i < count; i++) {
    const keys = generateKeys(typeName, networkName);
    accounts.push({
      publicKey: keys.publicKey,
      address: keys.address!,
      privateKeyHex: keys.privateKeyHex,
      privateKeyWIF: keys.privateKeyWIF,
    });
  }
  return accounts;
}

export function saveAccountsToJson(
  accounts: BitcoinAccount[],
  networkName: string,
  filename: string
): void {
  const json = JSON.stringify(accounts, null, 2); // Pretty-print JSON with 2 spaces
  const saveFile = path.join(getAddressGeneratorPath(), networkName, filename);
  fs.writeFileSync(saveFile, json, "utf-8");
}

// Example usage
const numberOfAccounts = 5;
const typeName = "P2WPKH";
const networkName = "regtest";
const filename = "01.json";

const accounts = generateBtcAccounts(numberOfAccounts, typeName, networkName);
console.log(accounts);
saveAccountsToJson(accounts, networkName, filename);

import path from "path";
import { generateKeys } from "./key";
import { StakerAccount } from "./types/staker";
import * as fs from "fs";
import { getAddressGeneratorPath } from "./utils/path";
import { ethers } from "ethers";

export function generateAccounts(
  count: number,
  typeName: string,
  networkName: string
): StakerAccount[] {
  const accounts: StakerAccount[] = [];
  for (let i = 0; i < count; i++) {
    const keys = generateKeys(typeName, networkName);
    const ethWallet = ethers.Wallet.createRandom();
    accounts.push({
      btcPublicKey: keys.publicKey,
      btcAddress: keys.address!,
      btcPrivateKeyHex: keys.privateKeyHex,
      btcPrivateKeyWIF: keys.privateKeyWIF,
      ethAddress: ethWallet.address,
      ethPrivateKey: ethWallet.privateKey,
    });
  }
  return accounts;
}

export function saveAccountsToJson(
  accounts: StakerAccount[],
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

const accounts = generateAccounts(numberOfAccounts, typeName, networkName);
console.log(accounts);
saveAccountsToJson(accounts, networkName, filename);

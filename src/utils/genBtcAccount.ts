import path from "path";
import { generateKeys } from "./key";
import { StakerAccount } from "../types/staker";
import * as fs from "fs";
import { getAddressGeneratorPath } from "./path";
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
  const saveDir = path.join(getAddressGeneratorPath(), networkName);
  const saveFile = path.join(saveDir, filename);

  // Create directory if it doesn't exist
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  fs.writeFileSync(saveFile, json, "utf-8");
}

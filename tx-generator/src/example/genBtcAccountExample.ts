import { generateAccounts, saveAccountsToJson } from "../utils/genBtcAccount";
import { ProjectENV } from "../env";

// Example usage
const numberOfAccounts = parseInt(ProjectENV.NUMBER_OF_ACCOUNTS);
const typeName = ProjectENV.GENERATE_ACCOUNTS_TYPE;
const networkName = ProjectENV.NETWORK;
const filename = ProjectENV.ACCOUNT_FILE_NAME;

const accounts = generateAccounts(numberOfAccounts, typeName, networkName);
console.log("Generated accounts:", accounts);

saveAccountsToJson(accounts, networkName, filename);
console.log(`Accounts saved to ${filename} in the ${networkName} directory.`);

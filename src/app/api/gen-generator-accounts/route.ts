import { NextRequest, NextResponse } from "next/server";
import { generateAccounts, saveAccountsToJson } from "@/utils/genBtcAccount";
import { ProjectENV } from "@/env";
import { importBtcAddressesFromFile } from "@/utils/importBtcAddress";

export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json();

    const typeName = ProjectENV.GENERATE_ACCOUNTS_TYPE;
    const networkName = ProjectENV.NETWORK;
    const filename = ProjectENV.ACCOUNT_FILE_NAME;

    console.log(
      `--- Generating ${count} accounts for ${networkName} with type ${typeName}`
    );
    const accounts = generateAccounts(count, typeName, networkName);
    saveAccountsToJson(accounts, networkName, filename);

    console.log(
      `Accounts generated and saved to JSON at ${filename} for ${networkName}`
    );

    // Import BTC addresses after generating accounts
    await importBtcAddressesFromFile();

    console.log("BTC addresses imported");

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Error generating and importing accounts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate and import accounts" },
      { status: 500 }
    );
  }
}

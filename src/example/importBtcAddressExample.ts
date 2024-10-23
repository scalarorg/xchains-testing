import { importBtcAddressesFromFile } from "@/utils/importBtcAddress";

async function runImportBtcAddressExample() {
  try {
    await importBtcAddressesFromFile();
    console.log("Bitcoin addresses imported successfully.");
  } catch (error) {
    console.error("Error importing Bitcoin addresses:", error);
  }
}

runImportBtcAddressExample();

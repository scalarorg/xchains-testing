import { describe, it } from "bun:test";
const ElectrumClient = require("electrum-client");

describe("Electrum", () => {
  const clientPort = 60001;
  const clientHost = "localhost";
  const protocol = "tcp";
  it(
    "should connect to electrum server and get staking txs",
    async () => {
      const client = new ElectrumClient(clientPort, clientHost, protocol);
      console.log("Start Electrum");
      await client.connect();

      console.log("--- get vault txs ---");

      const reponse = await client.request("vault.transactions.subscribe", [
        1,
        null,
      ]);
      console.log("--- Amount of staking txs:", reponse.length);
      console.log("reponse", reponse);

      // Clean up
      await client.close();
    },
    { timeout: 300_000 }
  );
});

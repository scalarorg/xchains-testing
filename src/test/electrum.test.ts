import { describe, it } from "bun:test";
const ElectrumClient = require("electrum-client");

describe("Electrum", () => {
  const clientPort = 60401;
  const clientHost = "127.0.0.1";
  const protocol = "tcp";
  it(
    "should connect to electrum server and get staking txs",
    async () => {
      const client = new ElectrumClient(clientPort, clientHost, protocol);
      console.log("Start Electrum");
      await client.connect();

      const key =
        "00000f53000000014a128f98a1d746df063c507d74a28e6990e82e6905f1ddc92c42054442c7876d";
      console.log("--- get vault txs ---");

      // // Create an event listener that keeps running
      // client.subscribe.on("vault.transactions.subscribe", (v: any) => {
      //   console.log("New subscription message:", v);
      // });

      // // Keep the connection alive
      // await new Promise((_, reject) =>
      //   setTimeout(() => reject(new Error("Test timeout")), 300_000)
      // );

      const reponse = await client.request("vault.transactions.subscribe", [
        2,
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

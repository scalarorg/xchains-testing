import { getNetworkConfigPath } from "@/utils/path";
import Client from "bitcoin-core-ts";
import * as fs from "fs";
import path from "path";
import { ProjectENV } from "@/env";
// Read and parse the JSON configuration file
const configPath = path.join(getNetworkConfigPath(), "btcClient.json");
const btcClientConfigFile = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const btcClientConfig = btcClientConfigFile[ProjectENV.NETWORK];

let client: Client;
export const getClient = function () {
  if (!client) {
    client = new Client({
      network: btcClientConfig.network,
      host: btcClientConfig.host,
      port: btcClientConfig.port,
      wallet: btcClientConfig.wallet,
      username: btcClientConfig.username,
      password: btcClientConfig.password,
      ssl: btcClientConfig.ssl,
    });
  }
  return client;
};

// const response = await client.command(method, ...params);

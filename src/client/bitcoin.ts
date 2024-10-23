import Client from "bitcoin-core-ts";
import { ProjectENV } from "@/env";

let client: Client;
export const getClient = function () {
  if (!client) {
    client = new Client({
      network: ProjectENV.NETWORK,
      host: ProjectENV.BITCOIN_NODE_ADDRESS,
      port: ProjectENV.BITCOIN_NODE_PORT,
      wallet: ProjectENV.BITCOIN_WALLET,
      username: ProjectENV.BITCOIN_USER,
      password: ProjectENV.BITCOIN_PASSWORD,
      ssl: ProjectENV.SSL_ENABLED === "true",
    });
  }
  return client;
};

// const response = await client.command(method, ...params);

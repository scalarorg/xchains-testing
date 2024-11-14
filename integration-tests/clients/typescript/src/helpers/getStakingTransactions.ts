const ElectrumClient = require("electrum-client");

export async function getStakingTransactions(
  port: number,
  host: string,
  protocol: string,
  numberOfTransactions: number,
  fromKey: string | null
) {
  const client = new ElectrumClient(port, host, protocol);
  try {
    await client.connect();

    const transactions = await client.request("vault.transactions.subscribe", [
      numberOfTransactions,
      fromKey,
    ]);
    return transactions;
  } finally {
    await client.close();
  }
}

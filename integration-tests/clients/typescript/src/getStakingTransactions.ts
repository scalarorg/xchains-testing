import { getStakingTransactions } from "./helpers";

async function main() {
  const port = parseInt(process.argv[2] || "50001");
  const host = process.argv[3] || "localhost";
  const protocol = process.argv[4] || "tcp";
  const numberOfTransactions = parseInt(process.argv[5] || "10");
  const fromKey = process.argv[6] || null;

  try {
    const transactions = await getStakingTransactions(
      port,
      host,
      protocol,
      numberOfTransactions,
      fromKey
    );
    console.log(JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

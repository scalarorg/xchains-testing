// // Open db, get all staking TX that is pending -> unstake
// // For all funded accounts, check all account, then return all coin to original

// import { sendEther } from "@/transactions/sendEther"; // Assuming this function exists
// import prisma from "@/utils/prisma";
// import { unbondingServiceTx } from "./unbondingServiceTx";
// import { StakerAccount } from "@/types/staker";
// import { getAccountsPath, getReturnFundsConfigPath } from "@/utils/path";
// import fs from "fs";
// import { ProjectENV } from "@/env";
// import { getClient } from "@/client/bitcoin";
// import { getBitcoinNetwork } from "@/utils/bitcoin";
// import { fromBtcUnspentToMempoolUTXO } from "@/utils/bitcoin";
// import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
// import { prepareTx, toPsbt } from "xchains-bitcoin-ts/src/utils/bitcoin";
// import * as bitcoin from "bitcoinjs-lib";
// import { ECPairFactory } from "ecpair";
// import * as ecc from "tiny-secp256k1";
// import { ethers } from "ethers";
// import { getMempoolAxiosClient } from "@/client/mempool-axios";

// bitcoin.initEccLib(ecc);
// const ECPair = ECPairFactory(ecc);

// export async function returnAllFunds(): Promise<void> {
//   const configPath = getReturnFundsConfigPath();
//   const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
//   const networkName = ProjectENV.NETWORK;
//   const btcFundSourceAddress = config.btcFundsSourceAddress;
//   const ethFundSourceAddress = config.ethFundsSourceAddress;
//   const covenantPublicKeys = ProjectENV.COVENANT_PUBLIC_KEYS.split(",");
//   const covenantQuorum = Number(ProjectENV.COVENANT_QUORUM);
//   const burnContractAddress = ProjectENV.BURN_CONTRACT_ADDRESS;
//   const burnDestinationChain = ProjectENV.BURN_DESTINATION_CHAIN;
//   const burnDestinationAddress = ProjectENV.BURN_DESTINATION_ADDRESS;
//   const sBTCContractAddress = ProjectENV.SBTC_CONTRACT_ADDRESS;
//   const ethRpcUrl = ProjectENV.ETH_RPC_URL;
//   const accountFileName = ProjectENV.ACCOUNT_FILE_NAME;

//   const accountsFilePath = getAccountsPath(networkName, accountFileName);
//   const allStakerAccounts: StakerAccount[] = JSON.parse(
//     fs.readFileSync(accountsFilePath, "utf-8")
//   );

//   // Unstake all bonding transactions
//   await unstakeAllBondingTransactions(
//     allStakerAccounts,
//     btcFundSourceAddress,
//     covenantPublicKeys,
//     covenantQuorum,
//     burnContractAddress,
//     burnDestinationChain,
//     burnDestinationAddress,
//     sBTCContractAddress,
//     ethRpcUrl
//   );

//   // Return all BTC to fund source
//   await returnFunds(
//     allStakerAccounts,
//     btcFundSourceAddress,
//     networkName,
//     ethFundSourceAddress,
//     ethRpcUrl
//   );
// }

// export async function unstakeAllBondingTransactions(
//   allStakerAccounts: StakerAccount[],
//   btcFundSourceAddress: string,
//   covenantPublicKeys: string[],
//   covenantQuorum: number,
//   burnContractAddress: string,
//   burnDestinationChain: string,
//   burnDestinationAddress: string,
//   sBTCContractAddress: string,
//   ethRpcUrl: string
// ): Promise<void> {
//   const pendingBondingTxs = await prisma.bondingTransaction.findMany({
//     where: {
//       status: {
//         not: "UNSTAKED",
//       },
//     },
//   });
//   console.log(`Found ${pendingBondingTxs.length} pending bonding transactions`);

//   // Attempt to unstake each pending bonding transaction
//   for (const bondingTx of pendingBondingTxs) {
//     try {
//       const stakerAccount = allStakerAccounts.find(
//         (account) => account.btcAddress === bondingTx.staker_address
//       );
//       if (!stakerAccount) {
//         console.error(
//           `Staker account not found for bonding transaction ${bondingTx.txid}`
//         );
//         continue;
//       }
//       const btcStakerAccount = {
//         publicKey: stakerAccount.btcPublicKey,
//         address: stakerAccount.btcAddress,
//         privateKeyHex: stakerAccount.btcPrivateKeyHex,
//         privateKeyWIF: stakerAccount.btcPrivateKeyWIF,
//       };
//       await unbondingServiceTx(
//         btcStakerAccount,
//         btcFundSourceAddress,
//         bondingTx.txhex,
//         covenantPublicKeys,
//         covenantQuorum,
//         burnContractAddress,
//         burnDestinationChain,
//         burnDestinationAddress,
//         sBTCContractAddress,
//         Number(bondingTx.mintAmount),
//         ethRpcUrl,
//         stakerAccount.ethPrivateKey
//       );
//       console.log(`Unstaked bonding transaction: ${bondingTx.txid}`);
//     } catch (error) {
//       console.error(
//         `Error unstaking bonding transaction ${bondingTx.txid}:`,
//         error
//       );
//     }
//   }

//   // Clear bonding transactions from database
//   await prisma.bondingTransaction.deleteMany();
//   console.log("Cleared all bonding transactions from database");
// }

// export async function returnFunds(
//   allStakerAccounts: StakerAccount[],
//   btcFundSourceAddress: string,
//   networkName: string,
//   ethFundSourceAddress: string,
//   ethRpcUrl: string
// ): Promise<void> {
//   const mempoolAxiosClient = getMempoolAxiosClient();
//   const btcClient = getClient();
//   const network = getBitcoinNetwork(networkName);

//   // Get all funded accounts from database, then filter all staker accounts
//   const fundedAccounts = await prisma.fundedAccount.findMany();
//   const stakerAccounts = allStakerAccounts.filter((account) =>
//     fundedAccounts.some(
//       (fundedAccount: { btcAddress: string }) =>
//         fundedAccount.btcAddress === account.btcAddress
//     )
//   );

//   for (const account of stakerAccounts) {
//     // return BTC
//     try {
//       // Fetch UTXOs for the sender's address
//       const utxos: AddressTxsUtxo[] =
//         networkName === "regtest"
//           ? (
//               await btcClient.command("listunspent", 0, 9999999, [
//                 account.btcAddress,
//               ])
//             ).map(fromBtcUnspentToMempoolUTXO)
//           : await mempoolAxiosClient.getAddressTxsUtxo(account.btcAddress);

//       const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
//       const { fastestFee: feeRate } =
//         await mempoolAxiosClient.getFeesRecommended();
//       // Calculate package size
//       // P2WPKH input: 68 vbytes, P2WPKH output: 31 vbytes, fixed overhead: 10.5 vbytes
//       const inputSize = 68;
//       const outputSize = 31;
//       const fixedOverhead = 10.5;
//       const packageSize = Math.ceil(
//         inputSize * utxos.length + outputSize + fixedOverhead
//       );
//       const rbf = false;

//       // Calculate the amount to send arcording to balance and feeRate
//       const amount = balance - feeRate * packageSize;
//       const outputs = [
//         {
//           address: btcFundSourceAddress,
//           value: amount,
//         },
//       ];

//       const { ok, error } = prepareTx({
//         inputs: [],
//         outputs,
//         regularUTXOs: utxos,
//         feeRate,
//         address: account.btcAddress,
//       });

//       if (!ok) {
//         console.error(
//           `Error preparing transaction for ${account.btcAddress}:`,
//           error
//         );
//         continue;
//       }

//       const psbt = toPsbt({
//         tx: ok!,
//         pubkey: Buffer.from(account.btcPublicKey, "hex"),
//         rbf,
//       });

//       // Sign the inputs
//       const keyPair = ECPair.fromWIF(account.btcPrivateKeyWIF, network);
//       psbt.signAllInputs(keyPair);

//       // Validate and finalize the transaction
//       psbt.finalizeAllInputs();

//       // Get the transaction hex
//       const txHex = psbt.extractTransaction().toHex();

//       // Broadcast the transaction
//       const txid = await btcClient.command("sendrawtransaction", txHex);
//       console.log(
//         `Returned ${amount} from ${account.btcAddress} to ${btcFundSourceAddress}. TXID: ${txid}`
//       );
//     } catch (error) {
//       console.error(`Error returning BTC from ${account.btcAddress}:`, error);
//     }

//     // return ETH
//     try {
//       const ethProvider = new ethers.JsonRpcProvider(ethRpcUrl);
//       const ethWallet = new ethers.Wallet(account.ethPrivateKey, ethProvider);
//       const balance = await ethProvider.getBalance(ethWallet.address);
//       if (balance > 0) {
//         const txid = await sendEther(
//           ethWallet,
//           ethFundSourceAddress,
//           balance.toString(),
//           ethRpcUrl
//         );
//         console.log(
//           `Returned ${balance} from ${account.btcAddress} to ${ethFundSourceAddress}. TXID: ${txid}`
//         );
//       }
//     } catch (error) {
//       console.error(`Error returning ETH from ${account.btcAddress}:`, error);
//     }
//   }
// }

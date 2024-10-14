import { MempoolInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/mempool";
import { AddressInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { BlockInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/blocks";
import { DifficultyInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/difficulty";
import { FeeInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/fees";
import { TxInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/transactions";
import mempoolJS from "@mempool/mempool.js";
import path from "path";
import * as fs from "fs";
import { getNetworkConfigPath } from "@/utils/path";

// Read and parse the JSON configuration file
const configPath = path.join(getNetworkConfigPath(), "mempool.json");
const mempoolClientConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

class BtcMempool {
  addresses: AddressInstance;
  blocks: BlockInstance;
  difficulty: DifficultyInstance;
  fees: FeeInstance;
  mempool: MempoolInstance;
  transactions: TxInstance;
  constructor() {
    const {
      bitcoin: { addresses, blocks, difficulty, fees, mempool, transactions },
    } = mempoolJS({
      hostname: mempoolClientConfig.hostname,
      network: mempoolClientConfig.network,
    });

    this.addresses = addresses;
    this.blocks = blocks;
    this.difficulty = difficulty;
    this.fees = fees;
    this.mempool = mempool;
    this.transactions = transactions;
  }
}

export default BtcMempool;

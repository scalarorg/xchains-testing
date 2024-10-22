import { MempoolInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/mempool";
import { AddressInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { BlockInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/blocks";
import { DifficultyInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/difficulty";
import { FeeInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/fees";
import { TxInstance } from "@mempool/mempool.js/lib/interfaces/bitcoin/transactions";
import mempoolJS from "@mempool/mempool.js";
import { ProjectENV } from "@/env";

export class BtcMempool {
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
      hostname: ProjectENV.MEMPOOL_WEB,
      network: ProjectENV.NETWORK,
    });

    this.addresses = addresses;
    this.blocks = blocks;
    this.difficulty = difficulty;
    this.fees = fees;
    this.mempool = mempool;
    this.transactions = transactions;
  }
}

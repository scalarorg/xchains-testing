import { Router } from "express";
import { getStakingTransactionsHandler } from "../handlers/stakingTransactions";

const router = Router();

router.post("/staking-transactions", getStakingTransactionsHandler);

export default router;

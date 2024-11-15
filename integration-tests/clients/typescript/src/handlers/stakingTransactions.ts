import { Request, Response } from "express";
import { getStakingTransactions } from "../helpers/getStakingTransactions";

interface StakingTransactionRequest {
  port?: number;
  host?: string;
  protocol?: string;
  numberOfTransactions?: number;
  fromKey?: string | null;
}

export async function getStakingTransactionsHandler(
  req: Request,
  res: Response
) {
  try {
    const {
      port = 50001,
      host = "localhost",
      protocol = "tcp",
      numberOfTransactions = 10,
      fromKey = null,
    } = req.body as StakingTransactionRequest;

    const transactions = await getStakingTransactions(
      port,
      host,
      protocol,
      numberOfTransactions,
      fromKey
    );

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

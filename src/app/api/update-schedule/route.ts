import { NextResponse } from "next/server";
import cron from "node-cron";
import { getCurrentSchedule, setCurrentSchedule } from "@/utils/cronSchedule";
import prisma from "@/utils/prisma";
import { bondingTxExp } from "@/example/bondingTxExp";

let cronJob: cron.ScheduledTask | null = null;

async function scheduleTx() {
  if (cronJob) {
    cronJob.stop();
  }
  cronJob = cron.schedule(getCurrentSchedule(), async () => {
    try {
      const result = await bondingTxExp();
      if (result) {
        const { txid, bondingAmount } = result;
        console.log("Scheduled transaction executed successfully");

        await prisma.bondingTransaction.create({
          data: {
            txid,
            amount: BigInt(bondingAmount),
          },
        });
      }
    } catch (error) {
      console.error("Error executing scheduled transaction:", error);
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { schedule } = body;

  if (cron.validate(schedule)) {
    setCurrentSchedule(schedule);
    scheduleTx();
    return NextResponse.json(
      { message: "Schedule updated successfully" },
      { status: 200 }
    );
  } else {
    return NextResponse.json(
      { error: "Invalid cron schedule" },
      { status: 400 }
    );
  }
}

// Initialize the cron job when the server starts
scheduleTx();

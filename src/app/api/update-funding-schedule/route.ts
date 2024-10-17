import { NextResponse } from "next/server";
import cron from "node-cron";
import {
  getCurrentFundingSchedule,
  setCurrentFundingSchedule,
} from "@/utils/cronSchedule";
import { performFunding } from "@/scheduled-tasks/funding";

let cronJob: cron.ScheduledTask | null = null;

async function scheduleFundingTx() {
  if (cronJob) {
    cronJob.stop();
  }
  cronJob = cron.schedule(getCurrentFundingSchedule(), async () => {
    try {
      const result = await performFunding();
      console.log("Scheduled funding transaction executed successfully");
      console.log(result);
    } catch (error) {
      console.error("Error executing scheduled funding transaction:", error);
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { schedule } = body;

  if (cron.validate(schedule)) {
    setCurrentFundingSchedule(schedule);
    scheduleFundingTx();
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
scheduleFundingTx();

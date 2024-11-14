import { NextResponse } from "next/server";
import cron from "node-cron";
import {
  getCurrentStakingSchedule,
  setCurrentStakingSchedule,
} from "@/utils/cronSchedule";
import { performStaking } from "@/scheduled-tasks/staking";

let cronJob: cron.ScheduledTask | null = null;

async function scheduleStakingTx() {
  if (cronJob) {
    cronJob.stop();
  }
  cronJob = cron.schedule(getCurrentStakingSchedule(), async () => {
    try {
      await performStaking();
    } catch (error) {
      console.error("Error executing scheduled staking transaction:", error);
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { schedule } = body;

  if (cron.validate(schedule)) {
    setCurrentStakingSchedule(schedule);
    scheduleStakingTx();
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
scheduleStakingTx();

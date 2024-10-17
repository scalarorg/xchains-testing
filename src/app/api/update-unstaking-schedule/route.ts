import { NextResponse } from "next/server";
import cron from "node-cron";
import {
  getCurrentUnstakingSchedule,
  setCurrentUnstakingSchedule,
} from "@/utils/cronSchedule";
import { performUnstaking } from "@/scheduled-tasks/unstaking";

let cronJob: cron.ScheduledTask | null = null;

async function scheduleUnstakingTx() {
  if (cronJob) {
    cronJob.stop();
  }
  cronJob = cron.schedule(getCurrentUnstakingSchedule(), async () => {
    try {
      await performUnstaking();
      console.log("Scheduled unstaking executed successfully");
    } catch (error) {
      console.error("Error executing scheduled unstaking:", error);
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule } = body;

    if (!schedule) {
      return NextResponse.json(
        { error: "Missing required parameter: schedule" },
        { status: 400 }
      );
    }

    if (!cron.validate(schedule)) {
      return NextResponse.json(
        { error: "Invalid cron schedule" },
        { status: 400 }
      );
    }

    setCurrentUnstakingSchedule(schedule);
    await scheduleUnstakingTx();

    return NextResponse.json(
      { message: "Unstaking schedule updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating unstaking schedule:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the unstaking schedule" },
      { status: 500 }
    );
  }
}

// Initialize the cron job when the server starts
scheduleUnstakingTx();

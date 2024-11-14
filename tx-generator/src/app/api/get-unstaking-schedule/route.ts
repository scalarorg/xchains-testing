import { NextResponse } from "next/server";
import { getCurrentUnstakingSchedule } from "@/utils/cronSchedule";

export async function GET() {
  const schedule = getCurrentUnstakingSchedule();
  return NextResponse.json({ schedule });
}

import { NextResponse } from "next/server";
import { getCurrentStakingSchedule } from "@/utils/cronSchedule";

export async function GET() {
  const schedule = getCurrentStakingSchedule();
  return NextResponse.json({ schedule });
}

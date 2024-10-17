import { NextResponse } from "next/server";
import { getCurrentFundingSchedule } from "@/utils/cronSchedule";

export async function GET() {
  const schedule = getCurrentFundingSchedule();
  return NextResponse.json({ schedule });
}

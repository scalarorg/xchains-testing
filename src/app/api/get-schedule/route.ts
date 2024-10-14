import { NextResponse } from "next/server";
import { getCurrentSchedule } from "@/utils/cronSchedule";

export async function GET() {
  const schedule = getCurrentSchedule();
  return NextResponse.json({ schedule });
}

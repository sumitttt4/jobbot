import { NextResponse } from "next/server";
import { getStats } from "@/lib/data";

/** GET /api/stats — totals for the dashboard. */
export async function GET() {
  return NextResponse.json(getStats());
}

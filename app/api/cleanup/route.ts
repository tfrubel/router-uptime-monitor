import { NextRequest, NextResponse } from "next/server"
import { cleanupOldData, getDatabaseStats } from "@/lib/monitoring/cleanup"

export async function GET() {
  const stats = await getDatabaseStats()
  return NextResponse.json(stats)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const retentionDays = body.retentionDays || 30

  const result = await cleanupOldData(retentionDays)
  return NextResponse.json(result)
}

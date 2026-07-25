import { NextRequest, NextResponse } from "next/server"
import { pingHost, pingInternet } from "@/lib/monitoring/ping"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { ip, type } = body

  if (!ip) {
    return NextResponse.json({ error: "IP required" }, { status: 400 })
  }

  const pingResult = await pingHost(ip, 5, 3)

  let internetCheck = null
  if (type === "generic" || !type) {
    internetCheck = await pingInternet(false, ip)
  }

  return NextResponse.json({
    reachable: pingResult.success,
    latency: pingResult.latency,
    packetLoss: pingResult.packetLoss,
    internetCheck,
  })
}

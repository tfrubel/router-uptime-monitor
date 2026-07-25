import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { routers, samples, settings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { pingHost, pingInternet } from "@/lib/monitoring/ping"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const routerId = searchParams.get("routerId")
  const aggressive = searchParams.get("aggressive") === "true"

  const allSettings = db.select().from(settings).all()
  const settingsMap: Record<string, string> = {}
  for (const s of allSettings) {
    settingsMap[s.key] = s.value
  }

  let targetRouters
  if (routerId) {
    const router = db
      .select()
      .from(routers)
      .where(eq(routers.id, Number(routerId)))
      .get()
    targetRouters = router ? [router] : []
  } else {
    targetRouters = db.select().from(routers).all()
  }

  const gatewayIp =
    settingsMap.gatewayIp ||
    (targetRouters.length > 0 ? targetRouters[0].ip : undefined)
  const internetCheck = await pingInternet(aggressive, gatewayIp, {
    checkGateway: settingsMap.checkGateway !== "false",
    cloudflareHost: settingsMap.cloudflareHost || "1.1.1.1",
    checkCloudflare: settingsMap.checkCloudflare !== "false",
    googleHost: settingsMap.googleHost || "8.8.8.8",
    checkGoogle: settingsMap.checkGoogle !== "false",
    dnsHost: settingsMap.dnsHost || "9.9.9.9",
    checkDns: settingsMap.checkDns !== "false",
    websiteHost: settingsMap.websiteHost || "google.com",
    checkWebsite: settingsMap.checkWebsite !== "false",
  })

  const metrics = await Promise.all(
    targetRouters.map(async (router) => {
      const pingResult = await pingHost(router.ip, 3, 3)

      const sample = {
        routerId: router.id,
        timestamp: new Date(),
        type: "metrics" as const,
        download: 0,
        upload: 0,
        ping: pingResult.latency,
        packetLoss: pingResult.packetLoss,
        jitter: pingResult.jitter,
        gatewayPing: internetCheck.gateway.latency || null,
        cloudflarePing: internetCheck.cloudflare.latency || null,
        googlePing: internetCheck.google.latency || null,
        dnsPing: internetCheck.dns.latency || null,
        websitePing: internetCheck.website.latency || null,
      }

      if (!aggressive) {
        db.insert(samples).values(sample).run()
        db.update(routers)
          .set({ isOnline: pingResult.success, lastSeen: new Date() })
          .where(eq(routers.id, router.id))
          .run()
      }

      return {
        routerName: router.name,
        isOnline: pingResult.success,
        ...sample,
      }
    })
  )

  return NextResponse.json({ routers: metrics, internet: internetCheck })
}

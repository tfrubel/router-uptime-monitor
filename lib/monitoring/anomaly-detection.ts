import { db } from "@/lib/db"
import { samples, events, routers } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"

interface AnomalyThresholds {
  highLatency: number
  packetLoss: number
  cpuHigh: number
  memoryHigh: number
  tempHigh: number
}

const defaultThresholds: AnomalyThresholds = {
  highLatency: 100,
  packetLoss: 5,
  cpuHigh: 90,
  memoryHigh: 90,
  tempHigh: 80,
}

export async function detectAnomalies(routerId: number) {
  const recentSamples = db
    .select()
    .from(samples)
    .where(
      and(
        eq(samples.routerId, routerId),
        gte(samples.timestamp, new Date(Date.now() - 60000))
      )
    )
    .orderBy(desc(samples.timestamp))
    .limit(5)
    .all()

  if (recentSamples.length === 0) return []

  const latest = recentSamples[0]
  const anomalies: Array<{
    type: string
    severity: "info" | "warning" | "critical"
    message: string
  }> = []

  if (latest.ping && latest.ping > defaultThresholds.highLatency) {
    anomalies.push({
      type: "high_latency",
      severity: latest.ping > 200 ? "critical" : "warning",
      message: `High latency detected: ${latest.ping.toFixed(1)}ms`,
    })
  }

  if (latest.packetLoss && latest.packetLoss > defaultThresholds.packetLoss) {
    anomalies.push({
      type: "packet_loss",
      severity: latest.packetLoss > 20 ? "critical" : "warning",
      message: `Packet loss detected: ${latest.packetLoss.toFixed(1)}%`,
    })
  }

  if (latest.cpuUsage && latest.cpuUsage > defaultThresholds.cpuHigh) {
    anomalies.push({
      type: "cpu_over_90",
      severity: latest.cpuUsage > 95 ? "critical" : "warning",
      message: `High CPU usage: ${latest.cpuUsage.toFixed(1)}%`,
    })
  }

  if (latest.memoryUsage && latest.memoryUsage > defaultThresholds.memoryHigh) {
    anomalies.push({
      type: "memory_over_90",
      severity: latest.memoryUsage > 95 ? "critical" : "warning",
      message: `High memory usage: ${latest.memoryUsage.toFixed(1)}%`,
    })
  }

  if (latest.temperature && latest.temperature > defaultThresholds.tempHigh) {
    anomalies.push({
      type: "high_temperature",
      severity: latest.temperature > 90 ? "critical" : "warning",
      message: `High temperature: ${latest.temperature.toFixed(1)}°C`,
    })
  }

  for (const anomaly of anomalies) {
    const recentEvent = db
      .select()
      .from(events)
      .where(
        and(
          eq(events.routerId, routerId),
          eq(
            events.type,
            anomaly.type as "high_latency" | "cpu_over_90" | "memory_over_90"
          ),
          gte(events.timestamp, new Date(Date.now() - 300000))
        )
      )
      .get()

    if (!recentEvent) {
      db.insert(events)
        .values({
          routerId,
          type: anomaly.type as
            "high_latency" | "cpu_over_90" | "memory_over_90",
          severity: anomaly.severity,
          message: anomaly.message,
        })
        .run()
    }
  }

  return anomalies
}

export async function checkRouterOnline(routerId: number) {
  const router = db.select().from(routers).where(eq(routers.id, routerId)).get()

  if (!router) return

  const wasOnline = router.isOnline

  const latestSample = db
    .select()
    .from(samples)
    .where(eq(samples.routerId, routerId))
    .orderBy(desc(samples.timestamp))
    .limit(1)
    .get()

  const isOnline = latestSample
    ? latestSample.ping !== null && latestSample.ping > 0
    : false

  if (wasOnline && !isOnline) {
    db.insert(events)
      .values({
        routerId,
        type: "router_offline",
        severity: "critical",
        message: `${router.name} went offline`,
      })
      .run()
  } else if (!wasOnline && isOnline) {
    db.insert(events)
      .values({
        routerId,
        type: "info",
        severity: "info",
        message: `${router.name} came back online`,
      })
      .run()
  }

  db.update(routers)
    .set({ isOnline, lastSeen: new Date() })
    .where(eq(routers.id, routerId))
    .run()
}

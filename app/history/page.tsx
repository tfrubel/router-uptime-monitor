"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedValue } from "@/components/ui/animated-value"
import { NetworkTimeline } from "@/components/charts/network-timeline"
import { LatencyChart } from "@/components/charts/latency-chart"
import { BandwidthChart } from "@/components/charts/bandwidth-chart"
import type { Sample } from "@/lib/db/schema"

type TimeRange = "daily" | "weekly" | "monthly"

export default function HistoryPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")
  const [samples, setSamples] = useState<Sample[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const routersRes = await fetch("/api/routers")
        const routers = await routersRes.json()
        if (routers.length > 0) {
          const id = routers[0].id
          const hours =
            timeRange === "daily" ? 24 : timeRange === "weekly" ? 168 : 720
          const samplesRes = await fetch(
            `/api/samples?routerId=${id}&hours=${hours}`
          )
          const data = await samplesRes.json()
          setSamples(data)
        }
      } catch (e) {
        console.error("Failed to fetch:", e)
      }
    }
    fetchData()
  }, [timeRange])

  const timelineSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    status: (
      ["healthy", "healthy", "healthy", "slow", "healthy", "healthy"] as const
    )[i % 6] as "healthy" | "slow" | "offline" | "unknown",
  }))

  const avgPing = samples.length
    ? samples.reduce((acc, s) => acc + (s.ping || 0), 0) / samples.length
    : 0
  const avgPacketLoss = samples.length
    ? samples.reduce((acc, s) => acc + (s.packetLoss || 0), 0) / samples.length
    : 0
  const totalDownload = samples.reduce((acc, s) => acc + (s.download || 0), 0)
  const totalUpload = samples.reduce((acc, s) => acc + (s.upload || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">History</h1>
      </div>

      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar size={20} className="text-muted-foreground" />
            {timeRange === "daily" && "Last 24 hours"}
            {timeRange === "weekly" && "Last 7 days"}
            {timeRange === "monthly" && "Last 30 days"}
          </CardTitle>
          <Badge variant="secondary">{samples.length} samples</Badge>
        </CardHeader>
        <CardContent>
          <NetworkTimeline slots={timelineSlots} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Avg Ping</p>
            <AnimatedValue
              value={`${avgPing.toFixed(1)}ms`}
              as="p"
              className="text-3xl font-extrabold tracking-tight"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Avg Packet Loss</p>
            <AnimatedValue
              value={`${avgPacketLoss.toFixed(1)}%`}
              as="p"
              className="text-3xl font-extrabold tracking-tight"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Total Download</p>
            <p className="text-2xl font-bold tracking-tight">
              {(totalDownload / 1000000000).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Total Upload</p>
            <p className="text-2xl font-bold tracking-tight">
              {(totalUpload / 1000000000).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bandwidth History</CardTitle>
          </CardHeader>
          <CardContent>
            <BandwidthChart samples={samples} height={300} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latency History</CardTitle>
          </CardHeader>
          <CardContent>
            <LatencyChart samples={samples} height={300} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

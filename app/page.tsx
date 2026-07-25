"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Globe,
  HardDrives,
  Plus,
  Lightning,
  CheckCircle,
  XCircle,
  Clock,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { LatencyChart } from "@/components/charts/latency-chart"
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton"
import { AnimatedValue } from "@/components/ui/animated-value"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import type { Router } from "@/lib/db/schema"
import type { Sample } from "@/lib/db/schema"

interface InternetCheck {
  gateway: { success: boolean; latency: number }
  cloudflare: { success: boolean; latency: number }
  google: { success: boolean; latency: number }
  dns: { success: boolean; latency: number }
  website: { success: boolean; latency: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const [routers, setRouters] = useState<Router[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [internet, setInternet] = useState<InternetCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const { aggressiveMode, toggleAggressiveMode } = useAppStore()
  const pollingInterval = usePollingInterval()

  const fetchNormalData = useCallback(async () => {
    try {
      const [routersRes, metricsRes] = await Promise.all([
        fetch("/api/routers"),
        fetch("/api/metrics"),
      ])
      const routersData = await routersRes.json()
      const metricsData = await metricsRes.json()
      setRouters(routersData)
      setInternet(metricsData.internet)

      if (routersData.length > 0) {
        const targetId = routersData[0].id
        const samplesRes = await fetch(
          `/api/samples?routerId=${targetId}&hours=1`
        )
        const samplesData = await samplesRes.json()
        setSamples(samplesData)
      }
    } catch (e) {
      console.error("Failed to fetch:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (aggressiveMode.enabled) return
    fetchNormalData()
    const interval = setInterval(fetchNormalData, pollingInterval)
    return () => clearInterval(interval)
  }, [fetchNormalData, aggressiveMode.enabled, pollingInterval])

  const latestSample = samples[0]
  const gatewayOk = internet?.gateway?.success
  const internetOk =
    internet?.cloudflare?.success ||
    internet?.google?.success ||
    internet?.website?.success

  const lastPing = latestSample?.ping || null

  const avgPing =
    samples.length > 0
      ? samples.reduce((a, s) => a + (s.ping || 0), 0) / samples.length
      : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={aggressiveMode.enabled ? "default" : "outline"}
            onClick={() => {
              toggleAggressiveMode()
              if (!aggressiveMode.enabled) {
                router.push("/aggressive")
              }
            }}
            className={
              aggressiveMode.enabled ? "bg-amber-500 hover:bg-amber-600" : ""
            }
          >
            <Lightning size={16} className="mr-1" />
            {aggressiveMode.enabled ? "Stop" : "Aggressive 2min"}
          </Button>
          <Link href="/routers/add">
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              Add Router
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <ChartSkeleton height={250} />
        </div>
      ) : routers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardDrives size={48} className="mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No Routers Configured</h2>
            <p className="mb-4 text-muted-foreground">
              Add a router to start monitoring your network.
            </p>
            <Link href="/routers/add">
              <Button>
                <Plus size={16} className="mr-2" />
                Add Router
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Internet</p>
                  <StatusIndicator
                    status={internetOk ? "online" : "offline"}
                    label={internetOk ? "Connected" : "No Connection"}
                    size="lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {lastPing ? (
                      <>
                        <span>Last: </span>
                        <AnimatedValue value={`${lastPing.toFixed(1)}ms`} />
                      </>
                    ) : (
                      "Waiting…"
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Globe size={20} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Gateway</p>
                  <StatusIndicator
                    status={gatewayOk ? "online" : "offline"}
                    label={gatewayOk ? "Reachable" : "Unreachable"}
                    size="lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {internet?.gateway?.latency ? (
                      <AnimatedValue
                        value={`${internet.gateway.latency.toFixed(1)}ms`}
                      />
                    ) : (
                      "Router"
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <HardDrives size={20} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <AnimatedValue
                    value={`${avgPing.toFixed(1)}ms`}
                    as="p"
                    className="text-3xl font-extrabold tracking-tight"
                  />
                  <p className="text-xs text-muted-foreground">
                    {samples.length} samples
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Clock size={20} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Packet Loss</p>
                  <AnimatedValue
                    value={`${latestSample?.packetLoss?.toFixed(1) || 0}%`}
                    as="p"
                    className="text-3xl font-extrabold tracking-tight"
                  />
                  <p className="text-xs text-muted-foreground">Current</p>
                </div>
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Globe size={20} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Connectivity Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "Gateway", target: internet?.gateway },
                  { label: "Cloudflare", target: internet?.cloudflare },
                  { label: "Google DNS", target: internet?.google },
                  { label: "Quad9", target: internet?.dns },
                  { label: "Website", target: internet?.website },
                ].map(({ label, target }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {target?.success ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {target?.latency ? (
                          <AnimatedValue
                            value={`${target.latency.toFixed(1)}ms`}
                          />
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latency History</CardTitle>
            </CardHeader>
            <CardContent>
              <LatencyChart samples={samples} height={250} />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {routers.map((r) => (
              <Link key={r.id} href={`/routers/${r.id}`}>
                <Card className="cursor-pointer transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.name}</span>
                      <StatusIndicator
                        status={r.isOnline ? "online" : "offline"}
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.ip}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

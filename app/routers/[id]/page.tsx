"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Globe,
  Cpu,
  Memory,
  HardDrives,
  Users,
  ChartLineUp,
  Trash,
  Warning,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { Gauge } from "@/components/ui/gauge"
import { BandwidthChart } from "@/components/charts/bandwidth-chart"
import { LatencyChart } from "@/components/charts/latency-chart"
import { CpuMemoryChart } from "@/components/charts/cpu-memory-chart"
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton"
import { AnimatedValue } from "@/components/ui/animated-value"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import type { Router } from "@/lib/db/schema"
import type { Sample, Event } from "@/lib/db/schema"

type Tab =
  "overview" | "traffic" | "cpu" | "memory" | "clients" | "events" | "settings"

export default function RouterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const routerId = params.id as string
  const [routerData, setRouterData] = useState<Router | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const { aggressiveMode } = useAppStore()
  const pollingInterval = usePollingInterval()

  const tabs: { id: Tab; label: string; icon: typeof Globe }[] = [
    { id: "overview", label: "Overview", icon: Globe },
    { id: "events", label: "Events", icon: Warning },
    { id: "settings", label: "Settings", icon: HardDrives },
    ...(routerData?.type === "openwrt"
      ? [
          { id: "traffic" as Tab, label: "Traffic", icon: ChartLineUp },
          { id: "cpu" as Tab, label: "CPU", icon: Cpu },
          { id: "memory" as Tab, label: "Memory", icon: Memory },
          { id: "clients" as Tab, label: "Clients", icon: Users },
        ]
      : []),
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        const [routerRes, samplesRes, eventsRes] = await Promise.all([
          fetch("/api/routers"),
          fetch(`/api/samples?routerId=${routerId}&hours=1`),
          fetch(`/api/events?routerId=${routerId}&hours=168`),
        ])
        const routers = await routerRes.json()
        const samplesData = await samplesRes.json()
        const eventsData = await eventsRes.json()
        setRouterData(routers.find((r: Router) => r.id === Number(routerId)))
        setSamples(samplesData)
        setEvents(eventsData)
      } catch (e) {
        console.error("Failed to fetch:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    if (aggressiveMode.enabled) return
    const interval = setInterval(fetchData, pollingInterval)
    return () => clearInterval(interval)
  }, [routerId, aggressiveMode.enabled, pollingInterval])

  const latestSample = samples[0]

  const handleDelete = async () => {
    if (!confirm("Delete this router?")) return
    setDeleting(true)
    try {
      await fetch(`/api/routers?id=${routerId}`, { method: "DELETE" })
      router.push("/routers")
    } catch (e) {
      console.error("Failed to delete:", e)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (!routerData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Router not found</p>
        <Link href="/routers">
          <Button variant="outline">Back to Routers</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/routers">
          <Button variant="ghost" size="icon" aria-label="Back to routers">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold">{routerData.name}</h1>
          <p className="text-muted-foreground">
            {routerData.ip} •{" "}
            {routerData.type === "openwrt" ? "OpenWrt" : "Generic"}
          </p>
        </div>
        <div className="ml-auto">
          <StatusIndicator
            status={routerData.isOnline ? "online" : "offline"}
            label={routerData.isOnline ? "Online" : "Offline"}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
          >
            <tab.icon size={16} />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Ping</p>
                  <AnimatedValue
                    value={`${latestSample?.ping?.toFixed(1) || 0}ms`}
                    as="p"
                    className="text-3xl font-extrabold tracking-tight"
                  />
                  <p className="text-xs text-muted-foreground">
                    {latestSample?.ping ? "Response time" : "Waiting…"}
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
                  <p className="text-sm text-muted-foreground">Packet Loss</p>
                  <AnimatedValue
                    value={`${latestSample?.packetLoss?.toFixed(1) || 0}%`}
                    as="p"
                    className="text-3xl font-extrabold tracking-tight"
                  />
                  <p className="text-xs text-muted-foreground">
                    {latestSample?.packetLoss ? "Loss rate" : "Waiting…"}
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
                  <p className="text-sm text-muted-foreground">Jitter</p>
                  <AnimatedValue
                    value={`${latestSample?.jitter?.toFixed(1) || 0}ms`}
                    as="p"
                    className="text-3xl font-extrabold tracking-tight"
                  />
                  <p className="text-xs text-muted-foreground">
                    Connection stability
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
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusIndicator
                    status={routerData.isOnline ? "online" : "offline"}
                    label={routerData.isOnline ? "Online" : "Offline"}
                    size="lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {routerData.lastSeen
                      ? `Last seen: ${new Date(routerData.lastSeen).toLocaleString()}`
                      : "Never seen"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Globe size={20} />
                </div>
              </CardContent>
            </Card>
          </div>

          {routerData.type === "openwrt" && (
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <Gauge
                    value={latestSample?.cpuUsage || 0}
                    label="CPU"
                    size="lg"
                  />
                  <Gauge
                    value={latestSample?.memoryUsage || 0}
                    label="Memory"
                    size="lg"
                  />
                  <Gauge
                    value={latestSample?.flashUsage || 0}
                    label="Flash"
                    size="lg"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border-8 border-muted">
                      <span className="text-lg font-bold">
                        {latestSample?.temperature?.toFixed(1) || "N/A"}°C
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Temperature
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Latency History</CardTitle>
            </CardHeader>
            <CardContent>
              <LatencyChart samples={samples} height={250} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "traffic" && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth History</CardTitle>
            </CardHeader>
            <CardContent>
              <BandwidthChart samples={samples} height={400} />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-1 p-6">
                <p className="text-sm text-muted-foreground">Total Download</p>
                <p className="text-2xl font-bold tracking-tight">
                  {(
                    samples.reduce((acc, s) => acc + (s.download || 0), 0) /
                    1000000000
                  ).toFixed(2)}{" "}
                  GB
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 p-6">
                <p className="text-sm text-muted-foreground">Total Upload</p>
                <p className="text-2xl font-bold tracking-tight">
                  {(
                    samples.reduce((acc, s) => acc + (s.upload || 0), 0) /
                    1000000000
                  ).toFixed(2)}{" "}
                  GB
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 p-6">
                <p className="text-sm text-muted-foreground">Samples</p>
                <p className="text-2xl font-bold tracking-tight">
                  {samples.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "cpu" && (
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <CpuMemoryChart samples={samples} height={400} type="cpu" />
          </CardContent>
        </Card>
      )}

      {activeTab === "memory" && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <CpuMemoryChart samples={samples} height={400} type="memory" />
          </CardContent>
        </Card>
      )}

      {activeTab === "clients" && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {routerData.type === "openwrt" ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Client list requires SSH access to OpenWrt router.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Total Clients</p>
                    <p className="text-2xl font-bold">
                      {latestSample?.connectedClients || 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <Users size={48} className="mb-4 opacity-50" />
                <p>Client detection requires OpenWrt with SSH access.</p>
                <p className="mt-1 text-sm">
                  Generic routers only support ping-based monitoring.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "events" && (
        <Card>
          <CardHeader>
            <CardTitle>Router Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <Warning size={48} className="mb-4 opacity-50" />
                <p>No events recorded yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${
                        event.severity === "critical"
                          ? "bg-red-500"
                          : event.severity === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {event.type.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle>Router Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-muted-foreground">
                    {routerData.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">IP Address</span>
                  <span className="text-muted-foreground">{routerData.ip}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Type</span>
                  <span className="text-muted-foreground">
                    {routerData.type === "openwrt" ? "OpenWrt" : "Generic"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Polling Interval</span>
                  <span className="text-muted-foreground">
                    {routerData.pollingInterval}ms
                  </span>
                </div>
                {routerData.firmware && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Firmware</span>
                    <span className="text-muted-foreground">
                      {routerData.firmware}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Last Seen</span>
                  <span className="text-muted-foreground">
                    {routerData.lastSeen
                      ? new Date(routerData.lastSeen).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash size={16} />
                  {deleting ? "Deleting…" : "Delete Router"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

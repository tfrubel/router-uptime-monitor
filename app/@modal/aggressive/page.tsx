"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  X,
  Pause,
  CheckCircle,
  XCircle,
  Globe,
  HardDrives,
} from "@phosphor-icons/react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import { AnimatedValue } from "@/components/ui/animated-value"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface LiveStats {
  gateway: { success: boolean; latency: number }
  cloudflare: { success: boolean; latency: number }
  google: { success: boolean; latency: number }
  dns: { success: boolean; latency: number }
  website: { success: boolean; latency: number }
}

export default function AggressiveModal() {
  const router = useRouter()
  const { aggressiveCountdown, setAggressiveCountdown, toggleAggressiveMode } =
    useAppStore()
  const pollingInterval = usePollingInterval()
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [history, setHistory] = useState<
    Array<{
      time: string
      gateway: number
      cloudflare: number
      google: number
      dns: number
    }>
  >([])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics?aggressive=true")
      const data = await res.json()
      if (data.internet) {
        setStats(data.internet)
        const now = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        setHistory((prev) => {
          const next = [
            ...prev,
            {
              time: now,
              gateway: data.internet.gateway.latency || 0,
              cloudflare: data.internet.cloudflare.latency || 0,
              google: data.internet.google.latency || 0,
              dns: data.internet.dns.latency || 0,
            },
          ]
          return next.slice(-30)
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, pollingInterval)
    return () => clearInterval(interval)
  }, [fetchStats, pollingInterval])

  useEffect(() => {
    if (aggressiveCountdown !== null && aggressiveCountdown > 0) {
      const timer = setInterval(
        () => setAggressiveCountdown(aggressiveCountdown - 1),
        1000
      )
      return () => clearInterval(timer)
    } else if (aggressiveCountdown === 0) {
      toggleAggressiveMode()
      router.back()
    }
  }, [
    aggressiveCountdown,
    setAggressiveCountdown,
    toggleAggressiveMode,
    router,
  ])

  const handleClose = () => {
    toggleAggressiveMode()
    router.back()
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  const chartConfig = {
    gateway: { label: "Gateway", color: "#22c55e" },
    cloudflare: { label: "Cloudflare", color: "#f97316" },
    google: { label: "Google DNS", color: "#3b82f6" },
    dns: { label: "Quad9", color: "#a855f7" },
  } satisfies ChartConfig

  const targets = [
    {
      label: "Gateway",
      key: "gateway" as const,
      icon: HardDrives,
      color: "text-green-500",
    },
    {
      label: "Cloudflare",
      key: "cloudflare" as const,
      icon: Globe,
      color: "text-orange-500",
    },
    {
      label: "Google DNS",
      key: "google" as const,
      icon: Globe,
      color: "text-blue-500",
    },
    {
      label: "Quad9",
      key: "dns" as const,
      icon: Globe,
      color: "text-purple-500",
    },
    {
      label: "Website",
      key: "website" as const,
      icon: Globe,
      color: "text-pink-500",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Pause size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Aggressive Mode</h2>
              <p className="text-sm text-muted-foreground">
                Live monitoring — not saved to database
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-amber-500/10 px-4 py-2 font-mono text-xl font-bold text-amber-500">
              {aggressiveCountdown !== null
                ? formatTime(aggressiveCountdown)
                : "2:00"}
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-5 gap-3">
          {targets.map(({ label, key, icon: Icon, color }) => (
            <Card key={key} size="sm">
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <Icon
                  size={16}
                  className={stats?.[key]?.success ? color : "text-red-500"}
                />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className={`font-mono text-sm font-bold ${stats?.[key]?.success ? color : "text-red-500"}`}
                >
                  {stats?.[key]?.latency ? (
                    <AnimatedValue
                      value={`${stats[key].latency.toFixed(1)}ms`}
                    />
                  ) : (
                    "—"
                  )}
                </p>
                {stats?.[key]?.success ? (
                  <CheckCircle size={12} className="text-green-500" />
                ) : (
                  <XCircle size={12} className="text-red-500" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Live Ping History</p>
              <p className="text-xs text-muted-foreground">
                {history.length} samples
              </p>
            </div>
            {history.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Collecting data...
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <LineChart
                  data={history}
                  margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tick={{ fontSize: 10 }}
                    width={40}
                    tickFormatter={(v: number) => `${v}ms`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(value, name) => [
                          `${Number(value).toFixed(1)}ms`,
                          chartConfig[String(name) as keyof typeof chartConfig]
                            ?.label ?? String(name),
                        ]}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="gateway"
                    stroke="var(--color-gateway)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cloudflare"
                    stroke="var(--color-cloudflare)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="google"
                    stroke="var(--color-google)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="dns"
                    stroke="var(--color-dns)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

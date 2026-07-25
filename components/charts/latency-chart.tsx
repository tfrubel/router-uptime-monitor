"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Sample } from "@/lib/db/schema"

interface LatencyChartProps {
  samples: Sample[]
  height?: number
  showInternet?: boolean
}

const DURATIONS = [
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 360, label: "6h" },
  { value: 1440, label: "24h" },
  { value: 0, label: "All" },
] as const

const chartConfig = {
  Gateway: {
    label: "Gateway",
    color: "#22c55e",
  },
  Cloudflare: {
    label: "Cloudflare",
    color: "#f97316",
  },
  Google: {
    label: "Google",
    color: "#3b82f6",
  },
  DNS: {
    label: "DNS",
    color: "#a855f7",
  },
  Website: {
    label: "Website",
    color: "#ec4899",
  },
} satisfies ChartConfig

export function LatencyChart({
  samples,
  height = 300,
  showInternet = true,
}: LatencyChartProps) {
  const [duration, setDuration] = useState(30)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const durationMs = duration * 60 * 1000
  const filtered =
    duration === 0
      ? samples
      : samples.filter(
          (s) => now - new Date(s.timestamp).getTime() <= durationMs
        )

  const data = filtered
    .slice()
    .reverse()
    .map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      Gateway: s.gatewayPing || null,
      Cloudflare: s.cloudflarePing || null,
      Google: s.googlePing || null,
      DNS: s.dnsPing || null,
      Website: s.websitePing || null,
    }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border">
          {DURATIONS.map((d) => (
            <Button
              key={d.value}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none first:rounded-l-md last:rounded-r-md",
                duration === d.value && "bg-muted"
              )}
              onClick={() => setDuration(d.value)}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full"
        style={{ height }}
      >
        <LineChart data={data} accessibilityLayer>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {showInternet && (
            <>
              <Line
                type="monotone"
                dataKey="Gateway"
                stroke="var(--color-Gateway)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="Cloudflare"
                stroke="var(--color-Cloudflare)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="Google"
                stroke="var(--color-Google)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="DNS"
                stroke="var(--color-DNS)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="Website"
                stroke="var(--color-Website)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </>
          )}
        </LineChart>
      </ChartContainer>
    </div>
  )
}

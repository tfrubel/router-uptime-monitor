"use client"

import { Area, AreaChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Sample } from "@/lib/db/schema"

interface CpuMemoryChartProps {
  samples: Sample[]
  height?: number
  type: "cpu" | "memory"
}

export function CpuMemoryChart({
  samples,
  height = 300,
  type,
}: CpuMemoryChartProps) {
  const chartConfig = {
    value: {
      label: type === "cpu" ? "CPU" : "Memory",
      color: type === "cpu" ? "#a855f7" : "#22c55e",
    },
  } satisfies ChartConfig

  const data = samples
    .slice()
    .reverse()
    .map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value:
        type === "cpu"
          ? Number(s.cpuUsage?.toFixed(1)) || 0
          : Number(s.memoryUsage?.toFixed(1)) || 0,
    }))

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <AreaChart data={data} accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ChartContainer>
  )
}

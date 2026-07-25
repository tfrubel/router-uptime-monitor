"use client"

import { Area, AreaChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Sample } from "@/lib/db/schema"

interface BandwidthChartProps {
  samples: Sample[]
  height?: number
}

const chartConfig = {
  download: {
    label: "Download",
    color: "#22c55e",
  },
  upload: {
    label: "Upload",
    color: "#3b82f6",
  },
} satisfies ChartConfig

export function BandwidthChart({ samples, height = 300 }: BandwidthChartProps) {
  const data = samples
    .slice()
    .reverse()
    .map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      download: s.download ? Number((s.download / 1000000).toFixed(2)) : 0,
      upload: s.upload ? Number((s.upload / 1000000).toFixed(2)) : 0,
    }))

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <AreaChart data={data} accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="download"
          stroke="var(--color-download)"
          fill="var(--color-download)"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="upload"
          stroke="var(--color-upload)"
          fill="var(--color-upload)"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ChartContainer>
  )
}

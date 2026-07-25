"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface GaugeProps {
  value: number
  max?: number
  label: string
  unit?: string
  size?: "sm" | "md" | "lg"
}

export function Gauge({
  value,
  max = 100,
  label,
  unit = "%",
  size = "md",
}: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const getColor = () => {
    if (percentage < 50) return "text-green-500"
    if (percentage < 75) return "text-amber-500"
    return "text-red-500"
  }

  const sizes = {
    sm: { svg: 60, stroke: 6, text: "text-xs" },
    md: { svg: 80, stroke: 8, text: "text-sm" },
    lg: { svg: 100, stroke: 10, text: "text-base" },
  }

  const s = sizes[size]
  const circumference = 2 * Math.PI * (s.svg / 2 - s.stroke)
  const dashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.svg, height: s.svg }}>
        <svg
          className="-rotate-90"
          width={s.svg}
          height={s.svg}
          viewBox={`0 0 ${s.svg} ${s.svg}`}
        >
          <circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.svg / 2 - s.stroke}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-muted"
          />
          <motion.circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.svg / 2 - s.stroke}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            className={getColor()}
            initial={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference,
            }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", s.text, getColor())}>
            {Math.round(value)}
            {unit}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

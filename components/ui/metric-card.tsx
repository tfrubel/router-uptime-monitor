"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number | ReactNode
  subtitle?: string
  icon?: ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  children?: ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
  children,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <motion.div
              key={String(value)}
              initial={{ opacity: 0.5, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight"
            >
              {value}
            </motion.div>
            {trendValue && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}{" "}
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}

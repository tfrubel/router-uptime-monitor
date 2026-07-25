"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning"
  label?: string
  size?: "sm" | "md" | "lg"
}

export function StatusIndicator({
  status,
  label,
  size = "md",
}: StatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "rounded-full",
          size === "sm" && "h-2 w-2",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4",
          status === "online" && "bg-green-500",
          status === "offline" && "bg-red-500",
          status === "warning" && "bg-amber-500"
        )}
      />
      {label && (
        <span
          className={cn(
            "font-medium",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            status === "online" && "text-green-500",
            status === "offline" && "text-red-500",
            status === "warning" && "text-amber-500"
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}

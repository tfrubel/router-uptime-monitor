"use client"

import { cn } from "@/lib/utils"

interface TimelineSlot {
  hour: number
  status: "healthy" | "slow" | "offline" | "unknown"
}

interface NetworkTimelineProps {
  slots: TimelineSlot[]
}

export function NetworkTimeline({ slots }: NetworkTimelineProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>00:00</span>
        <div className="flex-1" />
        <span>24:00</span>
      </div>
      <div className="flex gap-0.5">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={cn(
              "h-8 flex-1 rounded-sm transition-colors",
              slot.status === "healthy" && "bg-green-500",
              slot.status === "slow" && "bg-amber-500",
              slot.status === "offline" && "bg-red-500",
              slot.status === "unknown" && "bg-muted"
            )}
            title={`${slot.hour}:00 - ${slot.status}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          Healthy
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          Slow
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          Offline
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import {
  Warning,
  Info,
  WarningCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import { cn } from "@/lib/utils"
import type { Event } from "@/lib/db/schema"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">(
    "all"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const { aggressiveMode } = useAppStore()
  const pollingInterval = usePollingInterval()

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events?hours=168")
        const data = await res.json()
        setEvents(data)
      } catch (e) {
        console.error("Failed to fetch events:", e)
      }
    }
    fetchEvents()
    if (aggressiveMode.enabled) return
    const interval = setInterval(fetchEvents, pollingInterval)
    return () => clearInterval(interval)
  }, [aggressiveMode.enabled, pollingInterval])

  const filteredEvents = events
    .filter((event) => filter === "all" || event.severity === filter)
    .filter((event) =>
      event.message.toLowerCase().includes(searchQuery.toLowerCase())
    )

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case "critical":
        return <WarningCircle size={20} className="text-red-500" />
      case "warning":
        return <Warning size={20} className="text-amber-500" />
      default:
        return <Info size={20} className="text-blue-500" />
    }
  }

  function formatTime(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Events</h1>
        <Badge variant="secondary">{events.length} events in last 7 days</Badge>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search events"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "critical", "warning", "info"] as const).map((severity) => (
            <Button
              key={severity}
              variant={filter === severity ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(severity)}
              className={cn(
                filter === severity &&
                  severity === "critical" &&
                  "bg-red-500 hover:bg-red-600",
                filter === severity &&
                  severity === "warning" &&
                  "bg-amber-500 hover:bg-amber-600",
                filter === severity &&
                  severity === "info" &&
                  "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Info size={48} className="mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card
              key={event.id}
              className={cn(
                "transition-colors hover:bg-muted/50",
                event.severity === "critical" &&
                  "border-red-500/50 bg-red-500/5",
                event.severity === "warning" &&
                  "border-amber-500/50 bg-amber-500/5"
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="mt-0.5">{getSeverityIcon(event.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {event.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-1">{event.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Plus,
  MagnifyingGlass,
  ArrowsDownUp,
  Star,
  ArrowRight,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { RouterCardSkeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import { cn } from "@/lib/utils"
import type { Router } from "@/lib/db/schema"

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "status" | "favorite">(
    "favorite"
  )
  const [loading, setLoading] = useState(true)
  const { aggressiveMode } = useAppStore()
  const pollingInterval = usePollingInterval()

  useEffect(() => {
    async function fetchRouters() {
      try {
        const res = await fetch("/api/routers")
        const data = await res.json()
        setRouters(data)
      } catch (e) {
        console.error("Failed to fetch routers:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchRouters()
    if (aggressiveMode.enabled) return

    async function pollMetrics() {
      try {
        await fetch("/api/metrics")
        const res = await fetch("/api/routers")
        const data = await res.json()
        setRouters(data)
      } catch {}
    }
    const interval = setInterval(pollMetrics, pollingInterval)
    return () => clearInterval(interval)
  }, [aggressiveMode.enabled, pollingInterval])

  const toggleFavorite = async (id: number, current: boolean) => {
    try {
      await fetch("/api/routers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, favorite: !current }),
      })
      setRouters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, favorite: !current } : r))
      )
    } catch (e) {
      console.error("Failed to toggle favorite:", e)
    }
  }

  const filteredRouters = routers
    .filter(
      (router) =>
        router.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        router.ip.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === "favorite")
        return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0)
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Routers</h1>
        <Link href="/routers/add">
          <Button>
            <Plus size={16} className="mr-2" />
            Add Router
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search routers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search routers"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortBy(
                sortBy === "favorite"
                  ? "name"
                  : sortBy === "name"
                    ? "status"
                    : "favorite"
              )
            }
          >
            <ArrowsDownUp size={16} className="mr-2" />
            Sort:{" "}
            {sortBy === "favorite"
              ? "Favorites"
              : sortBy === "name"
                ? "Name"
                : "Status"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RouterCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRouters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="mb-4 text-muted-foreground">No routers found</p>
            <Link href="/routers/add">
              <Button>
                <Plus size={16} className="mr-2" />
                Add Router
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRouters.map((router) => (
            <Card
              key={router.id}
              className="group relative transition-all hover:shadow-md"
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggleFavorite(router.id, !!router.favorite)
                }}
                className="absolute top-4 right-4"
                aria-label={
                  router.favorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Star
                  size={16}
                  className={cn(
                    "transition-colors",
                    router.favorite
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                />
              </button>

              <Link href={`/routers/${router.id}`} className="block">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-3">
                      <span className="text-sm font-bold uppercase">
                        {router.type === "openwrt" ? "OW" : "GR"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{router.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {router.ip}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <StatusIndicator
                      status={router.isOnline ? "online" : "offline"}
                      label={router.isOnline ? "Online" : "Offline"}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      {router.lastSeen
                        ? `Last seen: ${new Date(router.lastSeen).toLocaleString()}`
                        : "Never seen"}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

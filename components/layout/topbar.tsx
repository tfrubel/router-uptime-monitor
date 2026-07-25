"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { usePollingInterval } from "@/hooks/use-polling-interval"
import { cn } from "@/lib/utils"
import { MagnifyingGlass, Lightning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Router } from "@/lib/db/schema"

export function Topbar() {
  const router = useRouter()
  const {
    selectedRouterId,
    setSelectedRouter,
    aggressiveMode,
    toggleAggressiveMode,
    searchQuery,
    setSearchQuery,
  } = useAppStore()

  const [routers, setRouters] = useState<Router[]>([])
  const pollingInterval = usePollingInterval()

  useEffect(() => {
    async function fetchRouters() {
      try {
        const res = await fetch("/api/routers")
        const data = await res.json()
        setRouters(data)
      } catch (e) {
        console.error("Failed to fetch routers:", e)
      }
    }
    fetchRouters()
    if (aggressiveMode.enabled) return
    const interval = setInterval(fetchRouters, pollingInterval)
    return () => clearInterval(interval)
  }, [aggressiveMode.enabled, pollingInterval])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedRouterId ?? ""}
          onChange={(e) =>
            setSelectedRouter(e.target.value ? Number(e.target.value) : null)
          }
          className="h-9 rounded-lg border bg-background px-3 text-sm"
          aria-label="Select router"
        >
          <option value="">All Routers</option>
          {routers.map((router) => (
            <option key={router.id} value={router.id}>
              {router.name} ({router.isOnline ? "Online" : "Offline"})
            </option>
          ))}
        </select>

        <Button
          variant={aggressiveMode.enabled ? "default" : "outline"}
          size="sm"
          onClick={() => {
            toggleAggressiveMode()
            if (!aggressiveMode.enabled) {
              router.push("/aggressive")
            }
          }}
          className={cn(
            "gap-2",
            aggressiveMode.enabled && "bg-amber-500 hover:bg-amber-600"
          )}
        >
          <Lightning size={16} />
          <span className="hidden sm:inline">Aggressive</span>
        </Button>
      </div>
    </header>
  )
}

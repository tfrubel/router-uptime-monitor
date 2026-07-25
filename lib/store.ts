import { create } from "zustand"
import type { Router, Sample, Event } from "./db/schema"
import type { AggressiveModeConfig, RouterMetrics } from "./types"

interface AppState {
  routers: Router[]
  selectedRouterId: number | null
  metrics: RouterMetrics | null
  samples: Sample[]
  events: Event[]
  aggressiveMode: AggressiveModeConfig
  aggressiveCountdown: number | null
  sidebarOpen: boolean
  searchQuery: string

  setRouters: (routers: Router[]) => void
  setSelectedRouter: (id: number | null) => void
  setMetrics: (metrics: RouterMetrics | null) => void
  addSample: (sample: Sample) => void
  setSamples: (samples: Sample[]) => void
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  toggleAggressiveMode: () => void
  setAggressiveCountdown: (seconds: number | null) => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  routers: [],
  selectedRouterId: null,
  metrics: null,
  samples: [],
  events: [],
  aggressiveMode: {
    enabled: false,
    metricsInterval: 5000,
    chartsInterval: 2000,
    pingInterval: 5000,
  },
  aggressiveCountdown: null,
  sidebarOpen: true,
  searchQuery: "",

  setRouters: (routers) => set({ routers }),
  setSelectedRouter: (id) => set({ selectedRouterId: id }),
  setMetrics: (metrics) => set({ metrics }),
  addSample: (sample) =>
    set((state) => ({
      samples: [...state.samples.slice(-99), sample],
    })),
  setSamples: (samples) => set({ samples }),
  setEvents: (events) => set({ events }),
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-99), event],
    })),
  toggleAggressiveMode: () =>
    set((state) => ({
      aggressiveMode: state.aggressiveMode.enabled
        ? {
            enabled: false,
            metricsInterval: 5000,
            chartsInterval: 2000,
            pingInterval: 5000,
          }
        : {
            enabled: true,
            metricsInterval: 500,
            chartsInterval: 500,
            pingInterval: 500,
          },
      aggressiveCountdown: state.aggressiveMode.enabled ? null : 120,
    })),
  setAggressiveCountdown: (seconds) => set({ aggressiveCountdown: seconds }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

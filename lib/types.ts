export interface RouterMetrics {
  routerId: number
  timestamp: Date
  download: number
  upload: number
  ping: number
  packetLoss: number
  jitter: number
  cpuUsage?: number
  memoryUsage?: number
  flashUsage?: number
  connectedClients?: number
  temperature?: number
}

export interface InternetCheckResult {
  router: boolean
  gateway: boolean
  ispDns: boolean
  cloudflare: boolean
  googleDns: boolean
  publicWebsite: boolean
  latency: number
}

export interface NetworkScore {
  score: number
  label: "Excellent" | "Good" | "Warning" | "Critical"
  factors: {
    latency: number
    packetLoss: number
    uptime: number
  }
}

export interface BandwidthData {
  timestamp: Date
  download: number
  upload: number
}

export interface LatencyData {
  timestamp: Date
  gateway: number
  cloudflare: number
  googleDns: number
}

export type AggressiveModeConfig = {
  enabled: boolean
  metricsInterval: number
  chartsInterval: number
  pingInterval: number
}

export const DEFAULT_AGGRESSIVE_CONFIG: AggressiveModeConfig = {
  enabled: false,
  metricsInterval: 5000,
  chartsInterval: 2000,
  pingInterval: 5000,
}

export const AGGRESSIVE_CONFIG: AggressiveModeConfig = {
  enabled: true,
  metricsInterval: 500,
  chartsInterval: 500,
  pingInterval: 500,
}

import type { RouterMetrics } from "../types"

interface SSHConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSHClient = any

export class OpenWrtClient {
  private config: SSHConfig
  private conn: SSHClient | null = null

  constructor(config: SSHConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    const ssh2 = await import("ssh2")
    const Client = ssh2.Client
    return new Promise((resolve, reject) => {
      this.conn = new Client()
      this.conn
        .on("ready", () => resolve())
        .on("error", (err: Error) => reject(err))
        .connect({
          host: this.config.host,
          port: this.config.port,
          username: this.config.username,
          password: this.config.password,
          privateKey: this.config.privateKey,
          readyTimeout: 10000,
        })
    })
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      this.conn.end()
      this.conn = null
    }
  }

  async executeCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error("Not connected")

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.conn!.exec(command, (err: Error | null, stream: any) => {
        if (err) return reject(err)

        let output = ""
        stream
          .on("close", () => resolve(output))
          .on("data", (data: Buffer) => {
            output += data.toString()
          })
          .stderr.on("data", (data: Buffer) => {
            output += data.toString()
          })
      })
    })
  }

  async getMetrics(): Promise<RouterMetrics> {
    const [cpu, memory, flash, clients, temp, lanTraffic] =
      await Promise.all([
        this.executeCommand("top -bn1 | grep 'CPU:'"),
        this.executeCommand("free | grep 'Mem:'"),
        this.executeCommand("df -h / | tail -1"),
        this.executeCommand("cat /tmp/dhcp.leases | wc -l"),
        this.executeCommand(
          "cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null || echo 0"
        ),
        this.executeCommand(
          "cat /proc/net/dev | grep br-lan || cat /proc/net/dev | tail -n +3 | head -3"
        ),
      ])

    return {
      routerId: 0,
      timestamp: new Date(),
      download: this.parseBytes(lanTraffic).rx,
      upload: this.parseBytes(lanTraffic).tx,
      ping: 0,
      packetLoss: 0,
      jitter: 0,
      cpuUsage: this.parseCpuUsage(cpu),
      memoryUsage: this.parseMemoryUsage(memory),
      flashUsage: this.parseFlashUsage(flash),
      connectedClients: parseInt(clients) || 0,
      temperature: this.parseTemperature(temp),
    }
  }

  private parseBytes(output: string): { rx: number; tx: number } {
    const match = output.match(/(\d+)\s+(\d+)/)
    return match
      ? { rx: parseInt(match[1]), tx: parseInt(match[2]) }
      : { rx: 0, tx: 0 }
  }

  private parseCpuUsage(output: string): number {
    const match = output.match(/(\d+\.?\d*)\s*%\s*idle/)
    if (match) {
      return 100 - parseFloat(match[1])
    }
    return 0
  }

  private parseMemoryUsage(output: string): number {
    const parts = output.split(/\s+/)
    if (parts.length >= 3) {
      const total = parseInt(parts[1])
      const available = parseInt(parts[6]) || parseInt(parts[3])
      return total > 0 ? ((total - available) / total) * 100 : 0
    }
    return 0
  }

  private parseFlashUsage(output: string): number {
    const parts = output.split(/\s+/)
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].endsWith("%")) {
        return parseFloat(parts[i])
      }
    }
    if (parts.length >= 4) {
      const total = this.parseHumanSize(parts[1])
      const used = this.parseHumanSize(parts[2])
      return total > 0 ? (used / total) * 100 : 0
    }
    return 0
  }

  private parseHumanSize(value: string): number {
    const match = value.match(/^([\d.]+)\s*([KMGT])?[IB]?$/i)
    if (!match) return parseFloat(value) || 0
    const num = parseFloat(match[1])
    const suffix = (match[2] || "").toUpperCase()
    const multipliers: Record<string, number> = {
      "": 1,
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
      T: 1024 * 1024 * 1024 * 1024,
    }
    return num * (multipliers[suffix] || 1)
  }

  private parseTemperature(output: string): number {
    const temp = parseInt(output.trim().split("\n")[0])
    return temp > 1000 ? temp / 1000 : temp
  }
}

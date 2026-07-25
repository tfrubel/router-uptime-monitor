import { spawn } from "child_process"

function pingRaw(
  host: string,
  count: number,
  timeout: number
): Promise<{
  success: boolean
  latency: number
  packetLoss: number
  jitter: number
}> {
  return new Promise((resolve) => {
    const platform = process.platform
    const args =
      platform === "win32"
        ? ["-n", String(count), "-w", String(timeout * 1000), host]
        : platform === "darwin"
          ? ["-c", String(count), "-W", String(timeout * 1000), host]
          : ["-c", String(count), "-W", String(timeout), host]

    let stdout = ""
    let stderr = ""
    let resolved = false
    const proc = spawn("ping", args)

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString()
    })
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString()
    })

    const finish = () => {
      if (resolved) return
      resolved = true
      const output = stdout + stderr
      const latencies: number[] = []
      const regex = /time=(\d+\.?\d*)\s*ms/gi
      let m
      while ((m = regex.exec(output)) !== null) latencies.push(parseFloat(m[1]))

      const avg =
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0
      const jitter =
        latencies.length > 1
          ? latencies
              .slice(1)
              .reduce((a, v, i) => a + Math.abs(v - latencies[i]), 0) /
            (latencies.length - 1)
          : 0
      const lossMatch = /(\d+\.?\d*)%\s*(?:packet\s+)?loss/i.exec(output)
      const packetLoss = lossMatch
        ? parseFloat(lossMatch[1])
        : latencies.length === 0
          ? 100
          : 0

      resolve({
        success: latencies.length > 0,
        latency: Math.round(avg * 100) / 100,
        packetLoss,
        jitter: Math.round(jitter * 100) / 100,
      })
    }

    proc.on("close", finish)
    proc.on("error", () => {
      if (!resolved)
        resolve({ success: false, latency: 0, packetLoss: 100, jitter: 0 })
      resolved = true
    })

    setTimeout(
      () => {
        proc.kill()
        finish()
      },
      (timeout + 2) * 1000
    )
  })
}

export async function pingHost(host: string, count = 5, timeout = 5) {
  return pingRaw(host, count, timeout)
}

export interface ConnectivityOptions {
  checkGateway?: boolean
  cloudflareHost?: string
  checkCloudflare?: boolean
  googleHost?: string
  checkGoogle?: boolean
  dnsHost?: string
  checkDns?: boolean
  websiteHost?: string
  checkWebsite?: boolean
}

export async function pingInternet(
  quick = false,
  gatewayIp?: string,
  options?: ConnectivityOptions
) {
  const count = quick ? 1 : 3
  const timeout = quick ? 2 : 3

  const opts = {
    checkGateway: true,
    cloudflareHost: "1.1.1.1",
    checkCloudflare: true,
    googleHost: "8.8.8.8",
    checkGoogle: true,
    dnsHost: "9.9.9.9",
    checkDns: true,
    websiteHost: "google.com",
    checkWebsite: true,
    ...options,
  }

  const targets = [
    ...(opts.checkGateway && gatewayIp
      ? [{ key: "gateway", host: gatewayIp }]
      : []),
    ...(opts.checkCloudflare
      ? [{ key: "cloudflare", host: opts.cloudflareHost }]
      : []),
    ...(opts.checkGoogle ? [{ key: "google", host: opts.googleHost }] : []),
    ...(opts.checkDns ? [{ key: "dns", host: opts.dnsHost }] : []),
    ...(!quick && opts.checkWebsite
      ? [{ key: "website", host: opts.websiteHost }]
      : []),
  ]

  const results = await Promise.all(
    targets.map(async (t) => ({
      key: t.key,
      ...(await pingRaw(t.host, count, timeout)),
    }))
  )

  const map = Object.fromEntries(
    results.map((r) => [r.key, { success: r.success, latency: r.latency }])
  )
  return {
    gateway: opts.checkGateway
      ? map["gateway"] || { success: false, latency: 0 }
      : { success: false, latency: 0, disabled: true },
    cloudflare: opts.checkCloudflare
      ? map["cloudflare"] || { success: false, latency: 0 }
      : { success: false, latency: 0, disabled: true },
    google: opts.checkGoogle
      ? map["google"] || { success: false, latency: 0 }
      : { success: false, latency: 0, disabled: true },
    dns: opts.checkDns
      ? map["dns"] || { success: false, latency: 0 }
      : { success: false, latency: 0, disabled: true },
    website: opts.checkWebsite
      ? map["website"] || { success: false, latency: 0 }
      : { success: false, latency: 0, disabled: true },
  }
}

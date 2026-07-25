"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleNotch,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type RouterType = "openwrt" | "generic"
type Step = 1 | 2 | 3

export default function AddRouterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [routerType, setRouterType] = useState<RouterType>("generic")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    latency?: number
  } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    sshPort: 22,
    username: "",
    password: "",
    vendor: "",
    loginUrl: "",
    pollingInterval: 5000,
  })

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: formData.ip, type: routerType }),
      })
      const data = await res.json()
      setTestResult({
        success: data.reachable,
        latency: data.latency,
      })
      if (data.reachable) {
        setStep(3)
      }
    } catch (e) {
      setTestResult({ success: false })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      await fetch("/api/routers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: routerType,
        }),
      })
      router.push("/routers")
    } catch (e) {
      console.error("Failed to save:", e)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="font-heading text-3xl font-bold">Add Router</h1>
      </div>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-0.5 w-12",
                  step > s ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Choose Router Type</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setRouterType("openwrt")}
              className={cn(
                "rounded-lg border-2 p-6 text-left transition-all",
                routerType === "openwrt"
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <h3 className="font-semibold">OpenWrt</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Full SSH access for detailed metrics, client lists, and system
                management
              </p>
            </button>
            <button
              onClick={() => setRouterType("generic")}
              className={cn(
                "rounded-lg border-2 p-6 text-left transition-all",
                routerType === "generic"
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <h3 className="font-semibold">Generic Router</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ping-based monitoring for any router or network device
              </p>
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)}>
              Next <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {routerType === "openwrt" ? "OpenWrt" : "Generic"} Router Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Router"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">IP Address</label>
              <Input
                value={formData.ip}
                onChange={(e) =>
                  setFormData({ ...formData, ip: e.target.value })
                }
                placeholder="192.168.68.1"
                className="mt-1"
              />
            </div>
            {routerType === "openwrt" && (
              <>
                <div>
                  <label className="text-sm font-medium">SSH Port</label>
                  <Input
                    type="number"
                    value={formData.sshPort}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sshPort: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="root"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </>
            )}
            {routerType === "generic" && (
              <>
                <div>
                  <label className="text-sm font-medium">
                    Vendor (Optional)
                  </label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    placeholder="TP-Link, ASUS, etc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Login URL (Optional)
                  </label>
                  <Input
                    value={formData.loginUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, loginUrl: e.target.value })
                    }
                    placeholder="http://192.168.68.1"
                    className="mt-1"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">
                Polling Interval (ms)
              </label>
              <Input
                type="number"
                value={formData.pollingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pollingInterval: Number(e.target.value),
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          {testResult && (
            <div
              className={cn(
                "mt-4 rounded-lg p-3 text-sm",
                testResult.success
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {testResult.success
                ? `Connection successful! Latency: ${testResult.latency}ms`
                : "Connection failed. Check IP and try again."}
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!formData.ip || testing}
              >
                {testing ? (
                  <CircleNotch size={16} className="mr-2 animate-spin" />
                ) : null}
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Confirm & Save</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{formData.name || "Unnamed"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{routerType === "openwrt" ? "OpenWrt" : "Generic"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP</span>
              <span>{formData.ip}</span>
            </div>
            {routerType === "openwrt" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span>{formData.username}</span>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>
            <Button onClick={handleSave}>
              <Check size={16} className="mr-2" /> Save Router
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

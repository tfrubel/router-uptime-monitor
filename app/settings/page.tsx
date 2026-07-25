"use client"

import { useEffect, useRef, useState } from "react"
import {
  Gear,
  Palette,
  Database,
  Bell,
  Timer,
  Trash,
  Download,
  Upload,
  Globe,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [dbStats, setDbStats] = useState({ samples: 0, events: 0 })
  const [cleaning, setCleaning] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()
        setSettings(data)
      } catch (e) {
        console.error("Failed to fetch settings:", e)
      }
    }
    fetchSettings()

    async function fetchDbStats() {
      try {
        const res = await fetch("/api/cleanup")
        const data = await res.json()
        setDbStats(data)
      } catch (e) {
        console.error("Failed to fetch stats:", e)
      }
    }
    fetchDbStats()
  }, [])

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
    } catch (e) {
      console.error("Failed to save:", e)
    } finally {
      setSaving(false)
    }
  }

  const handleCleanup = async () => {
    setCleaning(true)
    try {
      const retentionDays = parseInt(settings.historyRetention || "30")
      const res = await fetch("/api/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays }),
      })
      const result = await res.json()
      alert(
        `Cleaned up ${result.samplesDeleted} samples and ${result.eventsDeleted} events`
      )

      const statsRes = await fetch("/api/cleanup")
      const stats = await statsRes.json()
      setDbStats(stats)
    } catch (e) {
      console.error("Failed to cleanup:", e)
    } finally {
      setCleaning(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export")
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `router-monitor-backup-${
        new Date().toISOString().split("T")[0]
      }.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Failed to export:", e)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      alert("Import successful!")
      window.location.reload()
    } catch (e) {
      console.error("Failed to import:", e)
      alert("Failed to import data")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Gear size={16} />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette size={16} />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <Database size={16} />
            Storage
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="polling" className="gap-2">
            <Timer size={16} />
            Polling
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="gap-2">
            <Globe size={16} />
            Connectivity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure default behavior and appearance preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="defaultView">Default View</FieldLabel>
                <select
                  id="defaultView"
                  value={settings.defaultView || "dashboard"}
                  onChange={(e) => updateSetting("defaultView", e.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="routers">Routers</option>
                </select>
              </Field>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="compactMode">Compact Mode</FieldLabel>
                  <FieldDescription>
                    Reduce padding and spacing throughout the app
                  </FieldDescription>
                </div>
                <Switch
                  id="compactMode"
                  checked={settings.compactMode === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("compactMode", String(checked))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="animations">Animations</FieldLabel>
                  <FieldDescription>
                    Enable smooth transitions and micro-animations
                  </FieldDescription>
                </div>
                <Switch
                  id="animations"
                  checked={settings.animations !== "false"}
                  onCheckedChange={(checked) =>
                    updateSetting("animations", String(checked))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Theme</FieldLabel>
                <div className="flex gap-2">
                  {["light", "dark", "system"].map((theme) => (
                    <Button
                      key={theme}
                      variant={settings.theme === theme ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("theme", theme)}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Button>
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel>Accent Color</FieldLabel>
                <div className="flex gap-3">
                  {[
                    { name: "blue", color: "bg-blue-500" },
                    { name: "purple", color: "bg-purple-500" },
                    { name: "green", color: "bg-green-500" },
                    { name: "orange", color: "bg-orange-500" },
                    { name: "red", color: "bg-red-500" },
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      aria-label={`${name} accent color`}
                      onClick={() => updateSetting("accentColor", name)}
                      className={`h-8 w-8 rounded-full transition-all ${color} ${
                        settings.accentColor === name
                          ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel>Sidebar Style</FieldLabel>
                <div className="flex gap-2">
                  {["default", "compact", "minimal"].map((style) => (
                    <Button
                      key={style}
                      variant={
                        settings.sidebarStyle === style ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateSetting("sidebarStyle", style)}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Button>
                  ))}
                </div>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>
                Manage your data, backups, and retention policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-lg border p-4">
                  <span className="text-sm text-muted-foreground">Samples</span>
                  <span className="font-[--font-mono] text-2xl font-bold">
                    {dbStats.samples}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border p-4">
                  <span className="text-sm text-muted-foreground">Events</span>
                  <span className="font-[--font-mono] text-2xl font-bold">
                    {dbStats.events}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="gap-2"
                >
                  <Trash size={16} />
                  {cleaning ? "Cleaning…" : "Cleanup Old Data"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download size={16} />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="gap-2"
                >
                  <Upload size={16} />
                  {importing ? "Importing…" : "Import Data"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Import JSON data file"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure alert delivery via webhooks and browser notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="desktopNotifications">
                    Desktop Notifications
                  </FieldLabel>
                  <FieldDescription>
                    Show browser notifications for alerts
                  </FieldDescription>
                </div>
                <Switch
                  id="desktopNotifications"
                  checked={settings.desktopNotifications === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("desktopNotifications", String(checked))
                  }
                />
              </div>

              <Field>
                <FieldLabel htmlFor="discordWebhook">
                  Discord Webhook
                </FieldLabel>
                <Input
                  id="discordWebhook"
                  value={settings.discordWebhook || ""}
                  onChange={(e) =>
                    updateSetting("discordWebhook", e.target.value)
                  }
                  placeholder="https://discord.com/api/webhooks/…"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="telegramBotToken">
                  Telegram Bot Token
                </FieldLabel>
                <Input
                  id="telegramBotToken"
                  value={settings.telegramBotToken || ""}
                  onChange={(e) =>
                    updateSetting("telegramBotToken", e.target.value)
                  }
                  placeholder="123456:ABC-DEF…"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="telegramChatId">
                  Telegram Chat ID
                </FieldLabel>
                <Input
                  id="telegramChatId"
                  value={settings.telegramChatId || ""}
                  onChange={(e) =>
                    updateSetting("telegramChatId", e.target.value)
                  }
                  placeholder="-1001234567890"
                  autoComplete="off"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customWebhook">
                  Custom Webhook URL
                </FieldLabel>
                <Input
                  id="customWebhook"
                  value={settings.customWebhook || ""}
                  onChange={(e) =>
                    updateSetting("customWebhook", e.target.value)
                  }
                  placeholder="https://your-webhook-url.com"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polling">
          <Card>
            <CardHeader>
              <CardTitle>Polling Configuration</CardTitle>
              <CardDescription>
                Adjust how frequently metrics are collected and stored.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="defaultPollingInterval">
                  Default Interval (ms)
                </FieldLabel>
                <Input
                  id="defaultPollingInterval"
                  type="number"
                  value={settings.defaultPollingInterval || "5000"}
                  onChange={(e) =>
                    updateSetting("defaultPollingInterval", e.target.value)
                  }
                  className="max-w-md"
                />
                <FieldDescription>
                  Normal polling interval (default: 5000ms)
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="aggressivePollingInterval">
                  Aggressive Interval (ms)
                </FieldLabel>
                <Input
                  id="aggressivePollingInterval"
                  type="number"
                  value={settings.aggressivePollingInterval || "500"}
                  onChange={(e) =>
                    updateSetting("aggressivePollingInterval", e.target.value)
                  }
                  className="max-w-md"
                />
                <FieldDescription>
                  Fast polling for troubleshooting (default: 500ms)
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="historyRetention">
                  History Retention
                </FieldLabel>
                <select
                  id="historyRetention"
                  value={settings.historyRetention || "30"}
                  onChange={(e) =>
                    updateSetting("historyRetention", e.target.value)
                  }
                  className="h-9 rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </Field>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="autoCleanup">Auto Cleanup</FieldLabel>
                  <FieldDescription>
                    Automatically delete old data based on retention policy
                  </FieldDescription>
                </div>
                <Switch
                  id="autoCleanup"
                  checked={settings.autoCleanup === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("autoCleanup", String(checked))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity">
          <Card>
            <CardHeader>
              <CardTitle>Connectivity Checks</CardTitle>
              <CardDescription>
                Configure targets for internet connectivity verification. These
                are used in both normal and aggressive monitoring modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ConnectivityCheck
                id="checkGateway"
                label="Gateway Check"
                description="Ping your router/gateway to verify local network connectivity"
                hostId="gatewayIp"
                hostLabel="Gateway IP"
                hostValue={settings.gatewayIp || ""}
                hostPlaceholder="Auto-detect from router config"
                hostDescription="Leave empty to auto-detect from configured router"
                enabled={settings.checkGateway !== "false"}
                onEnabledChange={(checked) =>
                  updateSetting("checkGateway", String(checked))
                }
                onHostChange={(value) => updateSetting("gatewayIp", value)}
              />

              <ConnectivityCheck
                id="checkCloudflare"
                label="Cloudflare DNS"
                description="Ping 1.1.1.1 to verify Cloudflare connectivity"
                hostId="cloudflareHost"
                hostLabel="Cloudflare Host"
                hostValue={settings.cloudflareHost || "1.1.1.1"}
                hostPlaceholder="1.1.1.1"
                enabled={settings.checkCloudflare !== "false"}
                onEnabledChange={(checked) =>
                  updateSetting("checkCloudflare", String(checked))
                }
                onHostChange={(value) => updateSetting("cloudflareHost", value)}
              />

              <ConnectivityCheck
                id="checkGoogle"
                label="Google DNS"
                description="Ping 8.8.8.8 to verify Google connectivity"
                hostId="googleHost"
                hostLabel="Google Host"
                hostValue={settings.googleHost || "8.8.8.8"}
                hostPlaceholder="8.8.8.8"
                enabled={settings.checkGoogle !== "false"}
                onEnabledChange={(checked) =>
                  updateSetting("checkGoogle", String(checked))
                }
                onHostChange={(value) => updateSetting("googleHost", value)}
              />

              <ConnectivityCheck
                id="checkDns"
                label="Quad9 DNS"
                description="Ping 9.9.9.9 to verify Quad9 connectivity"
                hostId="dnsHost"
                hostLabel="Quad9 Host"
                hostValue={settings.dnsHost || "9.9.9.9"}
                hostPlaceholder="9.9.9.9"
                enabled={settings.checkDns !== "false"}
                onEnabledChange={(checked) =>
                  updateSetting("checkDns", String(checked))
                }
                onHostChange={(value) => updateSetting("dnsHost", value)}
              />

              <ConnectivityCheck
                id="checkWebsite"
                label="Website Check"
                description="Ping a website to verify full internet connectivity (not in quick mode)"
                hostId="websiteHost"
                hostLabel="Website Host"
                hostValue={settings.websiteHost || "google.com"}
                hostPlaceholder="google.com"
                enabled={settings.checkWebsite !== "false"}
                onEnabledChange={(checked) =>
                  updateSetting("checkWebsite", String(checked))
                }
                onHostChange={(value) => updateSetting("websiteHost", value)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

function ConnectivityCheck({
  id,
  label,
  description,
  hostId,
  hostLabel,
  hostValue,
  hostPlaceholder,
  hostDescription,
  enabled,
  onEnabledChange,
  onHostChange,
}: {
  id: string
  label: string
  description: string
  hostId: string
  hostLabel: string
  hostValue: string
  hostPlaceholder: string
  hostDescription?: string
  enabled: boolean
  onEnabledChange: (checked: boolean) => void
  onHostChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {!enabled && <Badge variant="secondary">Disabled</Badge>}
          </div>
          <FieldDescription>{description}</FieldDescription>
        </div>
        <Switch id={id} checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled && (
        <Field>
          <FieldLabel htmlFor={hostId}>{hostLabel}</FieldLabel>
          <Input
            id={hostId}
            value={hostValue}
            onChange={(e) => onHostChange(e.target.value)}
            placeholder={hostPlaceholder}
            className="max-w-md"
          />
          {hostDescription && (
            <FieldDescription>{hostDescription}</FieldDescription>
          )}
        </Field>
      )}
    </div>
  )
}

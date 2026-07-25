import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const defaults: Record<string, string> = {
  theme: "system",
  accentColor: "blue",
  compactMode: "false",
  animations: "true",
  defaultPollingInterval: "5000",
  aggressivePollingInterval: "500",
  historyRetention: "30",
  autoCleanup: "true",
  desktopNotifications: "true",
  discordWebhook: "",
  telegramBotToken: "",
  telegramChatId: "",
  customWebhook: "",
  checkGateway: "true",
  gatewayIp: "",
  checkCloudflare: "true",
  cloudflareHost: "1.1.1.1",
  checkGoogle: "true",
  googleHost: "8.8.8.8",
  checkDns: "true",
  dnsHost: "9.9.9.9",
  checkWebsite: "true",
  websiteHost: "google.com",
}

export async function GET() {
  const allSettings = db.select().from(settings).all()
  const settingsMap: Record<string, string> = { ...defaults }

  for (const s of allSettings) {
    settingsMap[s.key] = s.value
  }

  return NextResponse.json(settingsMap)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  for (const [key, value] of Object.entries(body)) {
    const existing = db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get()

    if (existing) {
      db.update(settings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(settings.key, key))
        .run()
    } else {
      db.insert(settings)
        .values({ key, value: String(value) })
        .run()
    }
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { routers, samples, events, settings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const data = {
    routers: db.select().from(routers).all(),
    samples: db.select().from(samples).limit(10000).all(),
    events: db.select().from(events).limit(10000).all(),
    settings: db.select().from(settings).all(),
    exportedAt: new Date().toISOString(),
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="router-monitor-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (data.routers) {
      for (const router of data.routers) {
        const existing = db
          .select()
          .from(routers)
          .where(eq(routers.id, router.id))
          .get()

        if (existing) {
          db.update(routers).set(router).where(eq(routers.id, router.id)).run()
        } else {
          db.insert(routers).values(router).run()
        }
      }
    }

    if (data.settings) {
      for (const setting of data.settings) {
        const existing = db
          .select()
          .from(settings)
          .where(eq(settings.key, setting.key))
          .get()

        if (existing) {
          db.update(settings)
            .set({ value: setting.value, updatedAt: new Date() })
            .where(eq(settings.key, setting.key))
            .run()
        } else {
          db.insert(settings).values(setting).run()
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 400 }
    )
  }
}

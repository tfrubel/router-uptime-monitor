import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const routerId = searchParams.get("routerId")
  const hours = Number(searchParams.get("hours")) || 24

  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  let query = db
    .select()
    .from(events)
    .where(gte(events.timestamp, since))
    .orderBy(desc(events.timestamp))
    .limit(100)

  if (routerId) {
    query = db
      .select()
      .from(events)
      .where(
        and(eq(events.routerId, Number(routerId)), gte(events.timestamp, since))
      )
      .orderBy(desc(events.timestamp))
      .limit(100)
  }

  const data = query.all()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const result = db
    .insert(events)
    .values({
      routerId: body.routerId,
      type: body.type,
      severity: body.severity,
      message: body.message,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    })
    .returning()
    .get()

  return NextResponse.json(result)
}

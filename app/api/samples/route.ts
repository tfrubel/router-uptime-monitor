import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { samples } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const routerId = searchParams.get("routerId")
  const hours = Number(searchParams.get("hours")) || 24
  const type = searchParams.get("type")

  if (!routerId) {
    return NextResponse.json({ error: "routerId required" }, { status: 400 })
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const query = db
    .select()
    .from(samples)
    .where(
      and(eq(samples.routerId, Number(routerId)), gte(samples.timestamp, since))
    )
    .orderBy(desc(samples.timestamp))
    .limit(1000)

  const data = query.all()

  if (type) {
    return NextResponse.json(data.filter((s) => s.type === type))
  }

  return NextResponse.json(data)
}

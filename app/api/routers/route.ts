import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { routers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const allRouters = db.select().from(routers).all()
  return NextResponse.json(allRouters)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const result = db
    .insert(routers)
    .values({
      name: body.name || "Unnamed Router",
      type: body.type || "generic",
      ip: body.ip,
      sshPort: body.sshPort || 22,
      username: body.username || null,
      password: body.password || null,
      vendor: body.vendor || null,
      loginUrl: body.loginUrl || null,
      pollingInterval: body.pollingInterval || 5000,
    })
    .returning()
    .get()

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const result = db
    .update(routers)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(routers.id, id))
    .returning()
    .get()

  return NextResponse.json(result)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  db.delete(routers).where(eq(routers.id, Number(id))).run()

  return NextResponse.json({ success: true })
}

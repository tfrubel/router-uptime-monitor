import { db } from "@/lib/db"
import { samples, events } from "@/lib/db/schema"
import { lt } from "drizzle-orm"

export async function cleanupOldData(retentionDays: number = 30) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  const deletedSamples = db
    .delete(samples)
    .where(lt(samples.timestamp, cutoffDate))
    .run()

  const deletedEvents = db
    .delete(events)
    .where(lt(events.timestamp, cutoffDate))
    .run()

  return {
    samplesDeleted: deletedSamples.changes,
    eventsDeleted: deletedEvents.changes,
  }
}

export async function getDatabaseStats() {
  const sampleCount = db
    .select({ count: samples.id })
    .from(samples)
    .all().length

  const eventCount = db.select({ count: events.id }).from(events).all().length

  return {
    samples: sampleCount,
    events: eventCount,
  }
}

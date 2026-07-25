import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const routers = sqliteTable("routers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["openwrt", "generic"] }).notNull(),
  ip: text("ip").notNull(),
  sshPort: integer("ssh_port").default(22),
  username: text("username"),
  password: text("password"),
  sshKey: text("ssh_key"),
  vendor: text("vendor"),
  loginUrl: text("login_url"),
  snmpCommunity: text("snmp_community"),
  pollingInterval: integer("polling_interval").default(5000),
  isOnline: integer("is_online", { mode: "boolean" }).default(false),
  lastSeen: integer("last_seen", { mode: "timestamp" }),
  firmware: text("firmware"),
  favorite: integer("favorite", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
})

export const samples = sqliteTable("samples", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routerId: integer("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
  type: text("type", {
    enum: ["metrics", "bandwidth", "latency", "cpu", "memory"],
  }).notNull(),
  download: real("download"),
  upload: real("upload"),
  ping: real("ping"),
  packetLoss: real("packet_loss"),
  jitter: real("jitter"),
  cpuUsage: real("cpu_usage"),
  memoryUsage: real("memory_usage"),
  flashUsage: real("flash_usage"),
  connectedClients: integer("connected_clients"),
  temperature: real("temperature"),
  gatewayPing: real("gateway_ping"),
  cloudflarePing: real("cloudflare_ping"),
  googlePing: real("google_ping"),
  dnsPing: real("dns_ping"),
  websitePing: real("website_ping"),
  metadata: text("metadata"),
})

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routerId: integer("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
  type: text("type", {
    enum: [
      "internet_lost",
      "gateway_timeout",
      "wan_restart",
      "high_latency",
      "upload_spike",
      "download_spike",
      "router_offline",
      "ssh_failed",
      "cpu_over_90",
      "memory_over_90",
      "info",
      "warning",
      "critical",
    ],
  }).notNull(),
  severity: text("severity", {
    enum: ["info", "warning", "critical"],
  }).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
})

export const interfaces = sqliteTable("interfaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routerId: integer("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["wan", "lan", "wifi", "other"] }).notNull(),
  mac: text("mac"),
  ip: text("ip"),
  mask: text("mask"),
  status: text("status", { enum: ["up", "down"] }).notNull(),
  rxBytes: integer("rx_bytes"),
  txBytes: integer("tx_bytes"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
})

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routerId: integer("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  hostname: text("hostname"),
  ip: text("ip").notNull(),
  mac: text("mac").notNull(),
  interface: text("interface"),
  isGuest: integer("is_guest", { mode: "boolean" }).default(false),
  isWireless: integer("is_wireless", { mode: "boolean" }).default(false),
  lastSeen: integer("last_seen", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
})

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`unixepoch()`),
})

export type Router = typeof routers.$inferSelect
export type NewRouter = typeof routers.$inferInsert
export type Sample = typeof samples.$inferSelect
export type NewSample = typeof samples.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Interface = typeof interfaces.$inferSelect
export type Client = typeof clients.$inferSelect
export type Setting = typeof settings.$inferSelect

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { mkdirSync, existsSync } from "fs"
import { dirname } from "path"
import * as schema from "./schema"

const DB_PATH = process.env.DB_PATH || "data/monitor.db"

mkdirSync(dirname(DB_PATH), { recursive: true })

const isNew = !existsSync(DB_PATH)

const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

export const db = drizzle(sqlite, { schema })

if (isNew) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS routers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('openwrt', 'generic')),
      ip TEXT NOT NULL,
      ssh_port INTEGER DEFAULT 22,
      username TEXT,
      password TEXT,
      ssh_key TEXT,
      vendor TEXT,
      login_url TEXT,
      snmp_community TEXT,
      polling_interval INTEGER DEFAULT 5000,
      is_online INTEGER DEFAULT 0,
      last_seen INTEGER,
      firmware TEXT,
      favorite INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      type TEXT NOT NULL CHECK(type IN ('metrics', 'bandwidth', 'latency', 'cpu', 'memory')),
      download REAL,
      upload REAL,
      ping REAL,
      packet_loss REAL,
      jitter REAL,
      cpu_usage REAL,
      memory_usage REAL,
      flash_usage REAL,
      connected_clients INTEGER,
      temperature REAL,
      gateway_ping REAL,
      cloudflare_ping REAL,
      google_ping REAL,
      dns_ping REAL,
      website_ping REAL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS interfaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('wan', 'lan', 'wifi', 'other')),
      mac TEXT,
      ip TEXT,
      mask TEXT,
      status TEXT NOT NULL CHECK(status IN ('up', 'down')),
      rx_bytes INTEGER,
      tx_bytes INTEGER,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
      hostname TEXT,
      ip TEXT NOT NULL,
      mac TEXT NOT NULL,
      interface TEXT,
      is_guest INTEGER DEFAULT 0,
      is_wireless INTEGER DEFAULT 0,
      last_seen INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_samples_router_id ON samples(router_id);
    CREATE INDEX IF NOT EXISTS idx_samples_timestamp ON samples(timestamp);
    CREATE INDEX IF NOT EXISTS idx_samples_type ON samples(type);
    CREATE INDEX IF NOT EXISTS idx_events_router_id ON events(router_id);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_clients_router_id ON clients(router_id);
    CREATE INDEX IF NOT EXISTS idx_interfaces_router_id ON interfaces(router_id);
  `)
  console.log("Database initialized successfully")
}

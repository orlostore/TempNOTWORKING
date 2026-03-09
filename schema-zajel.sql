-- Migration: Zajel shipping integration
-- Run these in your D1 console (Cloudflare Dashboard > D1 > Console)

-- Shipments table — links Stripe orders to Zajel AWB numbers
CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  zajel_reference TEXT,
  customer_reference TEXT,
  status TEXT DEFAULT 'pending',
  zajel_status TEXT,
  zajel_status_date TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  destination_city TEXT,
  destination_address TEXT,
  weight_kg REAL DEFAULT 0.5,
  num_pieces INTEGER DEFAULT 1,
  cod_amount REAL DEFAULT 0,
  label_url TEXT,
  failure_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for fast lookups by Zajel reference (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_shipments_zajel_ref ON shipments(zajel_reference);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);

-- Shipment events log — tracks all Zajel webhook status updates
CREATE TABLE IF NOT EXISTS shipment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL,
  zajel_reference TEXT,
  status TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  received_by TEXT,
  delivery_courier TEXT,
  failure_reason TEXT,
  raw_payload TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

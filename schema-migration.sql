-- Migration: Add product variants, pricing tiers, and extra spec fields
-- Run these in your D1 console (Cloudflare Dashboard > D1 > Console)

-- Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  nameAr TEXT DEFAULT '',
  image TEXT DEFAULT '',
  quantity INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Pricing Tiers table
CREATE TABLE IF NOT EXISTS product_pricing_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  min_qty INTEGER NOT NULL,
  price_per_unit REAL NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Extra product spec columns
ALTER TABLE products ADD COLUMN wattage TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN voltage TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN plugType TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN plugTypeAr TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN baseType TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN baseTypeAr TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN material TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN materialAr TEXT DEFAULT '';

-- Product sort order (for manual reordering in admin)
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;

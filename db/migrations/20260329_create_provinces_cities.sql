-- Migration: Create provinces and cities tables for hierarchical location system
-- Description: Adds support for Indonesian province/city hierarchy with SEF-friendly slugs
-- Date: 2026-03-29

-- =============================================================================
-- PROVINCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,           -- Official province code (e.g., '31' for DKI Jakarta)
  name text NOT NULL,                   -- Province name (e.g., 'DKI Jakarta')
  slug text UNIQUE NOT NULL,            -- SEF URL slug (e.g., 'dki-jakarta')
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provinces_slug ON provinces(slug);
CREATE INDEX IF NOT EXISTS idx_provinces_code ON provinces(code);

-- =============================================================================
-- CITIES TABLE (Kota and Kabupaten)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id uuid NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
  code text NOT NULL,                   -- Official city code (e.g., '3171')
  name text NOT NULL,                   -- City name (e.g., 'Jakarta Selatan')
  slug text NOT NULL,                   -- SEF URL slug (e.g., 'jakarta-selatan')
  type text CHECK(type IN ('kota', 'kabupaten')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(province_id, slug)             -- Slug unique within province
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_province_id ON cities(province_id);
CREATE INDEX IF NOT EXISTS idx_cities_province_slug ON cities(province_id, slug);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Public can view all provinces and cities (for browsing)
CREATE POLICY IF NOT EXISTS "Public can view provinces" 
  ON provinces FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view cities" 
  ON cities FOR SELECT 
  USING (true);

-- Only authenticated admins can modify (for future admin panel)
-- Note: Admin role check will be added in future migration when admin roles are implemented
-- For now, only service role can insert/update/delete

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for provinces
DROP TRIGGER IF EXISTS update_provinces_updated_at ON provinces;
CREATE TRIGGER update_provinces_updated_at 
  BEFORE UPDATE ON provinces 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cities
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at 
  BEFORE UPDATE ON cities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- =============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema='public' AND table_name IN ('provinces','cities');

-- Verify indexes exist:
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('provinces','cities');

-- Verify RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('provinces','cities');

-- Verify constraints:
-- SELECT conname, contype FROM pg_constraint 
-- WHERE conrelid IN ('provinces'::regclass, 'cities'::regclass);

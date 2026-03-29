-- Migration: Create properties table with location hierarchy
-- Description: Adds properties table linked to provinces/cities for kos listings
-- Date: 2026-03-29
-- Dependencies: 20260329_create_provinces_cities.sql must run first

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title text NOT NULL,
  description text,
  address text NOT NULL,
  
  province_id uuid NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  latitude float,
  longitude float,
  
  price numeric NOT NULL CHECK (price >= 0),
  room_type text,
  capacity integer CHECK (capacity > 0),
  facilities text[],
  
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_provider_id ON properties(provider_id);
CREATE INDEX IF NOT EXISTS idx_properties_province_id ON properties(province_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view published properties" 
  ON properties FOR SELECT 
  USING (status = 'published');

CREATE POLICY IF NOT EXISTS "Providers can view their own properties" 
  ON properties FOR SELECT 
  USING (auth.uid() = provider_id);

CREATE POLICY IF NOT EXISTS "Providers can insert their own properties" 
  ON properties FOR INSERT 
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY IF NOT EXISTS "Providers can update their own properties" 
  ON properties FOR UPDATE 
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY IF NOT EXISTS "Providers can delete their own properties" 
  ON properties FOR DELETE 
  USING (auth.uid() = provider_id);

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

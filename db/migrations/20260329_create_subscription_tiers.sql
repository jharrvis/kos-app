-- Migration: Create subscription_tiers table
-- Description: Defines subscription tiers (free, basic, premium) with pricing and feature limits
-- Date: 2026-03-29
-- Dependencies: None

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name text UNIQUE NOT NULL CHECK (name IN ('free', 'basic', 'premium')),
  display_name text NOT NULL,
  description text,
  
  -- Pricing (in Rupiah, 0 for free tier)
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  
  -- Feature limits stored as JSONB for flexibility
  -- Schema: {
  --   max_properties: number | null (null = unlimited),
  --   max_images_per_property: number,
  --   featured_listing: boolean,
  --   priority_support: boolean,
  --   analytics: boolean
  -- }
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  is_active boolean NOT NULL DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name ON subscription_tiers(name);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_is_active ON subscription_tiers(is_active);

-- Row Level Security
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Public can view active tiers (for displaying pricing page)
CREATE POLICY IF NOT EXISTS "Public can view active tiers"
  ON subscription_tiers FOR SELECT
  USING (is_active = true);

-- Admins can manage tiers (requires admin role in JWT)
CREATE POLICY IF NOT EXISTS "Admins can manage tiers"
  ON subscription_tiers FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

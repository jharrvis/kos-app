-- Migration: Add images and featured listing support to properties
-- Description: Adds images array and is_featured flag for tier-based features
-- Date: 2026-03-29
-- Dependencies: 20260329_create_properties.sql

ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_is_featured 
  ON properties(is_featured) 
  WHERE is_featured = true;

COMMENT ON COLUMN properties.images IS 'Array of image URLs for property photos. Max count enforced by subscription tier.';
COMMENT ON COLUMN properties.is_featured IS 'Featured listing flag. Only available for Premium tier.';

-- Migration: Add admin role to profiles table
-- Description: Extends profiles.role column to support 'admin' value for administrative access
-- Date: 2026-03-29
-- Dependencies: Assumes profiles table exists with role column (created by Supabase Auth or earlier migration)

-- Drop existing CHECK constraint if it exists (assumes constraint name follows Supabase pattern)
-- Note: Replace constraint name if different in your schema
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Re-add CHECK constraint with admin role included
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('tenant', 'provider', 'admin'));

-- Create index on role for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add RLS policy for admins to view all profiles (useful for admin panel user management)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Note: To promote a user to admin, run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Migration: Create subscriptions table
-- Description: Tracks user subscriptions to tiers with trial periods and Mayar.id integration
-- Date: 2026-03-29
-- Dependencies: 20260329_create_subscription_tiers.sql must run first

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES subscription_tiers(id) ON DELETE RESTRICT,
  
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  
  -- Trial period tracking (30 days for new providers on first property)
  trial_ends_at timestamptz,
  
  -- Billing period tracking
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  
  -- Mayar.id integration reference
  mayar_subscription_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint: User can only have one active subscription at a time
  CONSTRAINT unique_active_subscription UNIQUE (user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_id ON subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mayar_id ON subscriptions(mayar_subscription_id) 
  WHERE mayar_subscription_id IS NOT NULL;

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY IF NOT EXISTS "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage subscriptions (for webhook handlers)
CREATE POLICY IF NOT EXISTS "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can create their own subscription (trial activation)
CREATE POLICY IF NOT EXISTS "Users can create their own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY IF NOT EXISTS "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

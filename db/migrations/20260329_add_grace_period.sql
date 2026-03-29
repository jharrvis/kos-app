ALTER TABLE subscriptions
  ADD COLUMN grace_period_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period 
  ON subscriptions(grace_period_ends_at) 
  WHERE grace_period_ends_at IS NOT NULL;

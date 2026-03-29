-- Migration: Create payments table
-- Description: Tracks payment transactions for subscriptions via Mayar.id
-- Date: 2026-03-29
-- Dependencies: 20260329_create_subscriptions.sql must run first

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Mayar.id transaction references
  mayar_payment_id text,
  mayar_transaction_id text,
  
  payment_method text,
  paid_at timestamptz,
  
  -- Additional data from Mayar.id webhook (customer info, product details, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mayar_payment_id ON payments(mayar_payment_id) 
  WHERE mayar_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at) 
  WHERE paid_at IS NOT NULL;

-- Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments (through subscription relationship)
CREATE POLICY IF NOT EXISTS "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = payments.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

-- Service role can manage payments (for webhook handlers)
CREATE POLICY IF NOT EXISTS "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can manage all payments
CREATE POLICY IF NOT EXISTS "Admins can manage all payments"
  ON payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

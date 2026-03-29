export interface SubscriptionTier {
  id: string;
  name: 'free' | 'basic' | 'premium';
  display_name: string;
  description?: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: {
    max_properties: number | null;
    max_images_per_property: number;
    featured_listing: boolean;
    priority_support: boolean;
    analytics: boolean;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at?: string | null;
  grace_period_ends_at?: string | null;
  current_period_start: string;
  current_period_end: string;
  mayar_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionWithTier extends Subscription {
  subscription_tiers?: SubscriptionTier;
}

export interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  mayar_payment_id?: string | null;
  mayar_transaction_id?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentWithSubscription extends Payment {
  subscriptions?: SubscriptionWithTier;
}

import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types/subscription'

export interface SubscriptionLimitCheck {
  allowed: boolean
  reason?: string
  currentCount?: number
  maxAllowed?: number | null
}

export async function checkPropertyLimit(
  userId: string
): Promise<SubscriptionLimitCheck> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      status,
      subscription_tiers (
        features
      )
    `)
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .single()

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No active subscription. Please subscribe to a plan.',
    }
  }

  const features = Array.isArray(subscription.subscription_tiers) && subscription.subscription_tiers.length > 0
  ? subscription.subscription_tiers[0].features
  : null
  const maxProperties = features?.max_properties

  if (maxProperties === null) {
    return { allowed: true }
  }

  const { count: currentCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', userId)
    .neq('status', 'archived')

  const propertyCount = currentCount || 0

  if (propertyCount >= maxProperties) {
    return {
      allowed: false,
      reason: `Property limit reached. Your plan allows ${maxProperties} ${maxProperties === 1 ? 'property' : 'properties'}.`,
      currentCount: propertyCount,
      maxAllowed: maxProperties,
    }
  }

  return {
    allowed: true,
    currentCount: propertyCount,
    maxAllowed: maxProperties,
  }
}

export async function checkImageLimit(
  userId: string,
  imageCount: number
): Promise<SubscriptionLimitCheck> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      subscription_tiers (
        features
      )
    `)
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .single()

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No active subscription',
    }
  }

  const features = Array.isArray(subscription.subscription_tiers) && subscription.subscription_tiers.length > 0
  ? subscription.subscription_tiers[0].features
  : null
  const maxImages = features?.max_images_per_property

  if (!maxImages) {
    return { allowed: true }
  }

  if (imageCount > maxImages) {
    return {
      allowed: false,
      reason: `Image limit exceeded. Your plan allows ${maxImages} images per property.`,
      maxAllowed: maxImages,
    }
  }

  return {
    allowed: true,
    maxAllowed: maxImages,
  }
}

export async function getUserSubscription(userId: string) {
  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      subscription_tiers (*)
    `)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return subscription
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .single()

  return !!subscription
}

export async function activatePremiumTrial(userId: string, tierId: string) {
  const supabase = await createClient()

  const hasSubscription = await hasActiveSubscription(userId)
  if (hasSubscription) {
    return null
  }

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier_id: tierId,
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    })
    .select(`
      *,
      subscription_tiers (*)
    `)
    .single()

  if (error) {
    throw error
  }

  return subscription
}

export async function checkFeaturedListingAccess(
  userId: string
): Promise<SubscriptionLimitCheck> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      subscription_tiers (
        name,
        features
      )
    `)
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .single()

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No active subscription',
    }
  }

  const tier = Array.isArray(subscription.subscription_tiers) && subscription.subscription_tiers.length > 0
    ? subscription.subscription_tiers[0]
    : null
  
  const hasFeaturedAccess = tier?.features?.featured_listing

  if (!hasFeaturedAccess) {
    return {
      allowed: false,
      reason: `Featured listings are only available for Premium tier. Current tier: ${tier?.name || 'unknown'}`,
    }
  }

  return { allowed: true }
}

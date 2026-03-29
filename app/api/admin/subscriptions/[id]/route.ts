import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { logAdminAction, requireAdminRole } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await requireAdminRole(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, tier_id, extend_days } = body

    const supabase = await createClient()

    if (action === 'extend_trial') {
      return await extendTrial(supabase, session.user.id, id, extend_days)
    }

    if (action === 'change_tier') {
      return await changeTierAdmin(supabase, session.user.id, id, tier_id)
    }

    if (action === 'cancel') {
      return await cancelSubscription(supabase, session.user.id, id)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

async function extendTrial(
  supabase: any,
  adminId: string,
  subscriptionId: string,
  extendDays: number
) {
  if (!extendDays || extendDays < 1 || extendDays > 365) {
    return NextResponse.json(
      { error: 'Invalid extend_days value (1-365 days allowed)' },
      { status: 400 }
    )
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('trial_ends_at, status')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const currentTrialEnd = new Date(subscription.trial_ends_at || new Date())
  const newTrialEnd = new Date(currentTrialEnd)
  newTrialEnd.setDate(newTrialEnd.getDate() + extendDays)

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({
      trial_ends_at: newTrialEnd.toISOString(),
      status: subscription.status === 'expired' ? 'trial' : subscription.status,
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  await logAdminAction(adminId, 'extend_trial', 'subscription', subscriptionId, {
    days_added: extendDays,
    new_trial_end: newTrialEnd.toISOString(),
  })

  return NextResponse.json({ subscription: updated })
}

async function changeTierAdmin(
  supabase: any,
  adminId: string,
  subscriptionId: string,
  newTierId: string
) {
  if (!newTierId) {
    return NextResponse.json({ error: 'Missing tier_id' }, { status: 400 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier_id')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('name')
    .eq('id', newTierId)
    .single()

  if (!tier) {
    return NextResponse.json({ error: 'Invalid tier_id' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ tier_id: newTierId })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  await logAdminAction(adminId, 'change_tier', 'subscription', subscriptionId, {
    old_tier_id: subscription.tier_id,
    new_tier_id: newTierId,
  })

  return NextResponse.json({ subscription: updated })
}

async function cancelSubscription(
  supabase: any,
  adminId: string,
  subscriptionId: string
) {
  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  await logAdminAction(adminId, 'cancel_subscription', 'subscription', subscriptionId, {})

  return NextResponse.json({ subscription: updated })
}

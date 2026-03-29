import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { mayarClient } from '@/lib/mayar'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers (*)
      `)
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tierId, action } = body

    if (!tierId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: tierId, action' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (action === 'activate_trial') {
      return await activateTrial(supabase, session.user.id, tierId)
    }

    if (action === 'upgrade' || action === 'downgrade') {
      return await changeTier(supabase, session.user, tierId, action)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

async function activateTrial(supabase: any, userId: string, tierId: string) {
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existingSubscription) {
    return NextResponse.json(
      { error: 'User already has a subscription' },
      { status: 400 }
    )
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

  return NextResponse.json({ subscription })
}

async function changeTier(
  supabase: any,
  user: any,
  newTierId: string,
  action: 'upgrade' | 'downgrade'
) {
  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      subscription_tiers (*)
    `)
    .eq('user_id', user.id)
    .single()

  if (!currentSubscription) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    )
  }

  const { data: newTier } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', newTierId)
    .single()

  if (!newTier) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (newTier.price === 0) {
    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        tier_id: newTierId,
        status: 'active',
      })
      .eq('id', currentSubscription.id)
      .select(`
        *,
        subscription_tiers (*)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ subscription: updatedSubscription })
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const invoice = await mayarClient.createInvoice({
    name: user.name || user.email,
    email: user.email,
    mobile: user.phone || '0000000000',
    redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/subscription`,
    description: `${action === 'upgrade' ? 'Upgrade' : 'Downgrade'} to ${newTier.display_name}`,
    expiredAt: expiresAt.toISOString(),
    items: [
      {
        quantity: 1,
        rate: newTier.price,
        description: `${newTier.display_name} - ${newTier.billing_period}`,
      },
    ],
    extraData: {
      subscription_id: currentSubscription.id,
      user_id: user.id,
      tier_id: newTierId,
      action,
    },
  })

  return NextResponse.json({
    paymentUrl: invoice.data.link,
    invoice: invoice.data,
  })
}

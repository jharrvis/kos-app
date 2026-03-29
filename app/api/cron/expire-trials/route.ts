import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron job endpoint to expire trial subscriptions with grace period
 * 
 * This endpoint is called daily by Vercel Cron to:
 * 1. Find all subscriptions with status='trial' where trial_ends_at < NOW()
 * 2. Set grace_period_ends_at to trial_ends_at + 3 days
 * 3. Find all subscriptions where grace_period_ends_at < NOW()
 * 4. Update their status to 'expired'
 * 
 * Security: Protected by CRON_SECRET header verification
 * Schedule: Daily at 00:00 UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify this request is from Vercel Cron (security check)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron job not configured' },
      { status: 500 }
    )
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = await createClient()
    const now = new Date()
    
    const { data: trialsNeedingGracePeriod, error: graceQueryError } = await supabase
      .from('subscriptions')
      .select('id, user_id, trial_ends_at')
      .eq('status', 'trial')
      .is('grace_period_ends_at', null)
      .lt('trial_ends_at', now.toISOString())
    
    if (graceQueryError) {
      console.error('Error querying trials needing grace period:', graceQueryError)
    }
    
    let gracePeriodSetCount = 0
    if (trialsNeedingGracePeriod && trialsNeedingGracePeriod.length > 0) {
      console.log(`Found ${trialsNeedingGracePeriod.length} trials needing grace period`)
      
      const gracePeriodUpdates = trialsNeedingGracePeriod.map(trial => {
        const gracePeriodEnd = new Date(trial.trial_ends_at)
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3)
        return {
          id: trial.id,
          grace_period_ends_at: gracePeriodEnd.toISOString(),
        }
      })
      
      for (const update of gracePeriodUpdates) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ grace_period_ends_at: update.grace_period_ends_at })
          .eq('id', update.id)
        
        if (!error) {
          gracePeriodSetCount++
        }
      }
      
      console.log(`Set grace period for ${gracePeriodSetCount} trials`)
    }
    
    const { data: expiredTrials, error: queryError } = await supabase
      .from('subscriptions')
      .select('id, user_id, trial_ends_at, grace_period_ends_at')
      .eq('status', 'trial')
      .not('grace_period_ends_at', 'is', null)
      .lt('grace_period_ends_at', now.toISOString())
    
    if (queryError) {
      console.error('Error querying expired trials:', queryError)
      return NextResponse.json(
        { error: 'Database query failed', details: queryError.message },
        { status: 500 }
      )
    }
    
    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired trials found (grace periods still active)',
        expiredCount: 0,
        gracePeriodSetCount,
      })
    }
    
    console.log(`Found ${expiredTrials.length} expired trials (grace period ended)`)
    
    const trialIds = expiredTrials.map(t => t.id)
    
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .in('id', trialIds)
      .select('id')
    
    if (updateError) {
      console.error('Error updating expired trials:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscriptions', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log(`Successfully expired ${updated?.length || 0} trial subscriptions`)
    
    return NextResponse.json({
      success: true,
      message: `Expired ${updated?.length || 0} trial subscriptions`,
      expiredCount: updated?.length || 0,
      gracePeriodSetCount,
      expiredTrialIds: expiredTrials.map(t => ({
        id: t.id,
        user_id: t.user_id,
        trial_ends_at: t.trial_ends_at,
        grace_period_ends_at: t.grace_period_ends_at,
      })),
    })
    
  } catch (error) {
    console.error('Unexpected error in expire-trials cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

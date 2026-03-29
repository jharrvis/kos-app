import { createClient } from '@/lib/supabase/server'
import { sendEmail, getTrialExpiryEmail7Days, getTrialExpiryEmail1Day, getTrialExpiredEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenDaysStart = new Date(sevenDaysFromNow)
    sevenDaysStart.setHours(0, 0, 0, 0)
    const sevenDaysEnd = new Date(sevenDaysFromNow)
    sevenDaysEnd.setHours(23, 59, 59, 999)
    
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    const oneDayStart = new Date(oneDayFromNow)
    oneDayStart.setHours(0, 0, 0, 0)
    const oneDayEnd = new Date(oneDayFromNow)
    oneDayEnd.setHours(23, 59, 59, 999)
    
    const { data: trials7Days, error: error7d } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_ends_at,
        profiles!inner (full_name, email)
      `)
      .eq('status', 'trial')
      .gte('trial_ends_at', sevenDaysStart.toISOString())
      .lte('trial_ends_at', sevenDaysEnd.toISOString())
    
    if (error7d) {
      console.error('Error querying 7-day trials:', error7d)
    }
    
    let sent7DayEmails = 0
    if (trials7Days && trials7Days.length > 0) {
      console.log(`Sending 7-day notifications to ${trials7Days.length} users`)
      
      for (const trial of trials7Days) {
        try {
          const profile = trial.profiles as any
          const email = getTrialExpiryEmail7Days(
            profile.full_name || 'User',
            new Date(trial.trial_ends_at).toLocaleDateString('id-ID')
          )
          
          await sendEmail({
            to: profile.email,
            subject: email.subject,
            html: email.html,
          })
          
          sent7DayEmails++
        } catch (emailError) {
          console.error(`Failed to send 7-day email to user ${trial.user_id}:`, emailError)
        }
      }
    }
    
    const { data: trials1Day, error: error1d } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_ends_at,
        profiles!inner (full_name, email)
      `)
      .eq('status', 'trial')
      .gte('trial_ends_at', oneDayStart.toISOString())
      .lte('trial_ends_at', oneDayEnd.toISOString())
    
    if (error1d) {
      console.error('Error querying 1-day trials:', error1d)
    }
    
    let sent1DayEmails = 0
    if (trials1Day && trials1Day.length > 0) {
      console.log(`Sending 1-day notifications to ${trials1Day.length} users`)
      
      for (const trial of trials1Day) {
        try {
          const profile = trial.profiles as any
          const email = getTrialExpiryEmail1Day(
            profile.full_name || 'User',
            new Date(trial.trial_ends_at).toLocaleDateString('id-ID')
          )
          
          await sendEmail({
            to: profile.email,
            subject: email.subject,
            html: email.html,
          })
          
          sent1DayEmails++
        } catch (emailError) {
          console.error(`Failed to send 1-day email to user ${trial.user_id}:`, emailError)
        }
      }
    }
    
    const { data: expiredTrials, error: errorExpired } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_ends_at,
        grace_period_ends_at,
        profiles!inner (full_name, email)
      `)
      .eq('status', 'trial')
      .not('grace_period_ends_at', 'is', null)
      .lt('trial_ends_at', now.toISOString())
      .gte('grace_period_ends_at', now.toISOString())
    
    if (errorExpired) {
      console.error('Error querying expired trials:', errorExpired)
    }
    
    let sentExpiredEmails = 0
    if (expiredTrials && expiredTrials.length > 0) {
      console.log(`Sending expiry notifications to ${expiredTrials.length} users`)
      
      for (const trial of expiredTrials) {
        try {
          const profile = trial.profiles as any
          const email = getTrialExpiredEmail(
            profile.full_name || 'User',
            new Date(trial.grace_period_ends_at!).toLocaleDateString('id-ID')
          )
          
          await sendEmail({
            to: profile.email,
            subject: email.subject,
            html: email.html,
          })
          
          sentExpiredEmails++
        } catch (emailError) {
          console.error(`Failed to send expired email to user ${trial.user_id}:`, emailError)
        }
      }
    }
    
    console.log(`Email notifications sent: 7d=${sent7DayEmails}, 1d=${sent1DayEmails}, expired=${sentExpiredEmails}`)
    
    return NextResponse.json({
      success: true,
      sent7DayEmails,
      sent1DayEmails,
      sentExpiredEmails,
      totalSent: sent7DayEmails + sent1DayEmails + sentExpiredEmails,
    })
    
  } catch (error) {
    console.error('Unexpected error in trial-notifications cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

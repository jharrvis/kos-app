import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mayarClient } from '@/lib/mayar'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-mayar-signature') || ''

    if (!mayarClient.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const payload = mayarClient.parseWebhook(rawBody)
    const eventType = payload.event.received

    const supabase = await createClient()

    switch (eventType) {
      case 'payment.received':
        await handlePaymentReceived(supabase, payload)
        break

      case 'membership.memberExpired':
        await handleMemberExpired(supabase, payload)
        break

      case 'membership.newMemberRegistered':
        await handleNewMemberRegistered(supabase, payload)
        break

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentReceived(supabase: any, payload: any) {
  const { data: webhookData } = payload

  const subscriptionId = webhookData.extraData?.subscription_id
  if (!subscriptionId) {
    console.warn('payment.received webhook missing subscription_id in extraData')
    return
  }

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('mayar_payment_id', webhookData.id)
    .single()

  if (existingPayment) {
    console.log(`Payment ${webhookData.id} already processed, skipping`)
    return
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      subscription_id: subscriptionId,
      amount: webhookData.amount,
      status: 'paid',
      mayar_payment_id: webhookData.id,
      mayar_transaction_id: webhookData.id,
      payment_method: webhookData.productType || 'unknown',
      paid_at: new Date(webhookData.updatedAt).toISOString(),
      metadata: {
        customer_name: webhookData.customerName,
        customer_email: webhookData.customerEmail,
        customer_mobile: webhookData.customerMobile,
        product_name: webhookData.productName,
      },
    })

  if (paymentError) {
    console.error('Error inserting payment:', paymentError)
    throw paymentError
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('id', subscriptionId)
    .single()

  if (subscription) {
    const currentPeriodEnd = new Date(subscription.current_period_end)
    const newPeriodEnd = new Date(currentPeriodEnd)
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: currentPeriodEnd.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
      })
      .eq('id', subscriptionId)

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      throw subscriptionError
    }
  }

  console.log(`Payment processed successfully: ${webhookData.id}`)
}

async function handleMemberExpired(supabase: any, payload: any) {
  const { data: webhookData } = payload

  const mayarSubscriptionId = webhookData.extraData?.mayar_subscription_id
  if (!mayarSubscriptionId) {
    console.warn('membership.memberExpired webhook missing mayar_subscription_id')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('mayar_subscription_id', mayarSubscriptionId)

  if (error) {
    console.error('Error marking subscription as expired:', error)
    throw error
  }

  console.log(`Subscription expired: ${mayarSubscriptionId}`)
}

async function handleNewMemberRegistered(supabase: any, payload: any) {
  const { data: webhookData } = payload

  console.log('New member registered:', webhookData)
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verification'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Verification token is required' },
      { status: 400 }
    )
  }

  try {
    const verification = await verifyEmailToken(token)

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', verification.user_id)

    if (updateError) {
      console.error('Failed to update email_verified:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

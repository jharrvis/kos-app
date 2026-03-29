import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function createEmailVerificationToken(userId: string, email: string) {
  const supabase = await createClient()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('email_verifications')
    .insert({
      user_id: userId,
      email,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) throw error
  return token
}

export async function verifyEmailToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('token', token)
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null

  await supabase
    .from('email_verifications')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', data.id)

  return data
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
  
  console.log(`Verification email would be sent to ${email}`)
  console.log(`Verification URL: ${verifyUrl}`)
  
  return { success: true }
}

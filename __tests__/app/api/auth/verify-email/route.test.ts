import { GET } from '@/app/api/auth/verify-email/route'
import { verifyEmailToken } from '@/lib/email-verification'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/email-verification')
jest.mock('@/lib/supabase/server')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ error: null }),
}

describe('Email Verification API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 400 if token is missing', async () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as any

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Verification token is required')
  })

  it('should verify email successfully with valid token', async () => {
    const mockVerification = {
      id: 'verification-123',
      user_id: 'user-123',
      email: 'test@example.com',
      token: 'valid-token',
    }

    ;(verifyEmailToken as jest.Mock).mockResolvedValue(mockVerification)

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('token=valid-token'),
      },
    } as any

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Email verified successfully')
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.update).toHaveBeenCalledWith({ email_verified: true })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
  })

  it('should return 400 for invalid token', async () => {
    ;(verifyEmailToken as jest.Mock).mockResolvedValue(null)

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('token=invalid-token'),
      },
    } as any

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid or expired verification token')
  })

  it('should return 500 if profile update fails', async () => {
    const mockVerification = {
      id: 'verification-123',
      user_id: 'user-123',
      email: 'test@example.com',
      token: 'valid-token',
    }

    ;(verifyEmailToken as jest.Mock).mockResolvedValue(mockVerification)
    mockSupabase.eq.mockResolvedValue({ error: new Error('Update failed') })

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('token=valid-token'),
      },
    } as any

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to verify email')
  })
})

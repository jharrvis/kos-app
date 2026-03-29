import { verifyEmailToken, createEmailVerificationToken } from '@/lib/email-verification'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

describe('Email Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('createEmailVerificationToken', () => {
    it('should create a verification token successfully', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null })

      const token = await createEmailVerificationToken('user-123', 'test@example.com')

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      expect(mockSupabase.from).toHaveBeenCalledWith('email_verifications')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          email: 'test@example.com',
          token: expect.any(String),
          expires_at: expect.any(String),
        })
      )
    })

    it('should throw error if database insert fails', async () => {
      mockSupabase.insert.mockResolvedValue({ error: new Error('Insert failed') })

      await expect(
        createEmailVerificationToken('user-123', 'test@example.com')
      ).rejects.toThrow()
    })
  })

  describe('verifyEmailToken', () => {
    it('should verify valid token successfully', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: 'user-123',
        email: 'test@example.com',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 10000).toISOString(),
      }

      mockSupabase.single.mockResolvedValue({ data: mockVerification, error: null })
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabase.update.mockReturnValue(mockUpdateChain)

      const result = await verifyEmailToken('valid-token')

      expect(result).toEqual(mockVerification)
      expect(mockSupabase.from).toHaveBeenCalledWith('email_verifications')
      expect(mockSupabase.eq).toHaveBeenCalledWith('token', 'valid-token')
      expect(mockSupabase.is).toHaveBeenCalledWith('verified_at', null)
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          verified_at: expect.any(String),
        })
      )
    })

    it('should return null for invalid token', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Not found') })

      const result = await verifyEmailToken('invalid-token')

      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await verifyEmailToken('expired-token')

      expect(result).toBeNull()
    })
  })
})

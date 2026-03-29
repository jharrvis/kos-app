import { PATCH } from '@/app/api/profile/route'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/auth')
jest.mock('@/lib/supabase/server')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ error: null }),
}

describe('Profile API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)

    const request = {
      json: jest.fn().mockResolvedValue({ role: 'tenant' }),
    } as any

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid role', async () => {
    ;(auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    })

    const request = {
      json: jest.fn().mockResolvedValue({ role: 'invalid-role' }),
    } as any

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid role')
  })

  it('should update role successfully for tenant', async () => {
    ;(auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    })

    const request = {
      json: jest.fn().mockResolvedValue({ role: 'tenant' }),
    } as any

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.update).toHaveBeenCalledWith({ role: 'tenant' })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
  })

  it('should update role successfully for provider', async () => {
    ;(auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    })

    const request = {
      json: jest.fn().mockResolvedValue({ role: 'provider' }),
    } as any

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith({ role: 'provider' })
  })

  it('should return 500 if database update fails', async () => {
    ;(auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    })

    mockSupabase.eq.mockResolvedValue({ error: { message: 'Database error' } })

    const request = {
      json: jest.fn().mockResolvedValue({ role: 'tenant' }),
    } as any

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})

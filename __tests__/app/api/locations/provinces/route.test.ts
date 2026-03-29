import { GET } from '@/app/api/locations/provinces/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('GET /api/locations/provinces', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all provinces ordered by name', async () => {
    const mockProvinces = [
      { id: '1', name: 'Bali', slug: 'bali' },
      { id: '2', name: 'DKI Jakarta', slug: 'dki-jakarta' }
    ]

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockProvinces,
            error: null
          })
        })
      })
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockProvinces)
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Bali')
  })

  it('should return 500 on database error', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Database error' })
  })
})

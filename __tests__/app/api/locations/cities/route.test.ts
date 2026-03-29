import { GET } from '@/app/api/locations/cities/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('GET /api/locations/cities', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if province_id is missing', async () => {
    const request = new Request('http://localhost/api/locations/cities')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'province_id query parameter is required' })
  })

  it('should return cities filtered by province_id', async () => {
    const mockCities = [
      { id: '1', name: 'Jakarta Selatan', slug: 'jakarta-selatan', type: 'kota' },
      { id: '2', name: 'Jakarta Utara', slug: 'jakarta-utara', type: 'kota' }
    ]

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockCities,
              error: null
            })
          })
        })
      })
    } as any)

    const request = new Request('http://localhost/api/locations/cities?province_id=123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCities)
    expect(data).toHaveLength(2)
  })

  it('should return 500 on database error', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })
    } as any)

    const request = new Request('http://localhost/api/locations/cities?province_id=123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Database error' })
  })
})

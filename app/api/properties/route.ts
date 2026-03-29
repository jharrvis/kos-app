import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get('province_id')
  const cityId = searchParams.get('city_id')
  const status = searchParams.get('status') || 'published'

  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select(`
      *,
      provinces:province_id(id, name, slug),
      cities:city_id(id, name, slug, type)
    `)
    .eq('status', status)

  if (provinceId) {
    query = query.eq('province_id', provinceId)
  }

  if (cityId) {
    query = query.eq('city_id', cityId)
  }

  const { data: properties, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(properties)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'provider') {
    return NextResponse.json(
      { error: 'Only providers can create properties' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      address,
      province_id,
      city_id,
      latitude,
      longitude,
      price,
      room_type,
      capacity,
      facilities
    } = body

    if (!title || !address || !province_id || !city_id || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, province_id, city_id, price' },
        { status: 400 }
      )
    }

    const { data: provinceExists } = await supabase
      .from('provinces')
      .select('id')
      .eq('id', province_id)
      .single()

    if (!provinceExists) {
      return NextResponse.json({ error: 'Invalid province_id' }, { status: 422 })
    }

    const { data: cityExists } = await supabase
      .from('cities')
      .select('id, province_id')
      .eq('id', city_id)
      .single()

    if (!cityExists) {
      return NextResponse.json({ error: 'Invalid city_id' }, { status: 422 })
    }

    if (cityExists.province_id !== province_id) {
      return NextResponse.json(
        { error: 'City does not belong to the specified province' },
        { status: 422 }
      )
    }

    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        provider_id: session.user.id,
        title,
        description,
        address,
        province_id,
        city_id,
        latitude,
        longitude,
        price,
        room_type,
        capacity,
        facilities,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

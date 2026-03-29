import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get('province_id')

  if (!provinceId) {
    return NextResponse.json(
      { error: 'province_id query parameter is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name, slug, type')
    .eq('province_id', provinceId)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(cities)
}

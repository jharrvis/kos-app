import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from('properties')
    .select('provider_id')
    .eq('id', id)
    .single();

  if (!existing || existing.provider_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get body and validate
  const body = await request.json();
  const { title, description, address, province_id, city_id, latitude, longitude, price, room_type, capacity, facilities } = body;

  if (!title || !address || !province_id || !city_id || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate FK hierarchy (same as POST in route.ts)
  const { data: provinceExists } = await supabase.from('provinces').select('id').eq('id', province_id).single();
  if (!provinceExists) {
    return NextResponse.json({ error: 'Invalid province_id' }, { status: 422 });
  }

  const { data: cityExists } = await supabase.from('cities').select('id, province_id').eq('id', city_id).single();
  if (!cityExists || cityExists.province_id !== province_id) {
    return NextResponse.json({ error: 'Invalid city or hierarchy mismatch' }, { status: 422 });
  }

  // Update
  const { data: updated, error } = await supabase
    .from('properties')
    .update({ title, description, address, province_id, city_id, latitude, longitude, price, room_type, capacity, facilities })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from('properties')
    .select('provider_id')
    .eq('id', id)
    .single();

  if (!existing || existing.provider_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete (set status=archived) instead of hard delete
  const { error } = await supabase
    .from('properties')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
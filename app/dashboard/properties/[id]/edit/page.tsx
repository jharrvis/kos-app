import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import PropertyEditForm from './PropertyEditForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'provider') {
    redirect('/dashboard');
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      cities!inner(id, name, slug),
      provinces!inner(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !property) {
    notFound();
  }

  if (property.provider_id !== session.user.id) {
    redirect('/dashboard/properties');
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Property</h1>
      <PropertyEditForm property={property} />
    </div>
  );
}

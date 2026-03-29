import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

type Props = {
  params: { provinsi: string };
};

export default async function ProvincePage({ params }: Props) {
  const { provinsi } = params;
  const supabase = await createClient();

  // Fetch province and cities
  const { data: province, error: provinceError } = await supabase
    .from('provinces')
    .select('id, name')
    .eq('slug', provinsi)
    .single();

  if (provinceError || !province) {
    notFound();
  }

  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, slug, type')
    .eq('province_id', province.id)
    .order('name');

  if (citiesError) {
    console.error('Error fetching cities:', citiesError);
    return <p>Error loading cities</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Provinsi', href: '/provinsi' },
          { label: province.name, href: '#' },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4">{province.name}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cities?.map((city) => (
          <Link
            key={city.id}
            href={`/provinsi/${provinsi}/kota/${city.slug}`}
            className="block p-4 bg-white shadow rounded hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{city.name}</h2>
            <p className="text-sm text-gray-600">{city.type}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
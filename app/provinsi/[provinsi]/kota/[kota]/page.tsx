import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

type Props = {
  params: Promise<{ provinsi: string; kota: string }>;
};

export default async function CityPage({ params }: Props) {
  const { provinsi, kota } = await params;
  const supabase = await createClient();

  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id, name, type, provinces!inner(name, slug)')
    .eq('slug', kota)
    .single();

  if (cityError || !city) {
    notFound();
  }

  const province = Array.isArray(city.provinces) ? city.provinces[0] : city.provinces;
  if (!province || province.slug !== provinsi) {
    notFound();
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title, address, price, room_type')
    .eq('city_id', city.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    return <p>Error loading properties</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Provinsi', href: '/provinsi' },
            { label: province.name, href: `/provinsi/${provinsi}` },
            { label: city.name, href: '#' },
          ]}
        />
        <h1 className="text-3xl font-bold mt-6 mb-2">
          {city.name}
        </h1>
        <p className="text-gray-600 mb-6">
          {properties?.length || 0} properties available in {city.name}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties && properties.length > 0 ? (
            properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="block p-4 bg-white shadow rounded hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg font-semibold mb-2">{property.title}</h2>
                <p className="text-sm text-gray-600 mb-3">{property.address}</p>
                <div className="flex justify-between items-center">
                  <p className="text-blue-600 font-bold">
                    Rp {property.price.toLocaleString('id-ID')}
                  </p>
                  <span className="text-xs text-gray-500 capitalize">{property.room_type}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No properties available in {city.name} yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
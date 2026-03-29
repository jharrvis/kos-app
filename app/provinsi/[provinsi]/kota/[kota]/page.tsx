import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

type Props = {
  params: { provinsi: string; kota: string };
};

export default async function CityPage({ params }: Props) {
  const { provinsi, kota } = params;
  const supabase = await createClient();

  // Verify province and city slugs
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id, name, type, province:provinces(name, slug)')
    .eq('slug', kota)
    .single();

  if (cityError || !city || city.province.slug !== provinsi) {
    notFound();
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('city_id', city.id)
    .eq('status', 'published');

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    return <p>Error loading properties</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Provinsi', href: '/provinsi' },
          { label: city.province.name, href: `/provinsi/${provinsi}` },
          { label: city.name, href: '#' },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4">
        {city.name} ({city.type})
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {properties?.length ? (
          properties.map((property) => (
            <div
              key={property.id}
              className="block p-4 bg-white shadow rounded hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{property.name}</h2>
              <p className="text-sm text-gray-600">{property.address}</p>
            </div>
          ))
        ) : (
          <p>No properties available in this city.</p>
        )}
      </div>
    </main>
  );
}
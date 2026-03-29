import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import { auth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ContactProviderButton from './ContactProviderButton';
import PropertyMap from '@/components/PropertyMap';
import DeletePropertyButton from '@/app/dashboard/properties/DeletePropertyButton';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('title, description, cities!inner(name), provinces!inner(name)')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  const city = Array.isArray(property.cities) ? property.cities[0] : property.cities;
  const province = Array.isArray(property.provinces) ? property.provinces[0] : property.provinces;

  return {
    title: `${property.title} - ${city.name}`,
    description:
      property.description || `Property in ${city.name}, ${province.name}`,
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      provinces!inner(id, name, slug),
      cities!inner(id, name, slug),
      profiles!inner(id, name, email)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !property) {
    notFound();
  }

  const session = await auth();
  const isOwner = session?.user?.id === property.provider_id;

  const province = Array.isArray(property.provinces) ? property.provinces[0] : property.provinces;
  const city = Array.isArray(property.cities) ? property.cities[0] : property.cities;
  const profile = Array.isArray(property.profiles) ? property.profiles[0] : property.profiles;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Provinsi', href: '/provinsi' },
    { label: province.name, href: `/provinsi/${province.slug}` },
    { label: city.name, href: `/provinsi/${province.slug}/kota/${city.slug}` },
    { label: property.title, href: '#' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <div className="bg-gray-200 h-64 flex items-center justify-center">
            <p className="text-gray-500">Image gallery coming in future update</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <p className="text-gray-600">
                {city.name}, {province.name}
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-4">
                Rp {property.price.toLocaleString('id-ID')} / month
              </p>
            </div>

            {property.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Property Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Room Type</dt>
                  <dd className="text-gray-900 capitalize">{property.room_type}</dd>
                </div>
                {property.capacity && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                    <dd className="text-gray-900">{property.capacity} person(s)</dd>
                  </div>
                )}
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Full Address</dt>
                  <dd className="text-gray-900">{property.address}</dd>
                </div>
                {property.facilities && property.facilities.length > 0 && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Facilities</dt>
                    <dd className="flex flex-wrap gap-2">
                      {property.facilities.map((facility: string) => (
                        <span
                          key={facility}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize"
                        >
                          {facility}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Location</h2>
              {property.latitude && property.longitude ? (
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={property.title}
                  address={property.address}
                />
              ) : (
                <p className="text-gray-600">Coordinates not available</p>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <ContactProviderButton providerName={profile.name} />
              {isOwner && (
                <>
                  <Link
                    href={`/dashboard/properties/${id}/edit`}
                    className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Property
                  </Link>
                  <DeletePropertyButton propertyId={id} propertyTitle={property.title} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

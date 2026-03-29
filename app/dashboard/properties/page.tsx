import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeletePropertyButton from './DeletePropertyButton';

export default async function PropertiesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const supabase = await createClient();

  // Check if user is provider
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'provider') {
    redirect('/dashboard');
  }

  // Fetch provider's properties with location data
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id,
      title,
      address,
      price,
      status,
      cities!inner(id, name, slug),
      provinces!inner(id, name, slug)
    `)
    .eq('provider_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-600">Failed to load properties. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link
          href="/dashboard/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Property
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No properties found. Start by creating your first property listing.</p>
          <Link
            href="/dashboard/properties/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create New Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property: any) => (
            <div key={property.id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">{property.title}</h2>
              <p className="text-gray-600 text-sm mb-2">{property.address}</p>
              <p className="text-gray-700 mb-1">
                {property.cities.name}, {property.provinces.name}
              </p>
              <p className="text-lg font-bold text-blue-600 mb-2">
                Rp {property.price.toLocaleString('id-ID')} / month
              </p>
              <p className="text-sm mb-4">
                <span
                  className={`px-2 py-1 rounded ${
                    property.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {property.status}
                </span>
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/properties/${property.id}/edit`}
                  className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  Edit
                </Link>
                <DeletePropertyButton propertyId={property.id} propertyTitle={property.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

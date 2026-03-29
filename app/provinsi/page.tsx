import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ProvincesPage() {
  const supabase = await createClient();
  const { data: provinces, error } = await supabase
    .from('provinces')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Error fetching provinces:', error);
    return <p>Error loading provinces</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Provinces</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {provinces?.map((province) => (
          <Link
            key={province.id}
            href={`/provinsi/${province.slug}`}
            className="block p-4 bg-white shadow rounded hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{province.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}
import { createClient } from "@/lib/supabase/server";

export default async function FeaturedListingsPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      profiles!inner (full_name, email)
    `)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Properti Unggulan</h1>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Judul</th>
            <th className="border border-gray-300 p-2">Pemilik</th>
            <th className="border border-gray-300 p-2">Kota</th>
            <th className="border border-gray-300 p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {properties?.map((property) => (
            <tr key={property.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{property.title}</td>
              <td className="border border-gray-300 p-2">{property.profiles.email}</td>
              <td className="border border-gray-300 p-2">{property.city}</td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={async () => {
                    await fetch(`/api/properties/${property.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ is_featured: false }),
                    });
                  }}
                  className="text-red-600 hover:underline"
                >
                  Hapus Unggulan
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
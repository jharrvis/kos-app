import { createClient } from "@/lib/supabase/server";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_tiers (name, display_name, price),
      profiles!inner (full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelola Langganan</h1>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Pengguna</th>
            <th className="border border-gray-300 p-2">Paket</th>
            <th className="border border-gray-300 p-2">Status</th>
            <th className="border border-gray-300 p-2">Akhir Uji Coba</th>
            <th className="border border-gray-300 p-2">Akhir Periode</th>
            <th className="border border-gray-300 p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions?.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{sub.profiles.email}</td>
              <td className="border border-gray-300 p-2">{sub.subscription_tiers.display_name}</td>
              <td className="border border-gray-300 p-2">
                <span
                  className={`px-2 py-1 rounded text-white ${
                    sub.status === "trial"
                      ? "bg-yellow-500"
                      : sub.status === "active"
                      ? "bg-green-500"
                      : sub.status === "expired"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                >
                  {sub.status}
                </span>
              </td>
              <td className="border border-gray-300 p-2">
                {sub.trial_ends_at || "-"}
              </td>
              <td className="border border-gray-300 p-2">
                {sub.current_period_end}
              </td>
              <td className="border border-gray-300 p-2">
                <a
                  href={`/admin/subscriptions/${sub.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Detail
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
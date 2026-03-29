import { createClient } from "@/lib/supabase/server";
import { Payment } from "@/types/subscription";

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_tiers (name, display_name, price),
      profiles!inner (full_name, email),
      payments (*)
    `)
    .eq("id", id)
    .single();

  if (!subscription) {
    return <p>Subscription not found.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detail Langganan</h1>
      <div className="space-y-4">
        <p><strong>Pengguna:</strong> {subscription.profiles.email}</p>
        <p><strong>Paket:</strong> {subscription.subscription_tiers.display_name}</p>
        <p><strong>Status:</strong> {subscription.status}</p>
        <p><strong>Akhir Uji Coba:</strong> {subscription.trial_ends_at || "-"}</p>
        <p><strong>Akhir Periode:</strong> {subscription.current_period_end}</p>
      </div>
      <h2 className="text-xl font-semibold">Riwayat Pembayaran</h2>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Tanggal</th>
            <th className="border border-gray-300 p-2">Jumlah</th>
            <th className="border border-gray-300 p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscription.payments?.map((payment: Payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{payment.created_at}</td>
              <td className="border border-gray-300 p-2">{payment.amount}</td>
              <td className="border border-gray-300 p-2">{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
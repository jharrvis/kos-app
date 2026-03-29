import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TierCard from './TierCard'
import type { SubscriptionTier } from '@/types/subscription'

export default async function PricingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'provider') {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
          <p className="text-gray-600">Hanya penyedia kos yang dapat berlangganan paket premium.</p>
        </div>
      </main>
    )
  }

  const { data: tiers, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching subscription tiers:', error)
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">Gagal memuat data langganan. Silakan coba lagi.</p>
        </div>
      </main>
    )
  }

  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select('tier_id, status')
    .eq('user_id', session.user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pilih Paket Langganan</h1>
          <p className="text-gray-600">Tingkatkan bisnis kos Anda dengan paket yang sesuai</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers?.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier as SubscriptionTier}
              currentTierId={currentSubscription?.tier_id}
              currentStatus={currentSubscription?.status}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Perbandingan Fitur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Fitur</th>
                  <th className="text-center py-3 px-4">Free</th>
                  <th className="text-center py-3 px-4">Basic</th>
                  <th className="text-center py-3 px-4">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">Maksimal Properti</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">5</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Maksimal Foto per Properti</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">10</td>
                  <td className="text-center py-3 px-4">50</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Listing Unggulan</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Analitik</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Dukungan Prioritas</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SubscriptionDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      subscription_tiers (*)
    `)
    .eq('user_id', session.user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error)
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">Gagal memuat data langganan. Silakan coba lagi.</p>
        </div>
      </main>
    )
  }

  if (!subscription) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Langganan Anda</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">Anda belum memiliki paket langganan.</p>
            <Link 
              href="/langganan"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700"
            >
              Pilih Paket Langganan
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const tier = subscription.subscription_tiers

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('subscription_id', subscription.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      trial: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      trial: 'Uji Coba',
      active: 'Aktif',
      expired: 'Kedaluwarsa',
      cancelled: 'Dibatalkan',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const trialDaysLeft = subscription.trial_ends_at 
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Langganan Anda</h1>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{tier?.display_name}</h2>
              <div className="mb-2">{getStatusBadge(subscription.status)}</div>
              {subscription.status === 'trial' && trialDaysLeft !== null && (
                <p className="text-sm text-yellow-600 font-medium">
                  Masa uji coba berakhir dalam {trialDaysLeft} hari
                </p>
              )}
            </div>
            <div className="text-2xl font-bold mt-4 md:mt-0">
              {tier?.price === 0 ? 'Gratis' : `${formatCurrency(tier?.price || 0)}/bulan`}
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Periode Saat Ini</p>
                <p className="font-medium">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </p>
              </div>
              {subscription.trial_ends_at && subscription.status === 'trial' && (
                <div>
                  <p className="text-gray-500 mb-1">Uji Coba Berakhir</p>
                  <p className="font-medium">{formatDate(subscription.trial_ends_at)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <h3 className="font-semibold mb-3">Fitur Paket Anda</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {tier?.features.max_properties === null 
                  ? 'Properti unlimited' 
                  : `Maksimal ${tier?.features.max_properties} properti`}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Hingga {tier?.features.max_images_per_property} foto per properti
              </li>
              <li className="flex items-center">
                {tier?.features.featured_listing ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Listing unggulan
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400">Listing unggulan</span>
                  </>
                )}
              </li>
              <li className="flex items-center">
                {tier?.features.analytics ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Analitik properti
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400">Analitik properti</span>
                  </>
                )}
              </li>
              <li className="flex items-center">
                {tier?.features.priority_support ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Dukungan prioritas
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400">Dukungan prioritas</span>
                  </>
                )}
              </li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <Link
              href="/langganan"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Ubah Paket
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Riwayat Pembayaran</h2>
          
          {!payments || payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada riwayat pembayaran</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Tanggal</th>
                    <th className="text-left py-3 px-2">Jumlah</th>
                    <th className="text-left py-3 px-2">Metode</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-3 px-2">
                        {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                      </td>
                      <td className="py-3 px-2 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-2">{payment.payment_method || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status === 'paid' ? 'Berhasil' :
                           payment.status === 'pending' ? 'Menunggu' :
                           payment.status === 'failed' ? 'Gagal' :
                           payment.status === 'refunded' ? 'Dikembalikan' : payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
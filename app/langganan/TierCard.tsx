'use client'

import { useState } from 'react'
import type { SubscriptionTier } from '@/types/subscription'

interface TierCardProps {
  tier: SubscriptionTier
  currentTierId?: string
  currentStatus?: string
}

export default function TierCard({ tier, currentTierId, currentStatus }: TierCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCurrent = tier.id === currentTierId
  const isHigher = tier.price > 0 && (!currentTierId || tier.price > getCurrentPrice())
  const isLower = currentTierId && tier.price < getCurrentPrice()

  function getCurrentPrice(): number {
    return 0
  }

  async function handleSubscribe() {
    setLoading(true)
    setError('')

    try {
      const action = isLower ? 'downgrade' : 'upgrade'
      
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: tier.id, action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal melakukan langganan')
      }

      const data = await response.json()

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  function getButtonText() {
    if (isCurrent) {
      if (currentStatus === 'trial') return 'Paket Aktif (Uji Coba)'
      return 'Paket Saat Ini'
    }
    if (isLower) return 'Turunkan ke Paket Ini'
    return 'Pilih Paket'
  }

  function getButtonColor() {
    if (isCurrent) return 'bg-gray-400'
    if (tier.name === 'premium') return 'bg-indigo-600 hover:bg-indigo-700'
    if (tier.name === 'basic') return 'bg-blue-600 hover:bg-blue-700'
    return 'bg-green-600 hover:bg-green-700'
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${tier.name === 'premium' ? 'ring-2 ring-indigo-500' : ''}`}>
      {tier.name === 'premium' && (
        <div className="bg-indigo-500 text-white text-xs font-bold py-1 px-3 rounded-full inline-block mb-2">
          TERPOPULER
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-2">{tier.display_name}</h2>
      <p className="text-gray-600 mb-4 min-h-[3rem]">{tier.description}</p>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">
            {tier.price === 0 ? 'Gratis' : `Rp ${tier.price.toLocaleString('id-ID')}`}
          </span>
          {tier.price > 0 && <span className="text-gray-500 ml-2">/bulan</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6 text-sm">
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {tier.features.max_properties === null 
              ? 'Properti unlimited' 
              : `Maksimal ${tier.features.max_properties} properti`}
          </span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Hingga {tier.features.max_images_per_property} foto per properti</span>
        </li>
        <li className="flex items-start">
          {tier.features.featured_listing ? (
            <>
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Listing unggulan</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">Listing unggulan</span>
            </>
          )}
        </li>
        <li className="flex items-start">
          {tier.features.analytics ? (
            <>
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Analitik properti</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">Analitik properti</span>
            </>
          )}
        </li>
        <li className="flex items-start">
          {tier.features.priority_support ? (
            <>
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Dukungan prioritas</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">Dukungan prioritas</span>
            </>
          )}
        </li>
      </ul>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={isCurrent || loading}
        className={`w-full ${getButtonColor()} text-white py-3 px-4 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Memproses...' : getButtonText()}
      </button>
    </div>
  )
}

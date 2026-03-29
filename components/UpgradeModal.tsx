'use client';

import { useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTierId: string;
}

export default function UpgradeModal({ isOpen, onClose, currentTierId }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tiers = [
    { id: 'basic', name: 'Basic', price: 99000 },
    { id: 'premium', name: 'Premium', price: 299000 },
  ];

  const handleUpgrade = async (tierId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, action: 'upgrade' }),
      });

      if (response.ok) {
        const { paymentUrl } = await response.json();
        window.location.href = paymentUrl;
      } else {
        throw new Error('Gagal melakukan upgrade. Silakan coba lagi.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upgrade Langganan</h2>
        {tiers
          .filter((tier) => tier.id !== currentTierId)
          .map((tier) => (
            <div key={tier.id} className="mb-4">
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="text-gray-600">Rp {tier.price.toLocaleString('id-ID')}</p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Konfirmasi'}
              </button>
            </div>
          ))}
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <button
          className="mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          onClick={onClose}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
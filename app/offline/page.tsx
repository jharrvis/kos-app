'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto w-24 h-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tidak Ada Koneksi
        </h1>
        
        <p className="text-gray-600 mb-8">
          Anda sedang offline. Beberapa fitur mungkin tidak tersedia hingga koneksi internet kembali.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Tips Mode Offline
          </h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Halaman yang sudah pernah dibuka masih bisa diakses</li>
            <li>• Data properti tersimpan sementara di perangkat</li>
            <li>• Koneksi akan otomatis tersambung saat jaringan tersedia</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

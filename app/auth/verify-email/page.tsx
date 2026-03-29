'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type VerificationState = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<VerificationState>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setState('error')
      setErrorMessage('Verification token is missing')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setState('success')
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setState('error')
          setErrorMessage(data.error || 'Failed to verify email')
        }
      } catch (error) {
        setState('error')
        setErrorMessage('An unexpected error occurred')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {state === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Verifying your email...
            </h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="rounded-full h-16 w-16 bg-green-100 mx-auto flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Email Verified!</h2>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="rounded-full h-16 w-16 bg-red-100 mx-auto flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <Link
              href="/login"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Return to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

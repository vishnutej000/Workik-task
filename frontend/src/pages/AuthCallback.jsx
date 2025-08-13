import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleCallback } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [error, setError] = useState('')
  const [processed, setProcessed] = useState(false) // Prevent duplicate processing

  // Debug logging
  console.log('🔄 AuthCallback component mounted')
  console.log('📋 Search params:', Object.fromEntries(searchParams.entries()))

  useEffect(() => {
    // Prevent duplicate processing
    if (processed) {
      console.log('⏭️ Callback already processed, skipping...')
      return
    }

    const processCallback = async () => {
      console.log('🚀 Starting callback processing...')
      console.log('🌐 Current URL:', window.location.href)
      
      setProcessed(true) // Mark as processed immediately
      
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      console.log('📝 Callback params:', { 
        code: code ? code.substring(0, 10) + '...' : 'null', 
        state: state ? state.substring(0, 10) + '...' : 'null', 
        error 
      })

      if (error) {
        console.error('❌ GitHub OAuth error:', error)
        setStatus('error')
        setError(`GitHub OAuth error: ${error}`)
        return
      }

      if (!code) {
        console.error('❌ No authorization code received')
        setStatus('error')
        setError('No authorization code received from GitHub')
        return
      }

      try {
        console.log('📡 Calling handleCallback...')
        const result = await handleCallback(code, state)
        console.log('✅ Callback successful:', result)
        setStatus('success')
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          console.log('🏠 Redirecting to dashboard...')
          navigate('/dashboard')
        }, 2000)
      } catch (err) {
        console.error('❌ Callback processing failed:', err)
        console.error('Error details:', err.response?.data)
        setStatus('error')
        setError(
          err.response?.data?.detail || 
          err.message ||
          'Failed to complete GitHub authentication. Please try again.'
        )
      }
    }

    processCallback()
  }, [searchParams, handleCallback, navigate, processed])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="card text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing GitHub Login
              </h2>
              <p className="text-gray-600">
                Please wait while we authenticate your account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Login Successful!
              </h2>
              <p className="text-gray-600 mb-4">
                You have been successfully authenticated with GitHub.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to the home page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-red-600 mb-4">
                {error}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary w-full"
                >
                  Go to Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary w-full"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
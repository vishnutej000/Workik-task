import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { ENV } from '../config/env'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'))

  // Configure axios defaults
  useEffect(() => {
    if (sessionToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [sessionToken])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking auth status...', { sessionToken: sessionToken ? 'EXISTS' : 'MISSING' })
      
      if (sessionToken) {
        try {
          console.log('📡 Making auth check request...')
          const response = await axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.AUTH.USER}`)
          console.log('✅ Auth check successful:', response.data)
          setUser(response.data)
        } catch (error) {
          console.error('❌ Auth check failed:', error)
          console.error('Error response:', error.response?.data)
          
          // If session is invalid (401) or server error (500), clear the session
          if (error.response?.status === 401 || error.response?.status === 500) {
            console.log('🧹 Clearing invalid session...')
            logout()
          } else {
            // For network errors, don't logout but show as not authenticated
            setUser(null)
          }
        }
      } else {
        console.log('ℹ️ No session token found')
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async () => {
    try {
      const response = await axios.get(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.AUTH.GITHUB}`)
      window.location.href = response.data.auth_url
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const handleCallback = async (code, state) => {
    try {
      console.log('Processing callback with code:', code?.substring(0, 10) + '...')
      
      const response = await axios.post(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.AUTH.CALLBACK}`, {
        code,
        state
      })
      
      console.log('Callback response:', response.data)
      
      const { session_token, user: userData } = response.data
      setSessionToken(session_token)
      setUser(userData)
      localStorage.setItem('sessionToken', session_token)
      
      return userData
    } catch (error) {
      console.error('Callback failed:', error)
      console.error('Error details:', error.response?.data)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.AUTH.LOGOUT}`)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setSessionToken(null)
      localStorage.removeItem('sessionToken')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const value = {
    user,
    loading,
    sessionToken,
    login,
    logout,
    handleCallback,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

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

  const API_BASE_URL = 'http://localhost:8000'

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
      if (sessionToken) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/user`)
          setUser(response.data)
        } catch (error) {
          console.error('Auth check failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [sessionToken])

  const login = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/github`)
      window.location.href = response.data.auth_url
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const handleCallback = async (code, state) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/callback`, {
        code,
        state
      })
      
      const { session_token, user: userData } = response.data
      setSessionToken(session_token)
      setUser(userData)
      localStorage.setItem('sessionToken', session_token)
      
      return userData
    } catch (error) {
      console.error('Callback failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`)
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
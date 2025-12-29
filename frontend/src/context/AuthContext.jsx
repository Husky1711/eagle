import { createContext, useContext, useState, useEffect } from 'react'
import { adminAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('admin_token')
    if (token) {
      // Token exists, but verify it's still valid
      // For now, just set user from token (we could decode JWT)
      setUser({ username: 'admin' }) // Simplified - could decode JWT
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await adminAPI.login({ username, password })
      const { access_token, username: user } = response.data
      
      localStorage.setItem('admin_token', access_token)
      setUser({ username: user })
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      }
    }
  }

  const logout = async () => {
    try {
      await adminAPI.logout()
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('admin_token')
      setUser(null)
    }
  }

  const isAuthenticated = () => {
    return !!localStorage.getItem('admin_token')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


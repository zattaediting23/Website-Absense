import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const token = localStorage.getItem('absense_token')
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('absense_token')
    } finally { setLoading(false) }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('absense_token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    localStorage.setItem('absense_token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  function logout() {
    localStorage.removeItem('absense_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

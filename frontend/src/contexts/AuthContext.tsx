import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api, login as apiLogin, register as apiRegister } from '../lib/api'
import type { User } from '../lib/api'
import { ws } from '../lib/websocket'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = api.getToken()
    if (token) {
      // Connect WebSocket
      ws.connect(token)
      // TODO: Fetch user profile
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password)
    api.setToken(token)
    setUser(user)
    ws.connect(token)
  }

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    const { token, user } = await apiRegister(email, username, password, displayName)
    api.setToken(token)
    setUser(user)
    ws.connect(token)
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
    ws.disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import React, { createContext, useContext, useState } from 'react'
import axios from 'axios'

type AuthState = { accessToken: string | null, setAccessToken: (t: string | null) => void }
const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'))

  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }

  function setToken(t: string | null) {
    if (t) {
      localStorage.setItem('accessToken', t)
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
    } else {
      localStorage.removeItem('accessToken')
      delete axios.defaults.headers.common['Authorization']
    }
    setAccessToken(t)
  }

  return <AuthContext.Provider value={{ accessToken, setAccessToken: setToken }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

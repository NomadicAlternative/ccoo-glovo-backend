import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Trabajador {
  id: number
  nombre: string
  email: string
  telefono: string | null
  dni: string | null
  fecha_creacion: string
}

interface WorkerProfile {
  id: number
  email: string
  trabajador: Trabajador | null
}

interface WorkerAuthContextType {
  workerToken: string | null
  setWorkerToken: (token: string | null) => void
  workerProfile: WorkerProfile | null
  isLoading: boolean
  sessionExpired: boolean
}

const WorkerAuthContext = createContext<WorkerAuthContextType | undefined>(undefined)

export function WorkerAuthProvider({ children }: { children: React.ReactNode }) {
  const [workerToken, setWorkerTokenState] = useState<string | null>(() => {
    return localStorage.getItem('workerToken')
  })
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  const setWorkerToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('workerToken', token)
      setSessionExpired(false)
    } else {
      localStorage.removeItem('workerToken')
      setWorkerProfile(null)
    }
    setWorkerTokenState(token)
  }

  const checkTokenValidity = useCallback(async () => {
    if (!workerToken) return

    try {
      const res = await fetch('/api/workers/me', {
        headers: { Authorization: `Bearer ${workerToken}` }
      })

      if (!res.ok) {
        // Token expired or invalid
        setSessionExpired(true)
        setWorkerToken(null)
      }
    } catch (err) {
      console.error('Error checking token validity:', err)
    }
  }, [workerToken])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!workerToken) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch('/api/workers/me', {
          headers: { Authorization: `Bearer ${workerToken}` }
        })

        if (res.ok) {
          const data = await res.json()
          setWorkerProfile(data)
        } else {
          // Token invalid, clear it
          setSessionExpired(true)
          setWorkerToken(null)
        }
      } catch (err) {
        console.error('Error fetching worker profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [workerToken])

  // Check token validity every minute for early session expiry detection
  useEffect(() => {
    if (!workerToken) return

    const interval = setInterval(() => {
      checkTokenValidity()
    }, 60000) // Check every 60 seconds

    return () => clearInterval(interval)
  }, [workerToken, checkTokenValidity])

  return (
    <WorkerAuthContext.Provider value={{ workerToken, setWorkerToken, workerProfile, isLoading, sessionExpired }}>
      {children}
    </WorkerAuthContext.Provider>
  )
}

export function useWorkerAuth() {
  const ctx = useContext(WorkerAuthContext)
  if (!ctx) throw new Error('useWorkerAuth must be used within WorkerAuthProvider')
  return ctx
}

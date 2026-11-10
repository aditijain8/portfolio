import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, AUTH_EXPIRED_EVENT } from '../api/client'
import { adminApi } from '../api/endpoints'

interface AuthState {
  /** undefined while the session is being checked. */
  user: { email: string } | null | undefined
  expired: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(undefined)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    adminApi
      .me(controller.signal)
      .then(setUser)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setUser(null)
        if (e instanceof ApiError && e.status !== 401 && e.status !== 0) console.warn('Session check failed')
      })
    const onExpired = () => {
      setUser(null)
      setExpired(true)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => {
      controller.abort()
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await adminApi.login(email, password)
    setExpired(false)
    setUser(session)
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, expired, login, logout }), [user, expired, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

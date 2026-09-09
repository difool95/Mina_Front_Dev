import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { getSession, onAuthChange } from '@/services/auth.service'
import { ensureCustomer } from '@/services/customers.service'

interface AuthState {
  session: Session | null
  /** True until the stored session has been read, so nothing flashes signed-out. */
  loading: boolean
}

const AuthContext = createContext<AuthState>({ session: null, loading: true })

/**
 * Holds the Supabase session.
 *
 * The session itself is persisted by supabase-js in localStorage and recovered
 * from the magic-link URL on load, so there is no token handling here — we only
 * mirror it into React and make sure a `mega_customers` row exists.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true })

  useEffect(() => {
    let active = true

    void getSession()
      .then((session) => {
        if (active) setState({ session, loading: false })
      })
      .catch(() => {
        if (active) setState({ session: null, loading: false })
      })

    const unsubscribe = onAuthChange((session) => {
      if (active) setState({ session, loading: false })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const user = state.session?.user

  useEffect(() => {
    if (!user) return

    // A failure here must not block the signed-in UI — the row is bookkeeping,
    // not a precondition for using the app.
    void ensureCustomer(user).catch((error: unknown) => {
      console.error('Could not sync mega_customers row', error)
    })
  }, [user?.id])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

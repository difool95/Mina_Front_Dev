import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { listAccounts, rememberAccount } from '@/services/accounts.service'
import { getSession, onAuthChange } from '@/services/auth.service'
import type { SavedAccount } from '@/types/account.types'

interface AuthState {
  session: Session | null
  /** True until the stored session has been read, so nothing flashes signed-out. */
  loading: boolean
  /** Every account signed in on this browser, the active one included. */
  accounts: SavedAccount[]
}

const AuthContext = createContext<AuthState>({ session: null, loading: true, accounts: [] })

/**
 * Holds the Supabase session, and the list of accounts to switch between.
 *
 * The session itself is persisted by supabase-js in localStorage and recovered
 * from the magic-link URL on load, so there is no token handling here — we only
 * mirror it into React, and file each session away so it can be switched back
 * to. Account setup lives in `useAccountSetup`, because this provider wraps the
 * magic-link landing page too and would run it twice.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    loading: true,
    accounts: listAccounts(),
  })

  useEffect(() => {
    let active = true

    const apply = (session: Session | null) => {
      if (!active) return
      if (session) rememberAccount(session)
      setState({ session, loading: false, accounts: listAccounts() })
    }

    void getSession()
      .then(apply)
      .catch(() => apply(null))

    const unsubscribe = onAuthChange(apply)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

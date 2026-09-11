import type { Session } from '@supabase/supabase-js'
import { useEffect } from 'react'

import { grantSignupBonus } from '@/services/credits.service'
import { ensureCustomer } from '@/services/customers.service'

/**
 * Gives the signed-in user their `mega_customers` row and their free matchas.
 *
 * Deliberately not in AuthProvider: the magic link opens a second tab, and a
 * provider wrapping every page would run this in both at once — two requests
 * racing produced two `free_signup` rows. Only pages that are the real app
 * call this, and the magic-link landing page is not one of them.
 */
export function useAccountSetup(session: Session | null) {
  const user = session?.user
  const token = session?.access_token

  // Keyed on the user alone, so a token refresh does not run it again.
  useEffect(() => {
    if (!user || !token) return

    // Ordered, because the API credits an existing row rather than creating
    // one. Neither step gates the UI, so a failure only logs.
    void ensureCustomer(user)
      .then(() => grantSignupBonus(token))
      .catch((error: unknown) => {
        console.error('Could not set up the customer record', error)
      })
  }, [user?.id])
}

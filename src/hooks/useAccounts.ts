import { useMutation, useQueryClient } from '@tanstack/react-query'

import { signOutCurrentAccount, switchAccount } from '@/services/accounts.service'
import type { SavedAccount } from '@/types/account.types'

import type { Session } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { grantSignupBonus } from '@/services/credits.service'
import { ensureCustomer } from '@/services/customers.service'




//THIS METHOD IS CALLED WHEN A USER SIGNS UP OR LOGS IN. IT ENSURES THAT THE CUSTOMER RECORD EXISTS AND GRANTS THE SIGNUP BONUS IF APPLICABLE.
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


//THIS METHOD IS CALLED WHEN A USER SWITCHES ACCOUNTS. IT CLEARS THE REACT QUERY CACHE AND SWITCHES TO THE NEW ACCOUNT.
export function useSwitchAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (account: SavedAccount) => {
      queryClient.clear()
      await switchAccount(account)
    },
  })
}

//Logs out the active account and carries on as the next one, if any.
export function useSignOutAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (currentUserId: string) => {
      queryClient.clear()
      await signOutCurrentAccount(currentUserId)
    },
  })
}

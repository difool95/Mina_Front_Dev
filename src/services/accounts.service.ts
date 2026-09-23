import type { Session } from '@supabase/supabase-js'

import { MAX_ACCOUNTS } from '@/lib/constants'
import type { SavedAccount } from '@/types/account.types'

import { signOut } from './auth.service'
import { supabase } from './supabase.client'

// THIS IS THE KEY THAT IS USED TO STORE THE ACCOUNTS IN LOCAL STORAGE. IT IS USED IN THE listAccounts, saveAccounts, 
// rememberAccount, forgetAccount, switchAccount, and signOutCurrentAccount FUNCTIONS.
const STORAGE_KEY = 'mina-accounts'

// THIS METHOD IS LISTING THE ACCOUNTS FROM LOCAL STORAGE. IT RETURNS AN ARRAY OF SAVED ACCOUNTS.
export function listAccounts(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedAccount[]
  } catch {
    return []
  }
}

//THIS METHOD IS SAVING THE ACCOUNTS TO LOCAL STORAGE.
function saveAccounts(accounts: SavedAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    // Same as above: without storage there is just nothing to switch to.
  }
}

//THIS METHOD IS REMEMBERING THE ACCOUNT SESSION IN LOCAL STORAGE. IT CHECKS IF THE ACCOUNT ALREADY EXISTS, IF IT DOES,
//  IT UPDATES IT, IF NOT, IT ADDS IT. IT ALSO ENSURES THAT THE NUMBER OF ACCOUNTS DOES NOT EXCEED MAX_ACCOUNTS.
export function rememberAccount(session: Session) {
  const accounts = listAccounts()
  const account = {
    userId: session.user.id,
    email: session.user.email ?? '',
    refreshToken: session.refresh_token,
  }
  const index = accounts.findIndex((saved) => saved.userId === account.userId)
// THIS LINE IS FOR UPDATING THE ACCOUNT IN LOCAL STORAGE IF IT EXISTS OR ADDING IT IF IT DOESN'T. IT ALSO ENSURES THAT THE NUMBER OF ACCOUNTS DOES NOT EXCEED MAX_ACCOUNTS.
  if (index >= 0) accounts[index] = account
  else if (accounts.length < MAX_ACCOUNTS) accounts.push(account)

  saveAccounts(accounts)
}

// THIS METHOD IS FORGETTING THE ACCOUNT SESSION IN LOCAL STORAGE. IT REMOVES THE ACCOUNT WITH THE GIVEN USER ID FROM THE LIST OF SAVED ACCOUNTS.
export function forgetAccount(userId: string) {
  saveAccounts(listAccounts().filter((saved) => saved.userId !== userId))
}

// THIS METHOD IS SWITCHING TO THE ACCOUNT WITH THE GIVEN SAVED ACCOUNT. IT REFRESHES THE SESSION USING THE REFRESH TOKEN OF THE SAVED ACCOUNT. IF THERE IS AN ERROR,
//  IT FORGETS THE ACCOUNT AND THROWS AN ERROR.
export async function switchAccount(account: SavedAccount) {
  const { error } = await supabase.auth.refreshSession({ refresh_token: account.refreshToken })

  if (error) {
    forgetAccount(account.userId)
    throw new Error(`${account.email} was signed out — log in to it again.`)
  }
}

/** Logs out the active account only, then carries on as the next saved one. */
export async function signOutCurrentAccount(currentUserId: string) {
  forgetAccount(currentUserId)
  await signOut()

  const next = listAccounts()[0]
  if (next) await switchAccount(next)
}

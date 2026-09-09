import type { Session } from '@supabase/supabase-js'

import { supabase } from './supabase.client'

/**
 * Emails a magic link. Supabase creates the account if the address is new,
 * which is why the form promises the same mail will confirm it.
 *
 * `emailRedirectTo` must be listed under Auth → URL Configuration → Redirect
 * URLs in the Supabase dashboard, or the link lands on the site root without a
 * session.
 */
export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })

  if (error) throw new Error(error.message)
}

/**
 * Redirects to Google's OAuth consent screen. `redirectTo` must be listed
 * under Auth → URL Configuration → Redirect URLs in the Supabase dashboard,
 * same as the magic link above.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      // Always show Google's account chooser — without it Google silently
      // reuses the last identity, which breaks "Add another account".
      queryParams: { prompt: 'select_account' },
    },
  })

  if (error) throw new Error(error.message)
}

/**
 * Ends the session and clears the stored token. The auth listener in
 * AuthProvider picks this up, so callers do not need to reset anything.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw new Error(error.message)
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw new Error(error.message)

  return data.session
}

/** Fires on sign-in, sign-out and token refresh. Returns an unsubscribe. */
export function onAuthChange(listener: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session))

  return () => data.subscription.unsubscribe()
}

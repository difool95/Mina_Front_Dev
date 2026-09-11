import { Link } from 'react-router-dom'

import { MINA_LOGO_URL } from '@/lib/constants'
import { useAuth } from '@/providers/AuthProvider'

import './AuthCallbackPage.css'

/**
 * `/auth/callback` — where the magic link lands.
 *
 * Does no account setup on purpose. Opening the link creates a second tab, and
 * the tab that was already open picks the session up through supabase-js's
 * cross-tab sync and sets the account up there. This tab staying passive is
 * what stops the free matchas being granted twice.
 */
export function AuthCallbackPage() {
  const { session, loading } = useAuth()

  // Blank while the session is read, so the expired message never flashes.
  if (loading) return <div className="mina-callback" />

  return (
    <div className="mina-callback">
      <img className="mina-callback__logo" src={MINA_LOGO_URL} alt="Mina" />

      {session ? (
        <>
          <p className="mina-callback__title">You&rsquo;re signed in</p>
          <p className="mina-callback__note">
            Go back to the tab you started in to continue with Mina — it is already waiting for
            you.
          </p>
          <Link className="mina-callback__cta" to="/">
            Or continue here
          </Link>
        </>
      ) : (
        <>
          <p className="mina-callback__title">This link has expired</p>
          <p className="mina-callback__note">
            Sign-in links work once, and only for a short while. Ask for a fresh one to continue.
          </p>
          <Link className="mina-callback__cta" to="/">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  )
}

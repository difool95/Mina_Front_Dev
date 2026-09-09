import { useState } from 'react'

import { isValidEmail, webmailFor } from '@/lib/email'
import { sendMagicLink } from '@/services/auth.service'

import './LoginPanel.css'

type Status = 'idle' | 'sending' | 'sent'

/**
 * The login block on `/`: the Google/email choice, the email field, and the
 * "check your inbox" state after a magic link goes out.
 *
 * Both steps stay mounted and share one grid cell so switching never reflows
 * the block; the direction-specific timing lives in the CSS.
 */
export function LoginPanel() {
  const [emailStep, setEmailStep] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError(null)
    setStatus('sending')

    try {
      await sendMagicLink(email)
      setStatus('sent')
    } catch (cause) {
      setStatus('idle')
      setError(cause instanceof Error ? cause.message : 'Could not send the link. Try again.')
    }
  }

  const webmail = webmailFor(email)
  const typed = email.trim().length > 0

  return (
    <div className="mina-login">
      <div className="mina-login__choice" data-hidden={emailStep || undefined} inert={emailStep}>
        <button className="mina-login__cta" type="button">
          Login with Google
        </button>
        <button className="mina-login__alt" type="button" onClick={() => setEmailStep(true)}>
          Use email instead
        </button>
      </div>

      <div className="mina-login__email" data-hidden={!emailStep || undefined} inert={!emailStep}>
        <button
          className="mina-login__back"
          type="button"
          aria-label="Back"
          onClick={() => setEmailStep(false)}
        >
          ‹
        </button>

        {status === 'sent' ? (
          <div className="mina-login__sent">
            {/* Unrecognised domains get no deep link, so fall back to plain text. */}
            {webmail ? (
              <a
                className="mina-login__cta"
                href={webmail.url}
                target="_blank"
                rel="noreferrer"
              >
                Open {webmail.name}
              </a>
            ) : (
              <p className="mina-login__cta mina-login__cta--static">Check your inbox</p>
            )}
            <p className="mina-login__note">
              We&rsquo;ve sent a sign-in link to <strong>{email.trim()}</strong>. Open it to
              continue with Mina.
            </p>
          </div>
        ) : (
          <form
            className="mina-login__form"
            // Without this, `type="email"` makes the browser block submission
            // and show its own tooltip, so our red message never appears.
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <input
              className="mina-login__input"
              type="email"
              placeholder="Type email here"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
              }}
            />

            {/* Taken out of flow so revealing it cannot nudge the field off
                its centred position. */}
            <div className="mina-login__below">
              {error && <p className="mina-login__error">{error}</p>}

              {/* Revealed by the first character typed, hidden when cleared. */}
              <div className="mina-login__reveal" data-hidden={!typed || undefined} inert={!typed}>
                <button
                  className="mina-login__cta mina-login__reveal-text"
                  type="submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending link…' : 'Sign in'}
                </button>
                <p className="mina-login__note mina-login__reveal-text">
                  We&rsquo;ll email you a one-time link. If this address is new, that email will{' '}
                  also confirm your account.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

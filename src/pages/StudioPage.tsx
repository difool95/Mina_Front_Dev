import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAccountSetup } from '@/hooks/useAccountSetup'
import { CURATOR_COUNT_LABEL, MINA_LOGO_URL, WHATSAPP_HELP_URL } from '@/lib/constants'
import { useAuth } from '@/providers/AuthProvider'

import './StudioPage.css'

type Mode = 'create' | 'animate'

/**
 * `/` once signed in — the workspace itself.
 *
 * Presentation only for now: nothing here submits a prompt or uploads a file
 * yet, so the two panels are laid out and left inert.
 */
export function StudioPage() {
  const [mode, setMode] = useState<Mode>('animate')
  const { session } = useAuth()

  // The free matchas are granted here rather than in AuthProvider, so the
  // magic-link tab — which never reaches the studio — cannot grant them too.
  useAccountSetup(session)

  return (
    <div className="mina-studio">
      <section className="mina-studio__main">
        <header className="mina-studio__bar">
          <Link className="mina-studio__logo" to="/" aria-label="Mina home">
            <img src={MINA_LOGO_URL} alt="Mina" />
          </Link>

          <nav className="mina-studio__modes">
            <button
              className="mina-studio__mode"
              type="button"
              aria-current={mode === 'create'}
              onClick={() => setMode('create')}
            >
              Create
            </button>
            <button
              className="mina-studio__mode"
              type="button"
              aria-current={mode === 'animate'}
              onClick={() => setMode('animate')}
            >
              Animate
            </button>
          </nav>
        </header>

        <main className="mina-studio__prompt">
          <p className="mina-studio__brief">
            {mode === 'animate'
              ? 'Describe the motion, the sound and the scene'
              : 'Describe the image you want to create'}
          </p>
        </main>

        <footer className="mina-studio__footer">
          <span className="mina-studio__link mina-studio__link--current mina-studio__link--mobile">
            Studio
          </span>
          <Link className="mina-studio__link" to="/profile">
            Profile
          </Link>
          <button className="mina-studio__link mina-studio__link--desktop" type="button">
            Tutorials
          </button>
          <button className="mina-studio__link mina-studio__link--desktop" type="button">
            Matcha
          </button>
          <a
            className="mina-studio__link"
            href={WHATSAPP_HELP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Need help?
          </a>
          <span className="mina-studio__curators">{CURATOR_COUNT_LABEL}</span>
        </footer>
      </section>

      <section className="mina-studio__panel">
        <button className="mina-studio__upload" type="button">
          + Upload image or video
        </button>
      </section>
    </div>
  )
}

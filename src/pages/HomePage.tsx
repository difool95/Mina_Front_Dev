import { useState } from 'react'

import { Carousel } from '@/components/Carousel'
import { LegalPanel } from '@/components/LegalPanel'
import { LoginPanel } from '@/components/LoginPanel'
import { TutorialPanel } from '@/components/TutorialPanel'
import { useOnboardContent } from '@/hooks/useOnboardContent'
import { CURATOR_COUNT_LABEL, FOOTER_LINKS, MINA_LOGO_URL } from '@/lib/constants'
import { pickRow, pickRows } from '@/lib/onboardContent'

import './HomePage.css'

/**
 * `/` while signed out — the login block, the tutorial and the legal documents.
 * Signing in swaps this whole page for the studio; the route does not change.
 *
 * The four regions are siblings rather than nested panels, so one grid can
 * place them side by side on desktop and stack them bar/media/centre/footer on
 * mobile, where the carousel sits between the header and the login block.
 */
export function HomePage() {
  const [tutorialOpen, setTutorialOpen] = useState(false)
  // The `content_type` of the open legal panel, or null when closed.
  const [legal, setLegal] = useState<string | null>(null)
  const { data } = useOnboardContent()

  // `cta_label` holds two rows; `title` is the key that picks the right one.
  const tutorial = pickRow(data, 'cta_label', 'tutorial_button')
  const signUp = pickRow(data, 'cta_label', 'login_button')
  const legalRow = legal === null ? undefined : pickRow(data, legal)

  return (
    <div className="mina-home">
      <header className="mina-home__bar">
        {/* Reloads `/` outright rather than just resetting local state, so the
            logo always lands on a fresh home page. */}
        <button
          className="mina-home__logo"
          type="button"
          aria-label="Mina home"
          onClick={() => window.location.assign('/')}
        >
          <img src={MINA_LOGO_URL} alt="Mina" />
        </button>
        <button
          className="mina-home__tutorial"
          type="button"
          onClick={() => setTutorialOpen(true)}
        >
          {tutorial?.body ?? 'Tutorial'}
        </button>
      </header>

      <section className="mina-home__media">
        <Carousel media={pickRows(data, 'carousel_media')} />
      </section>

      <main className="mina-home__center">
        <LoginPanel />
      </main>

      <footer className="mina-home__footer">
        {FOOTER_LINKS.map((link) =>
          'href' in link ? (
            <a
              className="mina-home__footer-link"
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ) : (
            <button
              className="mina-home__footer-link"
              type="button"
              key={link.label}
              onClick={() => setLegal(link.contentType)}
            >
              {link.label}
            </button>
          ),
        )}
        <span className="mina-home__curators">{CURATOR_COUNT_LABEL}</span>
      </footer>

      {tutorialOpen && (
        <TutorialPanel
          signUpLabel={signUp?.body ?? 'Sign up'}
          onClose={() => setTutorialOpen(false)}
        />
      )}

      {legalRow && (
        <LegalPanel
          title={legalRow.title ?? ''}
          body={legalRow.body ?? ''}
          onClose={() => setLegal(null)}
        />
      )}
    </div>
  )
}

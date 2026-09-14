import { Link } from 'react-router-dom'

import { CURATOR_COUNT_LABEL, WHATSAPP_HELP_URL } from '@/lib/constants'

import './AppFooter.css'

interface AppFooterProps {
  /** Which destination to mark as the page you are already on. */
  current: 'studio' | 'profile'
  /** Profile has no footer on desktop — only phones get the nav bar there. */
  mobileOnly?: boolean
}

/**
 * The footer shared by the studio and the profile.
 *
 * Desktop and mobile show different entries from the same markup: phones get
 * a fixed bar with Studio / Profile / Need help?, while the studio's desktop
 * footer keeps Tutorials and Matcha instead of the Studio link.
 */
export function AppFooter({ current, mobileOnly }: AppFooterProps) {
  return (
    <footer className={`mina-appfooter${mobileOnly ? ' mina-appfooter--mobile-only' : ''}`}>
      <Link
        className="mina-appfooter__link mina-appfooter__link--mobile"
        to="/"
        aria-current={current === 'studio' ? 'page' : undefined}
      >
        Studio
      </Link>
      <Link
        className="mina-appfooter__link"
        to="/profile"
        aria-current={current === 'profile' ? 'page' : undefined}
      >
        Profile
      </Link>
      <button className="mina-appfooter__link mina-appfooter__link--desktop" type="button">
        Tutorials
      </button>
      <button className="mina-appfooter__link mina-appfooter__link--desktop" type="button">
        Matcha
      </button>
      <a
        className="mina-appfooter__link"
        href={WHATSAPP_HELP_URL}
        target="_blank"
        rel="noreferrer"
      >
        Need help?
      </a>
      <span className="mina-appfooter__curators">{CURATOR_COUNT_LABEL}</span>
    </footer>
  )
}

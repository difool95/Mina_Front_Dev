import { Link } from 'react-router-dom'

import { CURATOR_COUNT_LABEL, WHATSAPP_HELP_URL } from '@/lib/constants'

import './AppFooter.css'

interface AppFooterProps {
  /** Which destination to mark as the page you are already on. */
  current: 'studio' | 'profile'
  /** Profile has no footer on desktop — only phones get the nav bar there. */
  mobileOnly?: boolean
  /** The desktop-only Matcha entry, so only the studio passes it. */
  onOpenMatcha?: () => void
}

/**
 * The footer shared by the studio and the profile.
 *
 * Desktop and mobile show different entries from the same markup: phones get
 * a fixed bar with Studio / Profile / Need help?, while the studio's desktop
 * footer keeps Tutorials and Matcha instead of the Studio link.
 */
export function AppFooter({ current, mobileOnly, onOpenMatcha }: AppFooterProps) {
  const separator = (
    <span className="separator" aria-hidden="true">
      |
    </span>
  )

  return (
    <footer className={`mina-appfooter studio-footer${mobileOnly ? ' mina-appfooter--mobile-only' : ''}`}>
      <Link
        className={`mina-appfooter__link mina-appfooter__link--mobile button-footer${current === 'studio' ? ' is-active' : ''}`}
        to="/"
        aria-current={current === 'studio' ? 'page' : undefined}
      >
        Studio
        {separator}
      </Link>
      <Link
        className={`mina-appfooter__link button-footer${current === 'profile' ? ' is-active' : ''}`}
        to="/profile"
        aria-current={current === 'profile' ? 'page' : undefined}
      >
        Profile
        {separator}
      </Link>
      <button className="mina-appfooter__link mina-appfooter__link--desktop button-footer" type="button">
        Tutorials
        {separator}
      </button>
      <button
        className="mina-appfooter__link mina-appfooter__link--desktop button-footer"
        type="button"
        onClick={onOpenMatcha}
      >
        Matcha
        {separator}
      </button>
      <a
        className="mina-appfooter__link mina-appfooter__help button-footer"
        href={WHATSAPP_HELP_URL}
        target="_blank"
        rel="noreferrer"
      >
        Need help?
        {separator}
      </a>
      <span className="mina-appfooter__curators counter">{CURATOR_COUNT_LABEL}</span>
    </footer>
  )
}

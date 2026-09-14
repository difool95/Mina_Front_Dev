export const MINA_LOGO_URL =
  'https://assets.faltastudio.com/Website%20Assets/icons-library-mina-2026/mina-feutre-icon-128px.png'

export const TUTORIAL_VIDEO_URL =
  'https://assets.faltastudio.com/Website%20Assets/Content%20Creator%20Library/Tutorial%20Mina%20Square.mp4'

export const WHATSAPP_HELP_URL =
  'https://api.whatsapp.com/send/?phone=971522177594&text&type=phone_number&app_absent=0'

/**
 * Footer actions. Labels are static; `contentType` names the `onboard_content`
 * row whose `body` fills the legal panel, and `href` leaves the app instead.
 */
export const FOOTER_LINKS = [
  { label: 'Policies', contentType: 'legal_privacy' },
  { label: 'Terms', contentType: 'legal_terms' },
  { label: 'Refund', contentType: 'legal_refund' },
  { label: 'Need help?', href: WHATSAPP_HELP_URL },
] as const

export const CURATOR_COUNT_LABEL = '5.5k curators use Mina'

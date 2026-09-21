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

/**
 * The matcha packs on sale, cheapest first. The second is the one offered.
 *
 * **Every price is in pounds, and this is the only place they live.** What a
 * viewer is shown is this figure converted at the day's rate, so changing a
 * price means changing it here and nowhere else.
 *
 * `at` is where each sits along the slider, as a percentage. They are placed
 * by eye rather than by price or by even steps: the two smallest packs sit
 * close together at the left, and the middle of the track falls on 1500.
 */
export const MATCHA_PACKS = [
  { matchas: 100, gbp: 60, at: 0 },
  { matchas: 500, gbp: 300, at: 20 },
  { matchas: 1500, gbp: 900, at: 50 },
  { matchas: 5000, gbp: 2500, at: 100 },
] as const

export const DEFAULT_MATCHA_PACK = 500

/** What a generation costs, by what it is. One row of the pricing table each. */
export const MATCHA_RATES = [
  { kinds: ['1 Niche', '1 Creative', '1 Creative+'], matchas: 1 },
  { kinds: ['2s Director', '4s Quicks'], matchas: 2 },
  { kinds: ['1s 4K Director', '2s 4K Quicks'], matchas: 3 },
] as const

/** Where the price of a matcha goes, revealed by "Price Transparency". */
export const PRICE_BREAKDOWN =
  'Cost €35 - New features €14 - Marketing & Branding €14 - Profit €7'

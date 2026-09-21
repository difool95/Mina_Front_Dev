import type { Currency } from '@/types/currency.types'

/**
 * Zones outside `Europe/` that are still priced in euros — the Maghreb, and
 * the Atlantic islands that belong to Spain and Portugal.
 *
 * Add a zone here if one is ever found reading as dollars by mistake.
 */
const EURO_ZONES = [
  'Africa/Tunis',
  'Africa/Algiers',
  'Africa/Casablanca',
  'Africa/El_Aaiun',
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Asia/Nicosia',
]

/**
 * Which currency to price in, taken from the viewer's clock.
 *
 * The browser's IANA zone is already a region path, which is the shape these
 * rules take anyway — so there is no request to make, no permission to ask
 * for, and nothing to fall back to when the network is slow. A VPN or a
 * traveller's laptop can read the wrong country, which is the trade for not
 * geolocating anybody.
 */
export function currencyForClient(): Currency {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''

  // Britain first: London is a European zone, and would otherwise be euros.
  if (zone === 'Europe/London') return 'GBP'
  if (zone === 'Asia/Dubai') return 'AED'
  if (zone.startsWith('Europe/') || EURO_ZONES.includes(zone)) return 'EUR'

  return 'USD'
}

/**
 * Whole units only: matcha is never priced in fractions of one.
 *
 * Formatted in English rather than in the viewer's own locale, because the
 * rest of the panel is. Left to the locale, a French browser prices this in
 * "£GB" and "$US" and puts the symbol after the figure, which reads as a
 * different product to the one the design draws.
 */
export function formatMoney(amount: number, currency: Currency) {
  return (
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })
      .format(amount)
      // `Intl` joins a currency code to its figure with a non-breaking space,
      // so "AED 12,281" can never break — and on a phone it has to, or the
      // stops of the slider collide. Nothing here wraps unless it is asked to.
      .replace(/ /g, ' ')
  )
}

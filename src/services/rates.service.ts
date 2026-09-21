import type { Currency } from '@/types/currency.types'

/**
 * Live rates, from one pound to each currency Mina prices in.
 *
 * `open.er-api.com` needs no key and answers with CORS open, which is what
 * lets the browser ask it straight out — an exchange rate is neither a secret
 * of ours nor worth a hop through our own API.
 */
const RATES_URL = 'https://open.er-api.com/v6/latest/GBP'

export async function getRatesFromGbp(): Promise<Record<Currency, number>> {
  const response = await fetch(RATES_URL)

  if (!response.ok) throw new Error(`Could not read exchange rates (${response.status})`)

  const { rates } = (await response.json()) as { rates?: Partial<Record<Currency, number>> }

  // A price is money on screen, so a half-answered response is no answer:
  // better to throw and let the panel stay in pounds than to show a number
  // built from a rate that never arrived.
  if (!rates?.EUR || !rates.USD || !rates.AED) throw new Error('Exchange rates came back short')

  return { GBP: 1, EUR: rates.EUR, USD: rates.USD, AED: rates.AED }
}

import type { CreateCheckoutSessionResult } from '@/types/checkout.types'
import type { Currency } from '@/types/currency.types'

import { apiPost } from './api.client'

/** Starts a Stripe checkout for one matcha pack; resolves to its redirect URL. */
export function createCheckoutSession(token: string, matchas: number, currency: Currency) {
  return apiPost<CreateCheckoutSessionResult>('/api/checkout/session', token, { matchas, currency })
}

import type { CreateCheckoutSessionResult } from '@/types/checkout.types'
import type { Currency } from '@/types/currency.types'

import { apiPost } from './api.client'

/** Starts a Stripe checkout for one matcha pack; resolves to its redirect URL. */
export function createCheckoutSession(token: string, matchas: number, currency: Currency) {
  return apiPost<CreateCheckoutSessionResult>('/api/checkout/session', token, { matchas, currency })
}

/** A link to the signed-in user's Stripe billing portal, where their invoices are. */
export function createBillingPortalSession(token: string) {
  return apiPost<CreateCheckoutSessionResult>('/api/checkout/portal', token)
}

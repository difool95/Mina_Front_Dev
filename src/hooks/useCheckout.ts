import { useMutation } from '@tanstack/react-query'

import { createCheckoutSession } from '@/services/checkout.service'
import type { Currency } from '@/types/currency.types'

/** Starts a matcha purchase; the caller redirects to the URL it resolves to. */
export function useCheckout() {
  return useMutation({
    mutationFn: ({ token, matchas, currency }: { token: string; matchas: number; currency: Currency }) =>
      createCheckoutSession(token, matchas, currency),
  })
}

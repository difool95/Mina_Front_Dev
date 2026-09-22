import { useMutation } from '@tanstack/react-query'

import { createCheckoutSession } from '@/services/checkout.service'

/** Starts a matcha purchase; the caller redirects to the URL it resolves to. */
export function useCheckout() {
  return useMutation({
    mutationFn: ({ token, matchas }: { token: string; matchas: number }) =>
      createCheckoutSession(token, matchas),
  })
}

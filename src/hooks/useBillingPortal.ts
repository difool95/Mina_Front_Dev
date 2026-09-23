import { useMutation } from '@tanstack/react-query'

import { createBillingPortalSession } from '@/services/checkout.service'

/** Opens the user's invoices; the caller redirects to the URL it resolves to. */
export function useBillingPortal() {
  return useMutation({ mutationFn: createBillingPortalSession })
}

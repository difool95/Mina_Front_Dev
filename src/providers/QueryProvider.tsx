import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// The cache every query in the app shares, keyed by `lib/queryKeys`. Out here
// rather than in the component, which would empty it on every re-render. On
// its defaults: in memory only, so a refresh refetches everything.
const client = new QueryClient()

/** Wraps the app so anything inside it can reach that cache. */
export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

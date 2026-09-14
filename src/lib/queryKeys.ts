/** One place to build React Query keys, so an invalidation can never miss. */
export const queryKeys = {
  onboardContent: ['onboardContent'] as const,
  customer: (userId: string) => ['customer', userId] as const,
  generations: (userId: string) => ['generations', userId] as const,
}

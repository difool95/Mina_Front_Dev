/**
 * One place to build React Query keys, so an invalidation can never miss.
 *
 * A key addresses a slot in the cache: the same key is the same slot, shared
 * by every caller, and invalidating it matches exactly. The user id keeps one
 * account's slots out of the next one's.
 */
export const queryKeys = {
  onboardContent: ['onboardContent'] as const,
  customer: (userId: string) => ['customer', userId] as const,
  generations: (userId: string) => ['generations', userId] as const,
  likes: (userId: string) => ['likes', userId] as const,
  /** The same for everyone, so it takes no id. */
  rates: ['rates'] as const,
}

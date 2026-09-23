/** One account signed in on this browser, saved so it can be switched back to. */
export interface SavedAccount {
  userId: string
  email: string
  refreshToken: string
}

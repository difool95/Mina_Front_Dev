import type { SignupBonusResult } from '@/types/credit.types'

import { apiPost } from './api.client'

/**
 * Asks the API for the free matchas a new account is owed.
 *
 * Safe to call on every sign-in: the API grants them only if its ledger has no
 * `free_signup` entry for this user yet.
 */
export function grantSignupBonus(token: string) {
  console.log('grantSignupBonus');
  return apiPost<SignupBonusResult>('/api/credits/signup-bonus', token)
}

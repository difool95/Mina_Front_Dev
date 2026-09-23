export type CustomerRole = 'user' | 'business' | 'admin'

/** `mega_customers.mg_mma_preferences` — settings for the auto-refill cron to read. */
export interface MmaPreferences {
  autoRefill: {
    /** Matchas bought per refill, in units of 50 (100 matcha packs as 2, 500 as 10, 5000 as 100). */
    qty: number
    enabled: boolean
    /** Lowercase ISO code, e.g. `"eur"` — what the card gets charged in. */
    currency: string
    /** Refill once the balance drops below this many matchas. */
    threshold: number
    /** Refills done in the current monthly window; the cron resets it at `monthlyResetAt`. */
    monthlyCount: number
    /** Max refills this window allows, or `null` for no cap. */
    monthlyLimit: number | null
    /** One month on from the moment auto-refill was last turned on. */
    monthlyResetAt: string | null
    /** The raw monthly cap the user typed, in their own currency, or `null` for no cap. */
    monthlyLimitAmount: number | null
  }
}

export interface CreditLot {
  amount: number
  ref_id: string
  ref_type: 'free_signup' | 'stripe_checkout' | 'stripe_auto_refill'
  created_at: string
  expires_at: string
}

/** A row of the Supabase `mega_customers` table. */
export interface MegaCustomer {
  /** Always `pass:user:` followed by the Supabase auth uuid. */
  mg_pass_id: string
  mg_user_id: string
  mg_email: string
  mg_role: CustomerRole
  mg_shopify_customer_id: string | null
  mg_mma_preferences: MmaPreferences | null
  mg_mma_preferences_updated_at: string | null
  mg_created_at: string
  mg_updated_at: string
  mg_last_active: string | null
  mg_expires_at: string | null
  mg_credits: number
  mg_credit_lots: CreditLot[] | null
  mg_admin_allowlist: boolean
  mg_disabled: boolean
}

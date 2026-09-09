export type CustomerRole = 'user' | 'business' | 'admin'

/** A row of the Supabase `mega_customers` table. */
export interface MegaCustomer {
  /** Always `pass:user:` followed by the Supabase auth uuid. */
  mg_pass_id: string
  mg_user_id: string
  mg_email: string
  mg_role: CustomerRole
  mg_shopify_customer_id: string | null
  mg_mma_preferences: unknown
  mg_mma_preferences_updated_at: string | null
  mg_created_at: string
  mg_updated_at: string
  mg_last_active: string | null
  mg_expires_at: string | null
  mg_credits: number
  mg_credit_lots: unknown
  mg_admin_allowlist: boolean
  mg_disabled: boolean
}

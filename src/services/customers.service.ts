import type { User } from '@supabase/supabase-js'

import { supabase } from './supabase.client'

/**
 * Makes sure the signed-in user has a `mega_customers` row, then stamps them
 * as active.
 *
 * Written as select-then-write rather than `upsert` on purpose: an upsert needs
 * a unique constraint named in `onConflict`, and nothing in the schema we can
 * read confirms which column carries it. This works either way.
 *
 * Every other column is left to its database default, so credits, preferences
 * and credit lots are never overwritten on a returning sign-in.
 */
export async function ensureCustomer(user: User) {
  const now = new Date().toISOString()

  const { data: existing, error: lookupError } = await supabase
    .from('mega_customers')
    .select('mg_pass_id')
    .eq('mg_user_id', user.id)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)

  if (existing) {
    const { error } = await supabase
      .from('mega_customers')
      .update({ mg_last_active: now, mg_updated_at: now })
      .eq('mg_user_id', user.id)

    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase.from('mega_customers').insert({
    mg_pass_id: `pass:user:${user.id}`,
    mg_user_id: user.id,
    mg_email: user.email,
    mg_role: 'user',
    mg_created_at: now,
    mg_updated_at: now,
    mg_last_active: now,
  })

  if (error) throw new Error(error.message)
}

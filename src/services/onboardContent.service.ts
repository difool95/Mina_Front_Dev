import type { OnboardContent } from '@/types'

import { supabase } from './supabase.client'

/** Every active `onboard_content` row, ordered so callers can group by content_type. */
export async function getOnboardContent(): Promise<OnboardContent[]> {
  const { data, error } = await supabase
    .from('onboard_content')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return data
}

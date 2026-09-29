import type { CreatorLibraryItem } from '@/types'

import { supabase } from './supabase.client'

/** Every active `creators_library` picture, first `sort_order` first. */
export async function getCreatorLibrary(): Promise<CreatorLibraryItem[]> {
  const { data, error } = await supabase
    .from('creators_library')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return data
}

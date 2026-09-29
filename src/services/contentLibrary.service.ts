import type { ContentLibraryItem } from '@/types'

import { supabase } from './supabase.client'

/** Every active `content_library` template, first `sort_order` first. */
export async function getContentLibrary(): Promise<ContentLibraryItem[]> {
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return data
}

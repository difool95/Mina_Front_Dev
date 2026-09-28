import type { SceneLibraryItem } from '@/types'

import { supabase } from './supabase.client'

/** Every `scene_library` picture, first `sort_order` first. */
export async function getSceneLibrary(): Promise<SceneLibraryItem[]> {
  const { data, error } = await supabase
    .from('scene_library')
    .select('id, title, url, keywords, sort_order, created_at')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return data
}

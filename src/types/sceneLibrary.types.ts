/** A row of the Supabase `scene_library` table. */
export interface SceneLibraryItem {
  id: string
  title: string
  url: string
  keywords: string[] | null
  /** 1 to the last picture — the order the library shows them in. */
  sort_order: number
  created_at: string
}

/** `content_library.recreate` — the whole studio setup a template loads. */
export interface ContentLibraryRecreate {
  mode: string
  brief: string
  assets: {
    frame_urls?: string[]
    kling_start_image_url?: string
    frame_reference_image_urls?: string[]
  }
  settings: {
    video_lane: string
    aspect_ratio: string
    kling_quality: string
    generate_audio: boolean
    stylePresetKeys: string[]
    minaVisionEnabled: boolean
    motion_duration_sec: number
  }
}

/** A row of the Supabase `content_library` table. */
export interface ContentLibraryItem {
  id: string
  title: string
  /** The video itself. */
  url: string
  /** The still shown in place of the video until it is hovered. */
  thumbnail_url: string
  asset_ref: string | null
  content_type: 'Cinematic' | 'Motion' | 'Trend' | 'Commercial' | 'ASMR' | null
  keywords: string[] | null
  tags: string[] | null
  recreate: ContentLibraryRecreate | null
  /** 1 is the top of the list. */
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

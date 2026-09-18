/** The aspect ratios a creation can be rendered at, keyed off `mg_platform`. */
export type Ratio = '2:3' | '1:1' | '9:16' | '3:4'

/** What the archive filters are currently set to. `all` is each one's resting state. */
export type TimeFilter = 'all' | 'today' | '7d' | '30d'
export type ModeFilter = 'all' | 'motion' | 'still'
export type RatioFilter = 'all' | Ratio
export type ArchiveLayout = 'editorial' | 'library'

/** The slice of `mg_mma_vars` the archive reads — the rest of the blob is the studio's. */
export interface GenerationVars {
  /** `still` or `video`. Which lane and resolution key below apply hangs on it. */
  mode?: string
  inputs?: {
    brief?: string
    still_lane?: string
    video_lane?: string
    /** A still's resolution. A clip records its own under `mode`. */
    resolution?: string
    mode?: string
    aspect_ratio?: string
  }
  meta?: { billing?: { matchas?: number } }
}

/** A `mega_generations` row whose `mg_record_type` is `generation`. */
export interface MegaGeneration {
  mg_id: string
  mg_record_type: string
  mg_pass_id: string
  mg_generation_id: string | null
  /** `still` or `video`, though the casing in the table is not consistent. */
  mg_mma_mode: string | null
  mg_mma_status: string | null
  mg_status: string | null
  mg_mma_vars: GenerationVars | null
  mg_prompt: string | null
  mg_output_url: string | null
  mg_meta: unknown
  mg_created_at: string
  mg_updated_at: string
  mg_session_id: string | null
  /** `tiktok`, `print`, `square` or `instagram-post` — what the ratio is derived from. */
  mg_platform: string | null
  mg_title: string | null
  mg_type: string | null
  mg_cost_data: unknown
}

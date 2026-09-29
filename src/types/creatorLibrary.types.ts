/**
 * A row of the Supabase `creators_library` table — a creator picture, and the
 * description a generation leans on when it is used as a template.
 *
 * The `;`-separated text fields (`use_case`, `platform_fit`, `wardrobe_props`,
 * `visual_style`, `persona`) are kept as the table stores them.
 */
export interface CreatorLibraryItem {
  id: string
  title: string
  /** The picture itself. */
  url: string
  /** Stored the same as `url`. */
  thumbnail_url: string
  tags: string[] | null
  /** What the library's search matches against, besides the title. */
  keywords: string[] | null
  /** 1 is the top of the list. */
  sort_order: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  asset_ref: string | null
  category: string | null
  /** `non-binary` also covers a picture with two or more creators. */
  creator_gender: 'female' | 'male' | 'non-binary' | null
  apparent_age_range: string | null
  persona: string | null
  beauty: string | null
  tweak: string | null
  use_case: string | null
  platform_fit: string | null
  description: string | null
  setting: string | null
  wardrobe_props: string | null
  lighting: string | null
  visual_style: string | null
  brand_safety: string | null
  recommendation_score: number | null
  commercial_value: string | null
}

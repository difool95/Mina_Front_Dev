/** A row of the Supabase `onboard_content` table. */
export interface OnboardContent {
  id: string
  content_type: string
  title: string | null
  body: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  thumbnail: string | null
  sort_order: number | null
  alt_text: string | null
  slug: string | null
  is_active: boolean
  locale: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  seo_canonical_url: string | null
  og_image_url: string | null
  og_type: string | null
  structured_data: unknown
  created_at: string
  updated_at: string
}

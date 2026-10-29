/** What a brand memory is filed under. The scanner picks one; the user can change it. */
export type BrandMemoryCategory = 'logo' | 'illustration' | 'model' | 'product'

/** One picture of a brand memory. */
export interface BrandMemoryItem {
  url: string
  roles: string[]
  origin: 'upload'
  aliases: string[]
  has_face: boolean
  has_person: boolean
}

/** A brand memory's `mg_mma_vars`, written by the API's scanner and edited from the profile. */
export interface BrandMemoryVars {
  /** What the scanner saw: `product`, `model` or `design`. Unlike `category`, never edited. */
  kind: string
  name: string
  tags: string[]
  /** The pictures' URLs, the first being the cover. `source_urls` and `asset_items` follow it. */
  images: string[]
  origin: 'upload'
  aliases: string[]
  category: BrandMemoryCategory
  /** True once the scanner has read the picture. */
  scanning: boolean
  thumb_url: string
  use_count: number
  sort_order: number
  asset_items: BrandMemoryItem[]
  description: string
  source_urls: string[]
  last_used_at: string
  /** Whether Mina reads this memory when creating. */
  memory_enabled: boolean
}

/** A `mega_generations` row whose `mg_record_type` is `product`: one brand memory. */
export interface BrandMemory {
  mg_id: string
  /** The memory's name, kept beside `mg_mma_vars.name`. */
  mg_prompt: string
  mg_mma_vars: BrandMemoryVars
}

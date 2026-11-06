/** What a brand memory is filed under. The scanner picks one; the user can change it. */
export type BrandMemoryCategory = 'logo' | 'illustration' | 'model' | 'product'

/** How a brand memory was made: added by the user, or saved from a picture a Create used. */
export type BrandMemoryOrigin = 'upload' | 'create'

/** One picture of a brand memory. */
export interface BrandMemoryItem {
  url: string
  roles: string[]
  origin: BrandMemoryOrigin
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
  origin: BrandMemoryOrigin
  /** Only with `origin` "create": the upload its picture was copied from, so a later Create sending it again saves no second memory. */
  source_upload_url?: string
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

/**
 * A brand memory waiting under the bar for "Add": its pictures, and the name
 * the list shows. A picture from a CSV is its address, downloaded on "Add".
 */
export interface PendingBrandMemory {
  name: string
  files: (File | string)[]
}

/** A stretch of the brief, by character offsets: where a memory's full name was typed. */
export interface BriefRange {
  start: number
  end: number
}

//this is the type for the brand memory pictures that will be sent to the backend when creating a generation with brand memory
export interface PickedBrandMemoryPictures {
  id: string
  name: string
  category: BrandMemoryCategory
  images: string[]
}

/** A `mega_generations` row whose `mg_record_type` is `product`: one brand memory. */
export interface BrandMemory {
  mg_id: string
  /** The memory's name, kept beside `mg_mma_vars.name`. */
  mg_prompt: string
  mg_mma_vars: BrandMemoryVars
}

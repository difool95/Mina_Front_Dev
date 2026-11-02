import type { BrandMemoryCategory, BrandMemoryVars } from '@/types'

/** The categories the panel's dropdown offers, in its order. */
export const BRAND_MEMORY_CATEGORIES: { category: BrandMemoryCategory; label: string }[] = [
  { category: 'logo', label: 'Logo' },
  { category: 'illustration', label: 'Illustration' },
  { category: 'model', label: 'Model' },
  { category: 'product', label: 'Product' },
]

/** The most pictures one brand memory holds. */
export const BRAND_MEMORY_MAX_IMAGES = 5

/** The most brand memories one user can keep; the backend refuses any past it. */
export const BRAND_MEMORY_MAX = 1000;
/** Shown when hovering a memory in the bar. */
export const BRAND_MEMORY_TILE_TOOLTIP = 'Click to edit · long-press to select · drag to reorder'

/** Shown over the strip while pictures or folders are dragged onto it. */
export const BRAND_MEMORY_DROP_HINT =
  'Drop images, a folder, a .zip or a .csv — each folder (and sub-folder) becomes a product'

/** How long the studio's "Using" pill is held to turn brand memory off, or back on. */
export const BRAND_MEMORY_PILL_HOLD_MS = 500

/** Shown when hovering the studio's "Using" pill, on and off. */
export const BRAND_MEMORY_PILL_TOOLTIP = {
  on: 'Click to choose · Hold to turn brand memory off',
  off: 'Hold to turn brand memory on',
}

/**
 * How the studio brief guesses a brand memory from part of a word (lib/brandMemoryDetect).
 * A word counts once it has `minLetters`; each field it starts a word of
 * weighs its own, then the word's rarity among the memories multiplies it.
 */
export const BRAND_MEMORY_MATCH = {
  minLetters: 3,
  weights: { name: 6, category: 3, alias: 1.5, description: 1 },
  rarity: {
    /** Only one memory has the word. */
    single: 2,
    /** At most `rareShare` of them do. */
    rare: 1.5,
    rareShare: 0.2,
    /** At least `commonShare` of them do. */
    common: 0.5,
    commonShare: 0.5,
  },
}

/** Words too common to say which memory a brief means, left out of the brief and the descriptions. */
export const BRAND_MEMORY_STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet', 'of', 'in', 'on', 'at', 'to', 'for', 'from',
  'by', 'with', 'without', 'into', 'onto', 'over', 'under', 'about', 'above', 'below', 'between', 'through',
  'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had', 'do', 'does', 'did',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here', 'their', 'they', 'them', 'his', 'her',
  'our', 'your', 'my', 'me', 'we', 'you', 'he', 'she', 'who', 'which', 'what', 'when', 'where', 'how',
  'not', 'no', 'very', 'more', 'most', 'some', 'any', 'all', 'each', 'other', 'than', 'then', 'also',
  'just', 'only', 'can', 'will', 'would', 'should', 'could', 'may', 'might', 'one', 'two', 'like', 'make',
])

export const BRANDING_ASSETS_PANEL = {
  title: 'Branding Assets',
  subtitle: 'Save your models, products, design and all branding assets here',
  vision: 'Mina vision memory for this asset:',
}

/**
 * The memory with `urls` as its pictures, the first as cover. A picture added
 * after the scan takes the roles the scanner gave the first one.
 */
export function withImages(vars: BrandMemoryVars, urls: string[]): BrandMemoryVars {
  const roles = vars.asset_items[0]?.roles ?? []

  return {
    ...vars,
    images: urls,
    source_urls: urls,
    thumb_url: urls[0] ?? '',
    asset_items: urls.map(
      (url) =>
        vars.asset_items.find((item) => item.url === url) ?? {
          url,
          roles,
          origin: 'upload',
          aliases: [url],
          has_face: false,
          has_person: false,
        },
    ),
  }
}

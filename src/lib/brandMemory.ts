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

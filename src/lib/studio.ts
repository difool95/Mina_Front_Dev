import type { Ratio, UploadKind } from '@/types'

/** The three "+" pills, their hover tooltip, and what the upload row asks for under each. */
export const UPLOAD_KINDS: { kind: UploadKind; label: string; tooltip: string; title: string }[] = [
  {
    kind: 'scene',
    label: 'Scene',
    tooltip: 'Scene / Composition / Vibe',
    title: 'Add scene or inspiration',
  },
  {
    kind: 'logo',
    label: 'Logo',
    tooltip: 'Logo / Label / Icon / Text / Design',
    title: 'Add logo, label, icon, text, packaging or design',
  },
  {
    kind: 'product',
    label: 'Product',
    tooltip: 'Product / Element / Texture / Material',
    title: 'Add product, logo, elements, video, sound or references',
  },
]

/**
 * The ratio pill cycles through these in order, starting on the first. Held,
 * it flips to landscape: the same ratio turned on its side (9:16 → 16:9),
 * under `landscapeLabel`.
 */
export const STUDIO_RATIOS: { value: Ratio; label: string; landscapeLabel: string }[] = [
  { value: '9:16', label: 'Tiktok/Reel', landscapeLabel: 'Banner' },
  { value: '3:4', label: 'Post', landscapeLabel: 'Post' },
  { value: '2:3', label: 'Printing', landscapeLabel: 'Printing' },
  { value: '1:1', label: 'Square', landscapeLabel: 'Square' },
]

/** How long the ratio pill must be held to flip between portrait and landscape. */
export const RATIO_HOLD_MS = 500

/** Stand-ins for the library preview until the library itself exists. */
export const LIBRARY_PREVIEW_URLS = [
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405424955-mina-v3-15.png',
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405408382-mina-v3-3.png',
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405451406-mina-v3-51.png',
]

/** The scene library's filter pills. Each matches any picture whose title or keywords contain it. */
export const SCENE_LIBRARY_FILTERS = [
  'Artisan',
  'Fashion',
  'Perfumery',
  'Jewelry',
  'Beauty',
  'Body Care',
  'Model',
  'Product',
]

/** Pictures per row, each row closed by a rule. */
export const SCENE_LIBRARY_PER_ROW = 7

/** At most this many pictures are ever visible at once; the rest wait, hidden, to be hovered. */
export const SCENE_LIBRARY_MAX_VISIBLE = 35

/** How long a hovered picture stays in before others fade out to bring the count back down. */
export const SCENE_LIBRARY_HIDE_DELAY_MS = 2500

export const BRIEF_MAX_LENGTH = 10000

/** The brief keeps its full type size up to this many characters. */
export const BRIEF_SHRINK_FROM = 700

/** Past that, the type loses 1px for every this many characters, down to its floor. */
export const BRIEF_CHARS_PER_PX = 40

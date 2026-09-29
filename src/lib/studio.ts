import type { Ratio, StudioMode, UploadKind } from '@/types'

/** The brief's placeholder, per mode. */
export const BRIEF_PLACEHOLDERS: Record<StudioMode, string> = {
  create: 'Describe how you want your image',
  animate: 'Describe the motion, the sound and the scene',
}

/** The block's call to action, per mode. */
export const STUDIO_CTA_LABELS: Record<StudioMode, string> = {
  create: 'Create',
  animate: 'Animate',
}

/** The content library card's three pictures, fixed until the library itself exists. */
export const CONTENT_LIBRARY_PREVIEW_URLS = [
  'https://assets.faltastudio.com/content-library/poster/1785260127843_0.jpg',
  'https://assets.faltastudio.com/content-library/poster/1787898109500_0.jpg',
  'https://assets.faltastudio.com/content-library/poster/1785260080944_0.jpg',
]

/** Animate mode's single upload row, with the content library beside its "+". */
export const ANIMATE_UPLOAD_TITLE = 'Add model, product, elements, video, sound or references'

/** The resolution pill toggles between these two. */
export const ANIMATE_RESOLUTIONS = ['720p', '1080p'] as const

/** The duration pill cycles through these in order. */
export const ANIMATE_DURATIONS = ['5s', '10s', '15s', '30s'] as const

/** What a Director animation costs in matcha, by resolution and duration. */
export const ANIMATE_MATCHA_COST: Record<
  (typeof ANIMATE_RESOLUTIONS)[number],
  Record<(typeof ANIMATE_DURATIONS)[number], number>
> = {
  '720p': { '5s': 5, '10s': 9, '15s': 15, '30s': 24 },
  '1080p': { '5s': 10, '10s': 18, '15s': 30, '30s': 54 },
}

/** Up to `count` items of `list`, picked at random. */
export function pickRandom<T>(list: readonly T[], count: number) {
  return [...list].sort(() => Math.random() - 0.5).slice(0, count)
}

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

/** Both libraries: pictures per row, each row closed by a rule. */
export const LIBRARY_PER_ROW = 7

/** At most this many pictures are ever visible at once; the rest wait, hidden, to be hovered. */
export const SCENE_LIBRARY_MAX_VISIBLE = 35

export const CONTENT_LIBRARY_MAX_VISIBLE = 11

export const CREATOR_LIBRARY_MAX_VISIBLE = 28


/**
 * A library's list before its query has data. One shared array, not a fresh
 * `[]` each render: the libraries re-deal which items are visible whenever the
 * list changes identity, and a new empty list every render would loop.
 */
export const NO_LIBRARY_ITEMS: never[] = []

/** The CSS width a library's large preview is asked for at: its column's size, so it stays sharp there. */
export const libraryPreviewWidth = () => Math.max(window.innerWidth * 0.3, window.innerHeight * 0.75)

/** How long a hovered picture stays in before others fade out to bring the count back down. */
export const LIBRARY_HIDE_DELAY_MS = 2500

export const BRIEF_MAX_LENGTH = 10000

/** The brief keeps its full type size up to this many characters. */
export const BRIEF_SHRINK_FROM = 700

/** Past that, the type loses 1px for every this many characters, down to its floor. */
export const BRIEF_CHARS_PER_PX = 40

import type { Ratio, UploadKind } from '@/types'

/** The three "+" pills, and what the upload row asks for under each. */
export const UPLOAD_KINDS: { kind: UploadKind; label: string; title: string }[] = [
  { kind: 'scene', label: 'Scene', title: 'Add scene or inspiration' },
  { kind: 'logo', label: 'Logo', title: 'Add logo, label, icon, text, packaging or design' },
  { kind: 'product', label: 'Product', title: 'Add product, logo, elements, video, sound or references' },
]

/** The ratio pill cycles through these in order, starting on the first. */
export const STUDIO_RATIOS: { value: Ratio; label: string }[] = [
  { value: '9:16', label: 'Tiktok/Reel' },
  { value: '3:4', label: 'Post' },
  { value: '2:3', label: 'Printing' },
  { value: '1:1', label: 'Square' },
]

/** Stand-ins for the library preview until the library itself exists. */
export const LIBRARY_PREVIEW_URLS = [
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405424955-mina-v3-15.png',
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405408382-mina-v3-3.png',
  'https://assets.faltastudio.com/Website%20Assets/Login%20Carousel/1784405451406-mina-v3-51.png',
]

export const BRIEF_MAX_LENGTH = 10000

/** The brief keeps its full type size up to this many characters. */
export const BRIEF_SHRINK_FROM = 700

/** Past that, the type loses 1px for every this many characters, down to its floor. */
export const BRIEF_CHARS_PER_PX = 40

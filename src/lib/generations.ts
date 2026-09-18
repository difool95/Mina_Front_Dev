import type {
  MegaGeneration,
  ModeFilter,
  Ratio,
  RatioFilter,
  TimeFilter,
} from '@/types/generation.types'

/**
 * Each filter button steps through its list and wraps back to the first entry,
 * which is always the unfiltered state.
 */
export const TIME_FILTERS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
] as const satisfies readonly { value: TimeFilter; label: string }[]

export const MODE_FILTERS = [
  { value: 'all', label: 'Show all' },
  { value: 'motion', label: 'Motion' },
  { value: 'still', label: 'Still' },
] as const satisfies readonly { value: ModeFilter; label: string }[]

export const RATIO_FILTERS = [
  { value: 'all', label: 'Ratio' },
  { value: '2:3', label: '2:3' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '3:4', label: '3:4' },
] as const satisfies readonly { value: RatioFilter; label: string }[]

/** The platform a creation was made for is what fixes its shape. */
const RATIO_BY_PLATFORM: Record<string, Ratio> = {
  tiktok: '9:16',
  print: '2:3',
  square: '1:1',
  'instagram-post': '3:4',
}

/** How many days back each time filter reaches. `all` reaches forever. */
const DAYS_BACK: Record<Exclude<TimeFilter, 'all' | 'today'>, number> = {
  '7d': 7,
  '30d': 30,
}

export function nextFilter<T>(options: readonly { value: T }[], current: T): T {
  const index = options.findIndex((option) => option.value === current)

  return options[(index + 1) % options.length]!.value
}

export function labelFor<T>(options: readonly { value: T; label: string }[], current: T) {
  return options.find((option) => option.value === current)?.label ?? ''
}

export function ratioOf(generation: MegaGeneration) {
  return RATIO_BY_PLATFORM[generation.mg_platform ?? '']
}

export function isMotion(generation: MegaGeneration) {
  return generation.mg_mma_mode?.toLowerCase() === 'video'
}

/** The brief the user typed, buried in the studio's own blob of inputs. */
export function promptOf(generation: MegaGeneration) {
  return generation.mg_mma_vars?.inputs?.brief ?? generation.mg_prompt ?? ''
}

/**
 * The settings a creation was made with, read out of the same blob.
 *
 * Which key holds what depends on the lane: a still takes its lane from
 * `still_lane` and its resolution from `resolution`, a clip takes them from
 * `video_lane` and `mode`.
 */
export function detailsOf(generation: MegaGeneration) {
  const vars = generation.mg_mma_vars
  const inputs = vars?.inputs
  const still = vars?.mode === 'still'

  return {
    type: vars?.mode ?? '',
    mode: (still ? inputs?.still_lane : inputs?.video_lane) ?? '',
    resolution: (still ? inputs?.resolution : inputs?.mode) ?? '',
    ratio: inputs?.aspect_ratio ?? '',
    // Creations made before billing was recorded all cost exactly one.
    matchas: vars?.meta?.billing?.matchas ?? 1,
  }
}

/**
 * The shareable link to a creation — the app's own viewer route carrying the
 * media URL, rather than the raw asset URL.
 *
 * The URL is percent-encoded, so an asset URL that itself contains `&` or `?`
 * survives being read back out of the query string.
 */
export function viewerLinkFor(generation: MegaGeneration) {
  return `${window.location.origin}/v?u=${encodeURIComponent(generation.mg_output_url ?? '')}`
}


// ALL THE CODE OF EDITORIAL LAYOUT STARTS HERE.

/**
 * Creations per editorial row: five single-width and one double, which is
 * exactly the seven columns the grid is cut into.
 */
const PER_ROW = 6

/**
 * The frames a single-width creation can sit in, as CSS `aspect-ratio` values.
 *
 * The media's own shape is ignored on purpose — the frame is chosen for the
 * grid, and whatever goes in it is cropped to fill.
 */
const RATIOS = ['2 / 3', '1 / 1'] as const

/** The double-width one is square or landscape, never tall. */
const WIDE_RATIOS = ['1 / 1', '16 / 9'] as const

/** The frame most of a row is built from — four of the five singles carry it. */
const HOUSE_RATIO = '2 / 3'
const HOUSE_PER_ROW = 4

/** No row drops more than three of its creations. */
const MAX_OFFSETS = 3

/**
 * Slack a row above must leave, in column widths, before anything rises into
 * it, and the most of that slack a creation will take.
 *
 * Both are deliberately shy of the space actually available: the heights below
 * ignore the grid gap and the bar and caption around each frame, so the margin
 * left over is what guarantees nothing ever touches.
 */
const RISE_THRESHOLD = 0.45
const RISE_TAKE = 0.4
const RISE_CAP = 0.3

/**
 * A number in [0, 1) fixed for a given position and salt.
 *
 * Keyed off the position in the list rather than the creation, so the shape of
 * the grid stays put while the creations flowing through it change. Hashed
 * rather than a plain `index % n`, which would band the grid diagonally.
 */
function seeded(index: number, salt: number) {
  return ((Math.imul(index + salt, 2654435761) >>> 0) % 1024) / 1024
}

/** Which slots of a row hang low — between one and three, always the same ones. */
function offsetSlots(row: number) {
  const count = 1 + Math.floor(seeded(row, 11) * MAX_OFFSETS)

  return Array.from({ length: PER_ROW }, (_, slot) => ({
    slot,
    rank: seeded(row * PER_ROW + slot, 13),
  }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map((entry) => entry.slot)
}

interface Frame {
  ratio: string
  span: number
  /** Columns the frame occupies, as a half-open range. */
  start: number
  end: number
  /** How tall it stands, in column widths. */
  height: number
}

/** A frame's height in column widths — its span divided by its width ÷ height. */
function frameHeight(ratio: string, span: number) {
  const [width, height] = ratio.split(' / ').map(Number)

  return (span * height!) / width!
}

/**
 * The whole row laid out: which slot runs double, what each frame is, and the
 * columns it covers.
 *
 * Four of the five single-width slots carry the house ratio; the one left over
 * is free to be anything, which is what keeps a row from reading as a set.
 */
function rowLayout(row: number): Frame[] {
  const wide = Math.floor(seeded(row, 5) * PER_ROW)
  const wideRatio = WIDE_RATIOS[Math.floor(seeded(row, 7) * WIDE_RATIOS.length)]!

  const free = Array.from({ length: PER_ROW }, (_, slot) => slot)
    .filter((slot) => slot !== wide)
    .map((slot) => ({ slot, rank: seeded(row * PER_ROW + slot, 23) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(HOUSE_PER_ROW)
    .map((entry) => entry.slot)

  let column = 0

  return Array.from({ length: PER_ROW }, (_, slot) => {
    const span = slot === wide ? 2 : 1
    const ratio =
      slot === wide
        ? wideRatio
        : free.includes(slot)
          ? RATIOS[Math.floor(seeded(row * PER_ROW + slot, 1) * RATIOS.length)]!
          : HOUSE_RATIO

    const frame = {
      ratio,
      span,
      start: column,
      end: column + span,
      height: frameHeight(ratio, span),
    }

    column += span

    return frame
  })
}

/**
 * How far a frame can climb into the row above, in column widths.
 *
 * A grid row is as tall as its tallest frame, so every shorter frame leaves
 * empty space beneath it. A frame may rise into that space only as far as the
 * shortest of the frames directly over its own columns allows, which is what
 * keeps it clear of them.
 */
function riseFor(row: number, frame: Frame) {
  if (row === 0) return 0

  const above = rowLayout(row - 1)
  const rowHeight = Math.max(...above.map((other) => other.height))
  const overhead = Math.max(
    ...above
      .filter((other) => other.start < frame.end && other.end > frame.start)
      .map((other) => other.height),
  )

  const slack = rowHeight - overhead

  return slack < RISE_THRESHOLD ? 0 : Math.min(RISE_CAP, slack * RISE_TAKE)
}

/**
 * How the creation at `index` sits in the editorial grid: the frame it fills,
 * how many columns it runs, and how far it hangs below the top of its row.
 *
 * Everything is a function of the position alone, so a given slot always looks
 * the same and nothing shifts on a re-render. Each row gets exactly one
 * double-width creation, and every creation in a row that hangs, hangs by the
 * same amount — a row of differing drops reads as a mistake rather than a
 * composition.
 */
export function editorialPlacement(index: number) {
  const row = Math.floor(index / PER_ROW)
  const slot = index % PER_ROW
  const frame = rowLayout(row)[slot]!
  // The opening row sits flush, so the archive starts on a clean line.
  const hangs = row > 0 && offsetSlots(row).includes(slot)
  const rise = hangs ? 0 : riseFor(row, frame)

  return {
    ratio: frame.ratio,
    span: frame.span,
    // Either sign, as a CSS length. The rise is a percentage because a grid
    // item's percentage margins resolve against its own grid area's width —
    // which is exactly the column widths `riseFor` counts in.
    offset: hangs
      ? `${30 + Math.round(seeded(row, 17) * 70)}px`
      : rise > 0
        ? `-${((rise / frame.span) * 100).toFixed(2)}%`
        : '0',
  }
}

// ALL THE CODE OF EDITORIAL LAYOUT ENDS HERE.

/** What a downloaded creation is called on disk. */
export function filenameOf(generation: MegaGeneration) {
  const fromUrl = generation.mg_output_url?.split('?')[0]?.split('/').pop()

  return fromUrl || `${generation.mg_generation_id ?? generation.mg_id}.file`
}

function isWithin(generation: MegaGeneration, time: TimeFilter, now: Date) {
  if (time === 'all') return true

  const createdAt = new Date(generation.mg_created_at)

  if (time === 'today') return createdAt.toDateString() === now.toDateString()

  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - DAYS_BACK[time])

  return createdAt >= cutoff
}

export function filterGenerations(
  generations: MegaGeneration[],
  filters: {
    time: TimeFilter
    mode: ModeFilter
    ratio: RatioFilter
    /** The creations to keep, or null while the Liked filter is off. */
    likedIds: Set<string> | null
  },
  now = new Date(),
) {
  return generations.filter((generation) => {
    if (!isWithin(generation, filters.time, now)) return false

    if (filters.mode !== 'all' && isMotion(generation) !== (filters.mode === 'motion')) return false

    if (filters.likedIds && !filters.likedIds.has(generation.mg_generation_id ?? '')) return false

    return filters.ratio === 'all' || ratioOf(generation) === filters.ratio
  })
}

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

/** A CSS `aspect-ratio` value. Unknown platforms fall back to a square. */
export function aspectRatioOf(generation: MegaGeneration) {
  return (ratioOf(generation) ?? '1:1').replace(':', ' / ')
}

export function isMotion(generation: MegaGeneration) {
  return generation.mg_mma_mode?.toLowerCase() === 'video'
}

/** The brief the user typed, buried in the studio's own blob of inputs. */
export function promptOf(generation: MegaGeneration) {
  return generation.mg_mma_vars?.inputs?.brief ?? generation.mg_prompt ?? ''
}

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
  filters: { time: TimeFilter; mode: ModeFilter; ratio: RatioFilter },
  now = new Date(),
) {
  return generations.filter((generation) => {
    if (!isWithin(generation, filters.time, now)) return false

    if (filters.mode !== 'all' && isMotion(generation) !== (filters.mode === 'motion')) return false

    return filters.ratio === 'all' || ratioOf(generation) === filters.ratio
  })
}

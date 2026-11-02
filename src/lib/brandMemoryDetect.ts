import { BRAND_MEMORY_CATEGORIES, BRAND_MEMORY_MATCH, BRAND_MEMORY_STOP_WORDS } from '@/lib/brandMemory'
import type { BrandMemory, BriefRange } from '@/types'

// Which brand memories the studio brief means, worked out locally from the
// cached list as the user types.
//
// 1. Exact: a memory's full name typed as whole words attaches it (and is drawn
//    purple), then a full alias does. Every exact match attaches.
// 2. Guess: only when nothing exact was typed, the single best memory by score,
//    each brief word adding the weight of the best field it starts a word of,
//    times how rare that word is among the memories.
//
// Only enabled memories the user hasn't dismissed are read here; one picked
// by hand from the pill's list attaches whatever its state.

type Field = keyof typeof BRAND_MEMORY_MATCH.weights

/** A text's words, lowercased: runs of letters and digits, so "Assets 6-1" is assets, 6, 1. */
function words(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
}

/** Long enough and not a stop word: a word that can say which memory is meant. */
const isTelling = (word: string) =>
  word.length >= BRAND_MEMORY_MATCH.minLetters && !BRAND_MEMORY_STOP_WORDS.has(word)

const overlaps = (a: BriefRange, b: BriefRange) => a.start < b.end && b.start < a.end

/**
 * Where `phrase` stands in `text` as whole words, in any case and with
 * anything but letters or digits between its words.
 */
function findPhrase(text: string, phrase: string): BriefRange[] {
  const phraseWords = words(phrase)
  if (phraseWords.length === 0) return []

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${phraseWords.join('[^\\p{L}\\p{N}]+')}(?![\\p{L}\\p{N}])`,
    'giu',
  )

  return [...text.matchAll(pattern)].map((match) => ({ start: match.index, end: match.index + match[0].length }))
}

/**
 * The memories whose full name or alias is typed in `text`: names first, then
 * aliases. A typed phrase that is one memory's name and another's alias goes
 * to the name. Returns the ranges of the names, which the brief draws purple.
 */
function exactMatches(text: string, candidates: BrandMemory[]) {
  const ids: string[] = []
  const nameRanges: BriefRange[] = []

  for (const memory of candidates) {
    const ranges = findPhrase(text, memory.mg_mma_vars.name)
    if (ranges.length === 0) continue

    ids.push(memory.mg_id)
    nameRanges.push(...ranges)
  }

  for (const memory of candidates) {
    if (ids.includes(memory.mg_id)) continue

    const isAliasTyped = memory.mg_mma_vars.aliases.some((alias) =>
      findPhrase(text, alias).some((range) => !nameRanges.some((name) => overlaps(range, name))),
    )
    if (isAliasTyped) ids.push(memory.mg_id)
  }

  return { ids, nameRanges }
}

/** A memory's words in each field it can be guessed by. */
function fieldWords(memory: BrandMemory): Record<Field, string[]> {
  const vars = memory.mg_mma_vars

  return {
    name: words(vars.name),
    category: words(vars.category),
    alias: [...vars.aliases, ...vars.tags].flatMap(words),
    description: words(vars.description).filter(isTelling),
  }
}

/** The weight of the best field a word of which starts with `briefWord`, or 0 when none does. */
function fieldWeight(briefWord: string, fields: Record<Field, string[]>) {
  const weights = (Object.keys(fields) as Field[])
    .filter((field) => fields[field].some((word) => word.startsWith(briefWord)))
    .map((field) => BRAND_MEMORY_MATCH.weights[field])

  return Math.max(0, ...weights)
}

/** How much a brief word matched by `matchCount` of `total` memories says about any one of them. */
function rarity(matchCount: number, total: number) {
  const { single, rare, rareShare, common, commonShare } = BRAND_MEMORY_MATCH.rarity
  const share = matchCount / total

  if (matchCount === 1) return single
  if (share <= rareShare) return rare
  if (share >= commonShare) return common
  return 1
}

const categoryRank = (memory: BrandMemory) =>
  BRAND_MEMORY_CATEGORIES.findIndex((entry) => entry.category === memory.mg_mma_vars.category)

/**
 * Higher score first; on a tie, the category ranked first (logo, illustration,
 * model, product), then the most used, then the most recently used.
 */
function compareGuesses(a: { memory: BrandMemory; score: number }, b: { memory: BrandMemory; score: number }) {
  const varsA = a.memory.mg_mma_vars
  const varsB = b.memory.mg_mma_vars

  return (
    b.score - a.score ||
    categoryRank(a.memory) - categoryRank(b.memory) ||
    varsB.use_count - varsA.use_count ||
    varsB.last_used_at.localeCompare(varsA.last_used_at)
  )
}

/** The id of the memory `text` most likely means, from parts of words; null when no word matches. */
function guessMemory(text: string, candidates: BrandMemory[]) {
  const briefWords = [...new Set(words(text).filter(isTelling))]
  const fields = candidates.map(fieldWords)
  const scores = candidates.map(() => 0)

  for (const briefWord of briefWords) {
    const weights = fields.map((memoryFields) => fieldWeight(briefWord, memoryFields))
    const matchCount = weights.filter((weight) => weight > 0).length
    if (matchCount === 0) continue

    const wordRarity = rarity(matchCount, candidates.length)
    weights.forEach((weight, index) => (scores[index]! += weight * wordRarity))
  }

  const best = candidates
    .map((memory, index) => ({ memory, score: scores[index]! }))
    .filter(({ score }) => score > 0)
    .sort(compareGuesses)[0]

  return best?.memory.mg_id ?? null
}

/**
 * The memories the brief uses: picked by hand, then typed exactly (in the brief
 * or its locked passage), then the guess when nothing exact was typed and
 * guessing isn't quiet. `nameRanges` are the full names typed in the brief.
 */
export function briefBrandMemories({
  brief,
  locked,
  memories,
  picked,
  dismissed,
  isGuessQuiet,
}: {
  brief: string
  locked: string
  memories: BrandMemory[]
  picked: string[]
  dismissed: string[]
  isGuessQuiet: boolean
}) {
  const candidates = memories.filter(
    (memory) => memory.mg_mma_vars.memory_enabled && !dismissed.includes(memory.mg_id),
  )
  const inBrief = exactMatches(brief, candidates)
  const inLocked = exactMatches(locked, candidates)
  const exactIds = [...inBrief.ids, ...inLocked.ids]
  const guess = !isGuessQuiet && exactIds.length === 0 ? guessMemory(`${brief} ${locked}`, candidates) : null

  const known = picked.filter((id) => memories.some((memory) => memory.mg_id === id))
  const ids = [...new Set([...known, ...exactIds, ...(guess ? [guess] : [])])]

  return { ids, nameRanges: inBrief.nameRanges }
}

/** The pill's list: every memory, the ticked ones first, then the most used, then the rest in the bar's order. */
export function dropdownOrder(memories: BrandMemory[], tickedIds: string[]) {
  const ticked = tickedIds.flatMap((id) => memories.filter((memory) => memory.mg_id === id))
  const rest = memories
    .filter((memory) => !tickedIds.includes(memory.mg_id))
    .sort((a, b) => b.mg_mma_vars.use_count - a.mg_mma_vars.use_count)

  return [...ticked, ...rest]
}

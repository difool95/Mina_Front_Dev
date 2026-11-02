import { useEffect, useMemo, useState } from 'react'

import { briefBrandMemories, dropdownOrder } from '@/lib/brandMemoryDetect'
import { studioSession } from '@/lib/sessionStorage/studioSession'

import { useBrandMemories } from './useBrandMemories'

/**
 * The brand memories the studio brief uses, worked out on the cached list as
 * the user types (lib/brandMemoryDetect), with what the user ticked and
 * unticked in the pill's list. Those choices last for the tab, in sessionStorage.
 *
 * Unticking a memory keeps it out, even typed by its full name, and quiets the
 * guessing; ticking it again picks it back.
 */
export function useBrandMemoryPicks(userId: string | undefined, brief: string, locked: string) {
  const { data } = useBrandMemories(userId)
  const [picked, setPicked] = useState(() => studioSession.read().brandMemoryPicked ?? [])
  const [dismissed, setDismissed] = useState(() => studioSession.read().brandMemoryDismissed ?? [])
  const [isGuessQuiet, setIsGuessQuiet] = useState(() => studioSession.read().isBrandMemoryGuessQuiet ?? false)

  useEffect(
    () =>
      studioSession.save({
        brandMemoryPicked: picked,
        brandMemoryDismissed: dismissed,
        isBrandMemoryGuessQuiet: isGuessQuiet,
      }),
    [picked, dismissed, isGuessQuiet],
  )

  const memories = useMemo(() => data ?? [], [data])
  const { ids, nameRanges } = useMemo(
    () => briefBrandMemories({ brief, locked, memories, picked, dismissed, isGuessQuiet }),
    [brief, locked, memories, picked, dismissed, isGuessQuiet],
  )

  const tick = (mgId: string) => {
    setDismissed((list) => list.filter((id) => id !== mgId))
    setPicked((list) => [...list, mgId])
  }

  const untick = (mgId: string) => {
    setPicked((list) => list.filter((id) => id !== mgId))
    setDismissed((list) => [...list, mgId])
    setIsGuessQuiet(true)
  }

  return {
    ticked: ids.map((id) => memories.find((memory) => memory.mg_id === id)!),
    dropdown: dropdownOrder(memories, ids),
    nameRanges,
    tick,
    untick,
  }
}

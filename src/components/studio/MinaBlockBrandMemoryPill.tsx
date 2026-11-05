import { useEffect, useRef, useState } from 'react'

import { useLongPress } from '@/hooks/useLongPress'
import { BRAND_MEMORY_PILL_HOLD_MS, BRAND_MEMORY_PILL_TOOLTIP } from '@/lib/brandMemory'
import { cfImage, imageWidthFor } from '@/lib/media'
import type { BrandMemory } from '@/types'

import './MinaBlockPills.css'

/**
 * "Using" and the first brand memory the brief uses (with "+N" for the
 * others). A click opens every memory, ticked ones first, where a click ticks
 * or unticks one. Holding the pill turns brand memory off, which greys it,
 * and holding it again turns it back on.
 */
export function MinaBlockBrandMemoryPill({
  ticked,
  dropdown,
  isOff,
  onTick,
  onUntick,
  onHold,
}: {
  ticked: BrandMemory[]
  /** Every memory, in the list's order. */
  dropdown: BrandMemory[]
  isOff: boolean
  onTick: (mgId: string) => void
  onUntick: (mgId: string) => void
  onHold: () => void
}) {
  const hold = useLongPress(BRAND_MEMORY_PILL_HOLD_MS)
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // Undefined once every memory is unticked: the pill then asks for one.
  const first = ticked[0]

  useEffect(() => {
    if (!isOpen) return

    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', close)

    return () => document.removeEventListener('mousedown', close)
  }, [isOpen])

  return (
    <div className="mina-pills__memory" ref={root}>
      <button
        className="mina-pills__pill paragraph-title-button pill"
        type="button"
        aria-expanded={isOpen}
        data-off={isOff || undefined}
        data-tooltip={isOff ? BRAND_MEMORY_PILL_TOOLTIP.off : BRAND_MEMORY_PILL_TOOLTIP.on}
        onPointerDown={() =>
          hold.start(() => {
            setIsOpen(false)
            onHold()
          })
        }
        onPointerUp={hold.end}
        onPointerLeave={hold.end}
        // A long press on touch would otherwise open the system menu.
        onContextMenu={(event) => event.preventDefault()}
        // A hold must not also open the list, and an off pill has nothing to choose.
        onClick={() => !hold.wasHeld() && !isOff && setIsOpen((wasOpen) => !wasOpen)}
      >
        {/* A "+" like the upload pills' while nothing is ticked. */}
        <span className="mina-pills__icon comment" aria-hidden="true">
          {first ? <img src={cfImage(first.mg_mma_vars.thumb_url, imageWidthFor(22))} alt="" draggable={false} /> : '+'}
        </span>
        <span className="mina-pills__muted comment muted">{first ? 'Using' : 'Pick'}</span>
        <span className="comment">
          {first ? first.mg_mma_vars.name : 'your branding assets'}
          {ticked.length > 1 && ` +${ticked.length - 1}`}
        </span>
      </button>

      {isOpen && (
        <ul className="mina-pills__memories">
          {dropdown.map((memory) => {
            const isTicked = ticked.includes(memory)

            return (
              <li key={memory.mg_id}>
                <button
                  className="mina-pills__memory-row paragraph-title button"
                  type="button"
                  aria-pressed={isTicked}
                  onClick={() => (isTicked ? onUntick(memory.mg_id) : onTick(memory.mg_id))}
                >
                  <img src={cfImage(memory.mg_mma_vars.thumb_url, imageWidthFor(26))} alt="" draggable={false} />
                  <span className="mina-pills__memory-name">{memory.mg_mma_vars.name}</span>
                  {isTicked && (
                    <span className="mina-pills__memory-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

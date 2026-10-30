import type { CSSProperties } from 'react'

import { useLongPress } from '@/hooks/useLongPress'
import { RATIO_HOLD_MS, RATIO_ICONS, STUDIO_RATIOS, studioRatio } from '@/lib/studio'

import './MinaBlockPills.css'

/**
 * The ratio pill both modes end on: a tap cycles the ratio, a hold flips it to landscape and back.
 * The ratio is held by `MinaBlock`, so a loaded prompt file can set it.
 */
export function MinaBlockRatioPill({
  ratioIndex,
  isLandscape,
  onNext,
  onFlip,
}: {
  ratioIndex: number
  isLandscape: boolean
  onNext: () => void
  onFlip: () => void
}) {
  const hold = useLongPress(RATIO_HOLD_MS)
  const ratio = STUDIO_RATIOS[ratioIndex]!
  const ratioValue = studioRatio(ratioIndex, isLandscape)

  return (
    <button
      className="mina-pills__pill mina-pills__pill--ratio paragraph-title-button pill"
      type="button"
      data-tooltip="Tap to cycle · Hold to flip landscape"
      onPointerDown={() => hold.start(onFlip)}
      onPointerUp={hold.end}
      onPointerLeave={hold.end}
      // A long press on touch would otherwise open the system menu.
      onContextMenu={(event) => event.preventDefault()}
      // A hold that flipped the orientation must not also cycle.
      onClick={() => !hold.wasHeld() && onNext()}
    >
      <span className="mina-pills__icon" aria-hidden="true">
        <span
          className="mina-pills__ratio-icon"
          style={{ '--icon': `url('${RATIO_ICONS[ratioValue]}')` } as CSSProperties}
        />
      </span>
      <span className="comment">{ratioValue}</span>
      <span className="mina-pills__muted comment muted">{isLandscape ? ratio.landscapeLabel : ratio.label}</span>
    </button>
  )
}

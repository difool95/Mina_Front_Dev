import { useRef, type CSSProperties } from 'react'

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
  const holdTimer = useRef<number | undefined>(undefined)
  // A hold that flipped the orientation must not also cycle on the click its release fires.
  const wasHeld = useRef(false)
  const ratio = STUDIO_RATIOS[ratioIndex]!
  const ratioValue = studioRatio(ratioIndex, isLandscape)

  const startHold = () => {
    wasHeld.current = false
    holdTimer.current = window.setTimeout(() => {
      wasHeld.current = true
      onFlip()
    }, RATIO_HOLD_MS)
  }

  const endHold = () => window.clearTimeout(holdTimer.current)

  return (
    <button
      className="mina-pills__pill mina-pills__pill--ratio paragraph-title-button pill"
      type="button"
      data-tooltip="Tap to cycle · Hold to flip landscape"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      // A long press on touch would otherwise open the system menu.
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        if (wasHeld.current) {
          wasHeld.current = false
          return
        }
        onNext()
      }}
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

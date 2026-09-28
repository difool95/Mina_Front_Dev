import { useRef, useState } from 'react'

import { RATIO_HOLD_MS, STUDIO_RATIOS, UPLOAD_KINDS } from '@/lib/studio'
import type { UploadKind } from '@/types'

import './MinaBlockPills.css'

export function MinaBlockPills({
  upload,
  onUpload,
}: {
  upload: UploadKind
  onUpload: (kind: UploadKind) => void
}) {
  const [isCreative, setIsCreative] = useState(false)
  const [ratioIndex, setRatioIndex] = useState(0)
  const [isLandscape, setIsLandscape] = useState(false)
  const holdTimer = useRef<number | undefined>(undefined)
  // A hold that flipped the orientation must not also cycle on the click its release fires.
  const wasHeld = useRef(false)
  const ratio = STUDIO_RATIOS[ratioIndex]!
  const ratioValue = isLandscape ? ratio.value.split(':').reverse().join(':') : ratio.value

  const startHold = () => {
    wasHeld.current = false
    holdTimer.current = window.setTimeout(() => {
      wasHeld.current = true
      setIsLandscape((was) => !was)
    }, RATIO_HOLD_MS)
  }

  const endHold = () => window.clearTimeout(holdTimer.current)

  return (
    <div className="mina-pills">
      {/* Hovering picks one and it stays picked, so exactly one is ever lit.
          Click covers touch, where there is no hover. */}
      {UPLOAD_KINDS.map(({ kind, label, tooltip }) => (
        <button
          key={kind}
          className="mina-pills__pill"
          type="button"
          aria-pressed={upload === kind}
          data-tooltip={tooltip}
          onMouseEnter={() => onUpload(kind)}
          onClick={() => onUpload(kind)}
        >
          <span className="mina-pills__icon" aria-hidden="true">
            +
          </span>
          {label}
        </button>
      ))}

      <button
        className="mina-pills__pill mina-pills__pill--text"
        type="button"
        data-tooltip="Niche - 1 matcha · Creative - 1 matcha"
        onClick={() => setIsCreative((was) => !was)}
      >
        {isCreative ? 'Creative' : 'Niche'}
      </button>

      <button
        className="mina-pills__pill"
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
          setRatioIndex((index) => (index + 1) % STUDIO_RATIOS.length)
        }}
      >
        <span className="mina-pills__icon" aria-hidden="true">
          <span
            className={`mina-pills__frame${isLandscape ? ' mina-pills__frame--landscape' : ''}`}
            style={{ aspectRatio: ratioValue.replace(':', ' / ') }}
          />
        </span>
        {ratioValue}
        <span className="mina-pills__muted">{isLandscape ? ratio.landscapeLabel : ratio.label}</span>
      </button>
    </div>
  )
}

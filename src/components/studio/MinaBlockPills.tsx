import { useState } from 'react'

import { STUDIO_RATIOS, UPLOAD_KINDS } from '@/lib/studio'
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
  const ratio = STUDIO_RATIOS[ratioIndex]!

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
        onClick={() => setRatioIndex((index) => (index + 1) % STUDIO_RATIOS.length)}
      >
        <span className="mina-pills__icon" aria-hidden="true">
          <span className="mina-pills__frame" style={{ aspectRatio: ratio.value.replace(':', ' / ') }} />
        </span>
        {ratio.value}
        <span className="mina-pills__muted">{ratio.label}</span>
      </button>
    </div>
  )
}

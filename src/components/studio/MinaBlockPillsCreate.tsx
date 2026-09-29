import { useState } from 'react'

import { UPLOAD_KINDS } from '@/lib/studio'
import type { UploadKind } from '@/types'

import { MinaBlockRatioPill } from './MinaBlockRatioPill'

import './MinaBlockPills.css'

export function MinaBlockPillsCreate({
  upload,
  onUpload,
}: {
  upload: UploadKind
  onUpload: (kind: UploadKind) => void
}) {
  const [isCreative, setIsCreative] = useState(false)

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

      <MinaBlockRatioPill />
    </div>
  )
}

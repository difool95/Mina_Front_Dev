import { useState } from 'react'

import { cfImage, imageWidthFor } from '@/lib/media'
import { UPLOAD_KINDS } from '@/lib/studio'
import type { StudioUpload, UploadKind } from '@/types'

import { MinaBlockRatioPill } from './MinaBlockRatioPill'

import './MinaBlockPills.css'

export function MinaBlockPillsCreate({
  upload,
  uploads,
  onSelectUploadKind,
  onOpenFilePicker,
}: {
  upload: UploadKind
  uploads: StudioUpload[]
  onSelectUploadKind: (kind: UploadKind) => void
  /** Opens the file picker for that pill — the same as the "+" card under it. */
  onOpenFilePicker: (kind: UploadKind) => void
}) {
  const [isCreative, setIsCreative] = useState(false)

  return (
    <div className="mina-pills">
      {/* Hovering picks one and it stays picked, so exactly one is ever lit.
          Click covers touch, where there is no hover. */}
      {UPLOAD_KINDS.map(({ kind, label, tooltip }) => {
        // The pill's first picture stands in for its "+" once there is one.
        const thumbnail = uploads.find((entry) => entry.kind === kind)?.url

        return (
          <button
            key={kind}
            className="mina-pills__pill"
            type="button"
            aria-pressed={upload === kind}
            data-tooltip={tooltip}
            onMouseEnter={() => onSelectUploadKind(kind)}
            onClick={() => {
              onSelectUploadKind(kind)
              onOpenFilePicker(kind)
            }}
          >
            <span className="mina-pills__icon" aria-hidden="true">
              {thumbnail ? <img src={cfImage(thumbnail, imageWidthFor(22))} alt="" draggable={false} /> : '+'}
            </span>
            {label}
          </button>
        )
      })}

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

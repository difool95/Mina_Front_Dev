import type { ReactNode } from 'react'

import { cfImage, imageWidthFor } from '@/lib/media'
import { STILL_LANES_TOOLTIP, UPLOAD_KINDS } from '@/lib/studio'
import type { StudioUpload, UploadKind } from '@/types'

import './MinaBlockPills.css'

export function MinaBlockPillsCreate({
  upload,
  uploads,
  onSelectUploadKind,
  onOpenFilePicker,
  laneLabel,
  onNextLane,
  ratioPill,
}: {
  upload: UploadKind
  uploads: StudioUpload[]
  onSelectUploadKind: (kind: UploadKind) => void
  /** Opens the file picker for that pill — the same as the "+" card under it. */
  onOpenFilePicker: (kind: UploadKind) => void
  laneLabel: string
  onNextLane: () => void
  /** Built by `MinaBlock`, which holds the ratio for both modes. */
  ratioPill: ReactNode
}) {
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
            className="mina-pills__pill paragraph-title-button pill"
            type="button"
            aria-pressed={upload === kind}
            data-tooltip={tooltip}
            onMouseEnter={() => onSelectUploadKind(kind)}
            onClick={() => {
              onSelectUploadKind(kind)
              onOpenFilePicker(kind)
            }}
          >
            <span className="mina-pills__icon comment" aria-hidden="true">
              {thumbnail ? <img src={cfImage(thumbnail, imageWidthFor(22))} alt="" draggable={false} /> : '+'}
            </span>
            <span className="comment">{label}</span>
          </button>
        )
      })}

      <button
        className="mina-pills__pill mina-pills__pill--text comment-button pill"
        type="button"
        data-tooltip={STILL_LANES_TOOLTIP}
        onClick={onNextLane}
      >
        <span className="comment">{laneLabel}</span>
      </button>

      {ratioPill}
    </div>
  )
}

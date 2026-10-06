import { useRef } from 'react'

import { cfImage, imageWidthFor } from '@/lib/media'
import type { StudioUpload } from '@/types'

import './MinaBlockUploadAndLibraries.css'

//This constant is used to determine the distance in pixels that the user must drag an image before it is considered a drag instead of a click.
//If the user drags an image less than this distance, it will be considered a click and the image will be removed from the list of uploads.
const DRAG_SLOP = 4

/**
 * The upload row: what to add, a "+" to add it, and — when there is a library
 * for it — a card of three of its pictures that opens it.
 *
 * Added pictures come first, each removed by clicking it and reordered by
 * dragging it over another, which swaps live under the pointer. The "+" stays after
 * them until `canAdd` runs out, and the library card only shows while the row
 * is still empty. A picture still uploading flashes until it is on R2.
 */
export function MinaBlockUploadAndLibraries({
  title,
  addLabel = 'Add image',
  images = [],
  error,
  canAdd = true,
  onOpenFilePicker,
  onRemove,
  onMove,
  library,
}: {
  title: string
  /** The "+" card's tooltip. */
  addLabel?: string
  images?: Pick<StudioUpload, 'url' | 'isUploading'>[]
  /** Why the last picked picture was refused. */
  error?: string | null
  canAdd?: boolean
  onOpenFilePicker?: () => void
  onRemove?: (url: string) => void
  /** Puts the dragged picture `url` in `target`'s place. */
  onMove?: (url: string, target: string) => void
  library?: { label: string; previewUrls: string[]; onBrowse?: () => void }
}) {
  // The picture held down, and where the press began — so a press that wanders
  // past DRAG_SLOP is a drag, and its release no longer deletes.
  const drag = useRef<{ url: string; x: number; y: number; isDragging: boolean } | null>(null)

  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title">{title}</p>
      {error && <p className="mina-uploads__error">{error}</p>}

      <div className="mina-uploads__cards">
        {images.map(({ url, isUploading }) => (
          <button
            key={url}
            className="mina-uploads__image"
            type="button"
            aria-label="Remove image"
            data-tooltip={isUploading ? 'Uploading · Click to cancel' : 'Drag to reorder · Click to delete'}
            data-url={url}
            data-uploading={isUploading || undefined}
            //THIS HANDLES THE POINTER DOWN EVENT, IT SETS THE DRAG REFERENCE TO THE URL OF THE IMAGE AND THE X AND Y COORDINATES OF THE POINTER
            onPointerDown={(event) => {
              drag.current = { url, x: event.clientX, y: event.clientY, isDragging: false }
              // Keeps the moves coming even once the pointer leaves this picture.
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            // THIS HANDLES THE POINTER MOVE EVENT, IT CHECKS IF THE USER HAS DRAGGED THE IMAGE PAST THE DRAG_SLOP THRESHOLD AND IF SO,
            //  IT CALLS THE ONMOVE METHD TO REORDER THE UPLOADS IN THE PARENT COMPONENT (STUDIOPAGE)
            onPointerMove={(event) => {
              const held = drag.current
              if (!held) return
              if (Math.hypot(event.clientX - held.x, event.clientY - held.y) > DRAG_SLOP) held.isDragging = true

              const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('.mina-uploads__image')?.dataset.url
              if (held.isDragging && target && target !== held.url) onMove?.(held.url, target)
            }}
            // Still a click for the keyboard; only the release that ends a drag is skipped.
            onClick={() => {
              if (!drag.current?.isDragging) onRemove?.(url)
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
          >
            <img src={cfImage(url, imageWidthFor(72))} alt="" draggable={false} />
          </button>
        ))}

        {canAdd && (
          <button
            className="mina-uploads__add"
            type="button"
            aria-label={title}
            data-tooltip={addLabel}
            onClick={onOpenFilePicker}
          >
            +
          </button>
        )}
        {/* The library button card only shows when the row is empty, so it doesn't compete with the "+" button. */}
        {library && !images.length && (
          <button
            className="mina-uploads__library"
            type="button"
            aria-label={library.label}
            data-tooltip={library.label}
            onClick={library.onBrowse}
          >
            {library.previewUrls.map((url) => (
              <img key={url} src={cfImage(url, imageWidthFor(36))} alt="" draggable={false} />
            ))}
            <span className="mina-uploads__more" aria-hidden="true">
              +
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

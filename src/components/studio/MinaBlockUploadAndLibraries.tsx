import { useDragMouse } from '@/hooks/useDragMouse'
import {
  cfImage,
  imageWidthFor,
  cfPoster,
  videoWidthFor,
} from '@/lib/media'
import type { AnimateMediaType, StudioUpload } from '@/types'

import './MinaBlockUploadAndLibraries.css'

//////////////////////Animate (Mode)//////////////////////////////
const AUDIO_ICON_URL = '/assets/gifs/audio-mina-icon.gif'
//////////////////////Animate (Mode)//////////////////////////////

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
  canAdd = true,
  onOpenFilePicker,
  onRemove,
  onMove,
  library,
}: {
  title: string
  /** The "+" card's tooltip. */
  addLabel?: string
  //////////////////////Animate (Mode)//////////////////////////////
  /** A video shows its first frame and a sound Mina's audio icon; anything else is a picture. */
  images?: (Pick<StudioUpload, 'url' | 'isUploading'> & { mediaType?: AnimateMediaType })[]
  //////////////////////Animate (Mode)//////////////////////////////
  canAdd?: boolean
  onOpenFilePicker?: () => void
  onRemove?: (url: string) => void
  /** Puts the dragged picture `url` in `target`'s place. */
  onMove?: (url: string, target: string) => void
  library?: { label: string; previewUrls: string[]; onBrowse?: () => void }
}) {
  // A press that wanders is a drag, and its release no longer deletes.
  const drag = useDragMouse()

  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title paragraph-title">{title}</p>

      <div className="mina-uploads__cards">
        {images.map(({ url, isUploading, mediaType }) => (
          <button
            key={url}
            className="mina-uploads__image"
            type="button"
            aria-label="Remove image"
            data-tooltip={isUploading ? 'Uploading · Click to cancel' : 'Drag to reorder · Click to delete'}
            data-drag-id={url}
            data-uploading={isUploading || undefined}
            onPointerDown={(event) => drag.start(event, url)}
            // Swaps live: the dragged picture takes the place of whichever it is over.
            onPointerMove={(event) => {
              const over = drag.move(event)
              if (over?.target && over.target !== over.id) onMove?.(over.id, over.target)
            }}
            onPointerUp={drag.drop}
            onPointerCancel={drag.drop}
            // Still a click for the keyboard; only the release that ends a drag is skipped.
            onClick={() => !drag.wasDragged() && onRemove?.(url)}
          >
            {/*//////////////////////Animate (Mode)//////////////////////////////*/}
            {mediaType === 'video' && (
              <video src={url} poster={cfPoster(url, videoWidthFor(72))} muted playsInline preload="metadata" />
            )}
            {mediaType === 'audio' && <img src={AUDIO_ICON_URL} alt="" draggable={false} />}
            {/*//////////////////////Animate (Mode)//////////////////////////////*/}
            {mediaType !== 'video' && mediaType !== 'audio' && (
              <img src={cfImage(url, imageWidthFor(72))} alt="" draggable={false} />
            )}
          </button>
        ))}

        {canAdd && (
          <button
            className="mina-uploads__add h5 button"
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
            className="mina-uploads__library h5 button"
            type="button"
            aria-label={library.label}
            data-tooltip={library.label}
            onClick={library.onBrowse}
          >
            {library.previewUrls.map((url) => (
              <img key={url} src={cfImage(url, imageWidthFor(36))} alt="" draggable={false} />
            ))}
            <span className="mina-uploads__more h6 muted" aria-hidden="true">
              +
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

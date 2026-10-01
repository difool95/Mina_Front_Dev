import { cfImage, imageWidthFor } from '@/lib/media'

import './MinaBlockUploadAndLibraries.css'

/**
 * The upload row: what to add, a "+" to add it, and — when there is a library
 * for it — a card of three of its pictures that opens it.
 *
 * Added pictures come first, each removed by clicking it. The "+" stays after
 * them until `canAdd` runs out, and the library card only shows while the row
 * is still empty.
 */
export function MinaBlockUploadAndLibraries({
  title,
  addLabel = 'Add image',
  images = [],
  canAdd = true,
  onOpenFilePicker,
  onRemove,
  library,
}: {
  title: string
  /** The "+" card's tooltip. */
  addLabel?: string
  images?: string[]
  canAdd?: boolean
  onOpenFilePicker?: () => void
  onRemove?: (url: string) => void
  library?: { label: string; previewUrls: string[]; onBrowse?: () => void }
}) {
  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title">{title}</p>

      <div className="mina-uploads__cards">
        {images.map((url) => (
          <button
            key={url}
            className="mina-uploads__image"
            type="button"
            aria-label="Remove image"
            data-tooltip="Remove"
            onClick={() => onRemove?.(url)}
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

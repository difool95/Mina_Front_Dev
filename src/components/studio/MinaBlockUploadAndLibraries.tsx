import { cfImage, imageWidthFor } from '@/lib/media'

import './MinaBlockUploadAndLibraries.css'

/**
 * The upload row: what to add, a "+" to add it, and — when there is a library
 * for it — a card of three of its pictures that opens it.
 */
export function MinaBlockUploadAndLibraries({
  title,
  addLabel = 'Add image',
  library,
}: {
  title: string
  /** The "+" card's tooltip. */
  addLabel?: string
  /** `label` is the library card's tooltip. */
  library?: { label: string; previewUrls: string[]; onBrowse?: () => void }
}) {
  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title">{title}</p>

      <div className="mina-uploads__cards">
        <button className="mina-uploads__add" type="button" aria-label={title} data-tooltip={addLabel}>
          +
        </button>

        {library && (
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

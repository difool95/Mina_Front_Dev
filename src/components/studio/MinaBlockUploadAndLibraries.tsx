import { cfImage, imageWidthFor } from '@/lib/media'
import { LIBRARY_PREVIEW_URLS, UPLOAD_KINDS } from '@/lib/studio'
import type { UploadKind } from '@/types'

import './MinaBlockUploadAndLibraries.css'

export function MinaBlockUploadAndLibraries({
  upload,
  onBrowseLibrary,
}: {
  upload: UploadKind
  onBrowseLibrary: () => void
}) {
  const { title } = UPLOAD_KINDS.find((entry) => entry.kind === upload)!

  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title">{title}</p>

      <div className="mina-uploads__cards">
        <button className="mina-uploads__add" type="button" aria-label={title} data-tooltip="Add image">
          +
        </button>

        {upload === 'scene' && (
          <button
            className="mina-uploads__library"
            type="button"
            aria-label="Browse scene library"
            data-tooltip="Browse scene library"
            onClick={onBrowseLibrary}
          >
            {LIBRARY_PREVIEW_URLS.map((url) => (
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

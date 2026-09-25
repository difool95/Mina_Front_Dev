import { cfImage, imageWidthFor } from '@/lib/media'
import { LIBRARY_PREVIEW_URLS, UPLOAD_KINDS } from '@/lib/studio'
import type { UploadKind } from '@/types'

import './MinaBlockUploadAndLibraries.css'

export function MinaBlockUploadAndLibraries({ upload }: { upload: UploadKind }) {
  const { title } = UPLOAD_KINDS.find((entry) => entry.kind === upload)!

  return (
    <div className="mina-uploads">
      <p className="mina-uploads__title">{title}</p>

      <div className="mina-uploads__cards">
        <button className="mina-uploads__add" type="button" aria-label={title}>
          +
        </button>

        {upload === 'scene' && (
          <button className="mina-uploads__library" type="button" aria-label="Open library">
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

import { PANEL_UPLOAD_LABELS } from '@/lib/studio'
import type { StudioMode, StudioUpload } from '@/types'

import { Carousel } from '../Carousel'

/**
 * The studio's right side: every picture added under the pills, stacked in
 * the order they were added and paged with the home carousel.
 *
 * Its styles live in `StudioPage.css`, beside the rest of the studio's layout.
 */
export function RightStudioPanel({
  mode,
  uploads,
  generations,
  onUpload,
}: {
  mode: StudioMode
  uploads: StudioUpload[]
  /** The R2 URLs of the pictures Create made, oldest first: they page after the uploads. */
  generations: string[]
  /** Create's button: picks the scene, as the "+ Scene" pill does. */
  onUpload: () => void
}) {
//This line creates a new array of shown uploads and generations based on the current mode. If the mode is 'create', it filters out any uploads that are still uploading
// and maps the remaining uploads to their URLs, then concatenates that with the generations array. If the mode is not 'create', it returns an empty array.
  const shown =
    mode === 'create'
      ? [...uploads.filter((entry) => !entry.isUploading).map(({ url }) => url), ...generations]
      : []

  return (
    <section className="mina-studio__panel">
      {shown.length ? (
        // Remounted whenever a picture comes or goes, so the page never points past the end.
        <Carousel
          key={shown.length}
          // Opens on the newest creation, which is the last picture.
          startIndex={mode === 'create' && generations.length ? shown.length - 1 : 0}
          media={shown.map((url) => ({
            id: url,
            media_url: url,
            media_type: 'image',
            thumbnail: null,
            alt_text: null,
          }))}
        />
      ) : (
        <button
          className="mina-studio__upload"
          type="button"
          onClick={mode === 'create' ? onUpload : undefined}
        >
          {PANEL_UPLOAD_LABELS[mode]}
        </button>
      )}
    </section>
  )
}

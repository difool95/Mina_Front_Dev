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
  onUpload,
}: {
  mode: StudioMode
  uploads: StudioUpload[]
  /** Create's button: picks the scene, as the "+ Scene" pill does. */
  onUpload: () => void
}) {
  // Animate's uploads are not wired yet, so create's stay out of its panel.
  const shown = mode === 'create' ? uploads : []

  return (
    <section className="mina-studio__panel">
      {shown.length ? (
        // Remounted whenever a picture comes or goes, so the page never points past the end.
        <Carousel
          key={shown.length}
          media={shown.map(({ url }) => ({
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

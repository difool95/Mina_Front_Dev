import { useState } from 'react'

import {
  useDownloadMedia,
  useGenerations,
  useLikedGenerations,
  useLikeGeneration,
  useUnlikeGeneration,
} from '@/hooks/useGenerations'
import { filenameFromUrl } from '@/lib/generations'
import { PANEL_UPLOAD_LABELS } from '@/lib/studio'
import { useAuth } from '@/providers/AuthProvider'
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
  /** The R2 URLs of the pictures Create made, newest first: they page before the uploads, so the carousel opens on the newest. */
  generations: string[]
  /** Create's button: picks the scene, as the "+ Scene" pill does. */
  onUpload: () => void
}) {
//This line creates a new array of shown uploads and generations based on the current mode. If the mode is 'create', it filters out any uploads that are still uploading
// and maps the remaining uploads to their URLs, placing them after the generations array. If the mode is not 'create', it returns an empty array.
  const shown =
    mode === 'create'
      ? [...generations, ...uploads.filter((entry) => !entry.isUploading).map(({ url }) => url)]
      : []
  // The picture the carousel is on, which the bar's buttons act on.
  const [current, setCurrent] = useState(0)
  const currentUrl = shown[current]
  const download = useDownloadMedia()
/////////////////////////////////////////we need to know the generation id from the currentUrl to check if it is liked or not. We get the userId from the session and use it to fetch all
//generations and liked generations. and from that we know which url's in the carousel are generations and which are not. We also check if the current generation is liked
//or not and set the button text accordingly.//////////////////////////////////////////////////////////
  const { session } = useAuth()
  const userId = session?.user.id
  const { data: allGenerations } = useGenerations(userId)
  const { data: liked } = useLikedGenerations(userId)
  const like = useLikeGeneration(userId)
  const unlike = useUnlikeGeneration(userId)
  const generation =
    current < generations.length ? allGenerations?.find((entry) => entry.mg_output_url === currentUrl) : undefined
  const generationId = generation?.mg_generation_id ?? ''
  const isLiked = liked?.has(generationId) ?? false
  ///////////////////////////////////we need to know the generation id from the currentUrl to check if it is liked or not. We get the userId from the session and use it to fetch all
//generations and liked generations. and from that we know which url's in the carousel are generations and which are not. We also check if the current generation is liked
//or not and set the button text accordingly.///////////////////////////////////////////////////////////////

  return (
    <section className="mina-studio__panel">
      {shown.length ? (
        <>
          <div className="mina-studio__stage">
            {/* Remounted whenever a picture comes or goes, so the page never points past the end. */}
            <Carousel
              key={shown.length}
              onIndexChange={setCurrent}
              media={shown.map((url) => ({
                id: url,
                media_url: url,
                media_type: 'image',
                thumbnail: null,
                alt_text: null,
              }))}
            />
          </div>

          {/* Under the pictures on desktop, over them on a phone (StudioPage.css). */}
          <div className="mina-studio__actions">
            <button
              className="mina-studio__action button-small"
              type="button"
              onClick={() => currentUrl && download.mutate({ url: currentUrl, filename: filenameFromUrl(currentUrl) })}
            >
              Download
            </button>
            <span className="separator" aria-hidden="true">
              |
            </span>
            <button
              className="mina-studio__action button-small"
              type="button"
              // Disabled on anything that is not one of Mina's pictures, and while a like or unlike is saving.
              disabled={!generation || like.isPending || unlike.isPending}
              onClick={() => generation && (isLiked ? unlike.mutate(generationId) : like.mutate(generation))}
            >
              {isLiked ? 'Unlike' : 'Like'}
            </button>
            <span className="separator" aria-hidden="true">
              |
            </span>
            <button className="mina-studio__action button-small" type="button">
              Set Scene
            </button>
            <button className="mina-studio__action mina-studio__action--edit button-small" type="button">
              Edit
            </button>
          </div>
        </>
      ) : (
        <button
          className="mina-studio__upload button-upload"
          type="button"
          onClick={mode === 'create' ? onUpload : undefined}
        >
          {PANEL_UPLOAD_LABELS[mode]}
        </button>
      )}
    </section>
  )
}

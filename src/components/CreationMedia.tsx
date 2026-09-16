import { useCallback, useEffect, useRef, useState } from 'react'

import { useInView } from '@/hooks/useInView'
import { requestSlot } from '@/lib/loadQueue'
import { cfImage, cfPoster, cfVideo, imageWidthFor, videoWidthFor } from '@/lib/media'

interface CreationMediaProps {
  /** The original asset URL. The delivery size is worked out here. */
  url: string
  alt: string
  motion: boolean
}

/**
 * A creation's picture or clip, fetched only once it is worth fetching.
 *
 * Nothing is requested until the tile nears the viewport and the load queue
 * hands it a slot, and what is then requested is sized to the tile rather than
 * to the original — which is 27 MB for a still.
 *
 * The element is measured at the moment its slot opens, not at mount: by then
 * the grid has placed it and the frame's `aspect-ratio` has given it a height,
 * so there is nothing to lay out and no jump when the bytes land.
 *
 * It takes the plain URL and derives the delivery one internally, so the
 * transformed URL — which carries no CORS header — cannot leak out to the
 * download and clipboard paths that have to read bytes.
 */
export function CreationMedia({ url, alt, motion }: CreationMediaProps) {
  const { ref, inView } = useInView()
  const element = useRef<HTMLImageElement | HTMLVideoElement | null>(null)
  const release = useRef<(() => void) | null>(null)

  const [src, setSrc] = useState<string>()
  const [poster, setPoster] = useState<string>()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const attach = useCallback(
    (node: HTMLImageElement | HTMLVideoElement | null) => {
      element.current = node
      ref(node)
    },
    [ref],
  )

  useEffect(() => {
    if (!inView) return

    const cancel = requestSlot(() => {
      const cssWidth = element.current?.clientWidth ?? 0

      if (motion) {
        const width = videoWidthFor(cssWidth)

        setPoster(cfPoster(url, width))
        setSrc(cfVideo(url, width))
      } else {
        setSrc(cfImage(url, imageWidthFor(cssWidth)))
      }
    })

    release.current = cancel

    // Also runs when a tile is scrolled past before its turn — its place in
    // the queue has to go back, or the slots fill with abandoned work.
    return () => {
      cancel()
      release.current = null
    }
  }, [inView, motion, url])

  const free = () => {
    release.current?.()
    release.current = null
  }

  const settle = () => {
    free()
    setReady(true)
  }

  // A transform can fail where the original does not — an unusual codec, or a
  // path outside the pipeline. One retry on the original, then give up.
  const retry = () => {
    free()

    if (failed) return

    setFailed(true)
    setPoster(undefined)
    setSrc(url)
  }

  return motion ? (
    <video
      ref={attach}
      src={src}
      poster={poster}
      data-ready={ready || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      onLoadedData={settle}
      onError={retry}
    />
  ) : (
    <img
      ref={attach}
      src={src}
      alt={alt}
      data-ready={ready || undefined}
      decoding="async"
      onLoad={settle}
      onError={retry}
    />
  )
}

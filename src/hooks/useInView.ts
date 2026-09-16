//THIS SCRIPT IS TO KNOW IF THE ELEMENT IS IN VIEWPORT OR NOT, AND IF IT IS IN VIEWPORT, IT WILL RETURN TRUE, OTHERWISE FALSE.
import { useCallback, useRef, useState } from 'react'

interface InViewOptions {
  /**
   * Starts the observer early. The default reaches a screen ahead, so work
   * triggered by it — a fetch, say — is usually done by the time the element
   * is actually scrolled to. Pass `'0px'` to follow the viewport exactly.
   */
  rootMargin?: string
  threshold?: number
  /**
   * One-shot: disconnect on the first hit and stay true. Right for work that
   * is done once and stays done, like loading a creation — re-observing would
   * only invite it to fetch again on the way back up. Pass `false` where the
   * element has to be followed both ways, like playback or an animation that
   * plays afresh each time.
   */
  once?: boolean
}

/** Tells you when an element is in the viewport, or near it. */
export function useInView({ rootMargin = '480px 0px', threshold = 0, once = true }: InViewOptions = {}) {
  const [inView, setInView] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  /** One-shot only: latches so a re-attached node cannot start it over. */
  const seen = useRef(false)

  const ref = useCallback(
    (node: Element | null) => {
      observer.current?.disconnect()

      if (!node || seen.current) return

      observer.current = new IntersectionObserver(
        ([entry]) => {
          const showing = entry?.isIntersecting ?? false

          if (once) {
            if (!showing) return

            seen.current = true
            observer.current?.disconnect()
          }

          setInView(showing)
        },
        { rootMargin, threshold },
      )

      observer.current.observe(node)
    },
    [once, rootMargin, threshold],
  )

  return { ref, inView }
}

//THIS SCRIPT IS TO KNOW IF THE ELEMENT IS IN VIEWPORT OR NOT, AND IF IT IS IN VIEWPORT, IT WILL RETURN TRUE, OTHERWISE FALSE.
import { useCallback, useRef, useState } from 'react'

/**
 * Tells you when an element first comes near the viewport.
 *
 * One-shot: the observer disconnects on the first hit, because a creation that
 * has been seen stays loaded — re-observing would only invite it to unload and
 * fetch again on the way back up.
 *
 * The default margin starts the fetch a screen early, so tiles are usually
 * ready by the time they are actually scrolled to.
 */
export function useInView(rootMargin = '480px 0px') {
  const [inView, setInView] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: Element | null) => {
      observer.current?.disconnect()

      if (!node || inView) return

      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return

          observer.current?.disconnect()
          setInView(true)
        },
        { rootMargin },
      )

      observer.current.observe(node)
    },
    [inView, rootMargin],
  )

  return { ref, inView }
}

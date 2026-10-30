import { useRef } from 'react'

/**
 * A press held for `holdMs` runs its own action instead of the click.
 *
 * `start(onLongPress)` goes on pointer down and `end` on pointer up and
 * leave. The click that a release fires still comes after a hold, so the
 * click handler asks `wasHeld()` first and does nothing when it answers true.
 */
export function useLongPress(holdMs: number) {
  const timer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  const start = (onLongPress: () => void) => {
    held.current = false
    timer.current = window.setTimeout(() => {
      held.current = true
      onLongPress()
    }, holdMs)
  }

  const end = () => window.clearTimeout(timer.current)

  // True only for the one click that ends a hold.
  const wasHeld = () => {
    const answer = held.current
    held.current = false
    return answer
  }

  return { start, end, wasHeld }
}

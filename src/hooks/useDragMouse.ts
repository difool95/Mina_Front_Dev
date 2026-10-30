import { useRef, type PointerEvent } from 'react'

import { DRAG_SLOP } from '@/lib/constants'

/**
 * A press that wanders past DRAG_SLOP becomes a drag over the items marked
 * with `data-drag-id`.
 *
 * `start(event, id)` goes on pointer down, `move` on pointer move and `drop`
 * on pointer up and cancel. `move` answers null until the press is a drag,
 * then the held id and the id of the item under the pointer; `drop` answers
 * the same for where it was let go. The click a release fires still comes
 * after a drag, so the click handler asks `wasDragged()` first and does
 * nothing when it answers true.
 */
export function useDragMouse() {
  const press = useRef<{ id: string; x: number; y: number; isDragging: boolean; target?: string } | null>(null)
  const dragged = useRef(false)

  const start = (event: PointerEvent<HTMLElement>, id: string) => {
    press.current = { id, x: event.clientX, y: event.clientY, isDragging: false }
    dragged.current = false
    // Keeps the moves coming even once the pointer leaves the item.
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: PointerEvent<HTMLElement>) => {
    const held = press.current
    if (!held) return null
    if (Math.hypot(event.clientX - held.x, event.clientY - held.y) > DRAG_SLOP) held.isDragging = true
    if (!held.isDragging) return null

    held.target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-drag-id]')?.dataset.dragId
    return { id: held.id, target: held.target }
  }

  const drop = () => {
    const held = press.current
    press.current = null
    dragged.current = Boolean(held?.isDragging)
    return held?.isDragging ? { id: held.id, target: held.target } : null
  }

  // True only for the one click that ends a drag.
  const wasDragged = () => {
    const answer = dragged.current
    dragged.current = false
    return answer
  }

  return { start, move, drop, wasDragged }
}

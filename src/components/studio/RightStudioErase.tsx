import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { cfImageCarousel, imageWidthFor } from '@/lib/media'
import { ERASE_MAX_AREAS, ERASE_ZOOM_MAX, ERASE_ZOOM_MIN, ERASE_ZOOM_SPEED } from '@/lib/studio'
import type { ErasePoint } from '@/types'

const clamp = (value: number) => Math.min(100, Math.max(0, value))

/** Where the picture is moved to and how big it is, from its whole size in the middle of the stage. */
interface EraseView {
  scale: number
  x: number
  y: number
}

/** A point of the screen, from the stage's middle. */
const fromMiddle = (stage: HTMLElement, clientX: number, clientY: number) => {
  const box = stage.getBoundingClientRect()
  return { x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2 }
}

/** Zooms by `factor` around `point` (from the stage's middle), which stays where it is on screen. */
const zoomed = ({ scale, x, y }: EraseView, point: { x: number; y: number }, factor: number): EraseView => {
  const next = Math.min(ERASE_ZOOM_MAX, Math.max(ERASE_ZOOM_MIN, scale * factor))
  const grown = next / scale
  return { scale: next, x: point.x - grown * (point.x - x), y: point.y - grown * (point.y - y) }
}

const distance = ([a, b]: { x: number; y: number }[]) => Math.hypot(a!.x - b!.x, a!.y - b!.y)

/**
 * Erase: the picture alone, whole, with the areas to erase drawn over it.
 * Holding the left button draws an area that follows the pointer, closed by a
 * straight line back to where it started. A new area replaces the others,
 * unless Shift is held, which adds it; past 12, the oldest goes.
 * Scrolling, or pinching on a phone, zooms around the pointer; holding Space
 * and dragging moves the picture. Esc clears the
 * areas, then leaves Erase once there are none.
 *
 * Its styles live in `StudioPage.css`, beside the rest of the studio's layout.
 */
export function RightStudioErase({ imageUrl, onLeave }: { imageUrl: string; onLeave: () => void }) {
  const [areas, setAreas] = useState<ErasePoint[][]>([])
  // The area being drawn, while the button is held.
  const [drawing, setDrawing] = useState<ErasePoint[] | null>(null)
  const [view, setView] = useState<EraseView>({ scale: 1, x: 0, y: 0 })
  const stage = useRef<HTMLDivElement>(null)
  // The fingers on the screen, for the pinch.
  const fingers = useRef(new Map<number, { x: number; y: number }>())
  // While Space is held, the pointer grabs the picture to move it instead of drawing.
  const [isGrabbing, setIsGrabbing] = useState(false)
  // Where the pointer last was while dragging the picture.
  const dragFrom = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const hold = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      // Neither scrolls the page nor clicks the button in focus.
      event.preventDefault()
      setIsGrabbing(event.type === 'keydown')
      if (event.type === 'keyup') dragFrom.current = null
    }
    window.addEventListener('keydown', hold)
    window.addEventListener('keyup', hold)
    return () => {
      window.removeEventListener('keydown', hold)
      window.removeEventListener('keyup', hold)
    }
  }, [])

  // Added by hand rather than through onWheel: React's listens passively, which could not stop the page scrolling or zooming.
  useEffect(() => {
    const element = stage.current!
    const zoom = (event: WheelEvent) => {
      event.preventDefault()
      const point = fromMiddle(element, event.clientX, event.clientY)
      setView((was) => zoomed(was, point, Math.exp(-event.deltaY * ERASE_ZOOM_SPEED)))
    }
    element.addEventListener('wheel', zoom, { passive: false })
    return () => element.removeEventListener('wheel', zoom)
  }, [])

  // Esc clears the areas; with none left, it leaves Erase.
  const hasAreas = areas.length > 0 || drawing !== null
  useEffect(() => {
    const clearOrLeave = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (!hasAreas) return onLeave()
      setAreas([])
      setDrawing(null)
    }
    window.addEventListener('keydown', clearOrLeave)
    return () => window.removeEventListener('keydown', clearOrLeave)
  }, [hasAreas, onLeave])

  // Kept on the picture's edge when the pointer leaves it mid-drawing.
  const pointAt = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 100),
      y: clamp(((event.clientY - box.top) / box.height) * 100),
    }
  }

  const start = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || isGrabbing) return
    // Keeps the moves coming when the pointer leaves the picture.
    event.currentTarget.setPointerCapture(event.pointerId)
    if (!event.shiftKey) setAreas([])
    setDrawing([pointAt(event)])
  }

  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (drawing) setDrawing([...drawing, pointAt(event)])
  }

  // A click or a stroke too short to make a shape leaves no area.
  const end = () => {
    if (drawing && drawing.length > 2) setAreas((kept) => [...kept, drawing].slice(-ERASE_MAX_AREAS))
    setDrawing(null)
  }

  // The stage hears every pointer, on the picture or around it, after the picture's own handlers.
  const press = (event: PointerEvent<HTMLDivElement>) => {
    if (isGrabbing && event.button === 0) {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragFrom.current = { x: event.clientX, y: event.clientY }
    }
    if (event.pointerType !== 'touch') return
    fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    // A second finger pinches: the area the first one started is dropped.
    if (fingers.current.size > 1) setDrawing(null)
  }

  const moveStage = (event: PointerEvent<HTMLDivElement>) => {
    const from = dragFrom.current
    if (from) {
      dragFrom.current = { x: event.clientX, y: event.clientY }
      setView((was) => ({ ...was, x: was.x + event.clientX - from.x, y: was.y + event.clientY - from.y }))
    }
    if (!fingers.current.has(event.pointerId)) return
    const before = [...fingers.current.values()]
    fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (fingers.current.size !== 2) return

    const after = [...fingers.current.values()]
    const middle = fromMiddle(event.currentTarget, (after[0]!.x + after[1]!.x) / 2, (after[0]!.y + after[1]!.y) / 2)
    setView((was) => zoomed(was, middle, distance(after) / distance(before)))
  }

  const lift = (event: PointerEvent<HTMLDivElement>) => {
    dragFrom.current = null
    fingers.current.delete(event.pointerId)
  }

  const shown = drawing ? [...areas, drawing] : areas

  return (
    <div
      ref={stage}
      className={`mina-studio__alone mina-studio__alone--erase${isGrabbing ? ' mina-studio__alone--grab' : ''}`}
      onPointerDown={press}
      onPointerMove={moveStage}
      onPointerUp={lift}
      onPointerCancel={lift}
    >
      <div
        className="mina-studio__erase"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <img
          className="mina-studio__erase-picture"
          src={cfImageCarousel(imageUrl, imageWidthFor(1080))}
          alt=""
          draggable={false}
        />
        {/* 100 × 100 stretched over the picture, so the points are the same percentages. */}
        <svg
          className="mina-studio__areas"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {shown.map((area, index) => (
            <polygon
              key={index}
              className="mina-studio__area"
              points={area.map(({ x, y }) => `${x},${y}`).join(' ')}
              // The border in screen pixels, not stretched with the picture.
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

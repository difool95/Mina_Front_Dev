import { useRef, useState, type CSSProperties } from 'react'

import type { OnboardContent } from '@/types'

import { GlassDisc } from './GlassDisc'

import './Carousel.css'

const DRAG_THRESHOLD = 50
const DOT_SLOTS = 7
/**
 * Width of one dot cell in px — the dot plus its gap, and the distance the
 * strip slides per media.
 *
 * It lives here rather than in CSS because the strip's `transform` must be a
 * plain px value: a `transform` whose value reads an unregistered custom
 * property never commits its transition, so the slide silently freezes.
 * CSS receives it back as `--dot-cell` for the cell and track widths.
 */
const DOT_CELL = 14
/** Scale and opacity by distance from the lit dot — the size gradient. */
const DOT_STEPS = [
  { scale: 1, opacity: 1 },
  { scale: 0.875, opacity: 0.7 },
  { scale: 0.75, opacity: 0.5 },
  { scale: 0.5, opacity: 0.36 },
  { scale: 0.375, opacity: 0.24 },
]

/**
 * Which of the 7 slots is lit for media `i` of `n`.
 *
 * The lit slot walks 1 → 2 → 3, parks on 3 for the rest of the first half,
 * jumps to 5 once past halfway and parks there, then finishes 6 → 7 on the
 * last two. While it is parked the strip keeps sliding underneath, so dots
 * still stream in from the edges on every swipe.
 */
function litSlot(i: number, n: number) {
  if (n <= DOT_SLOTS) return i
  if (i <= 2) return i
  if (i < n / 2) return 2
  if (i < n - 2) return 4
  return i - n + DOT_SLOTS
}

export function Carousel({ media }: { media: OnboardContent[] }) {
  const [index, setIndex] = useState(0)
  // Also doubles as the hover flag: null means the pointer is outside.
  const [cursor, setCursor] = useState<{ x: number; y: number; side: 'prev' | 'next' } | null>(null)
  const dragStartX = useRef<number | null>(null)

  const go = (delta: number) => {
    if (media.length === 0) return
    setIndex((current) => (current + delta + media.length) % media.length)
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    const start = dragStartX.current
    dragStartX.current = null

    // A drag past the threshold navigates; anything shorter is a click, and a
    // click is resolved by which half of the media it landed on.
    if (start !== null && Math.abs(event.clientX - start) > DRAG_THRESHOLD) {
      go(event.clientX < start ? 1 : -1)
      return
    }

    const { left, width } = event.currentTarget.getBoundingClientRect()
    go(event.clientX - left < width / 2 ? -1 : 1)
  }

  const current = media[index]
  const paged = media.length > 1

  return (
    <div
      className={`mina-carousel${paged ? ' mina-carousel--paged' : ''}`}
      onPointerDown={(event) => {
        dragStartX.current = event.clientX
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setCursor(null)}
      onPointerMove={(event) => {
        const { left, top, width } = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - left
        setCursor({ x, y: event.clientY - top, side: x < width / 2 ? 'prev' : 'next' })
      }}
    >
      {current?.media_type === 'video' ? (
        <video
          className="mina-carousel__media"
          src={current.media_url ?? undefined}
          poster={current.thumbnail ?? undefined}
          aria-label={current.alt_text ?? undefined}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          className="mina-carousel__media"
          src={current?.media_url ?? undefined}
          alt={current?.alt_text ?? ''}
          draggable={false}
        />
      )}

      {cursor && paged && (
        <GlassDisc x={cursor.x} y={cursor.y} anchor="absolute" size={48}>
          <span className="mina-carousel__chevron">{cursor.side === 'prev' ? '‹' : '›'}</span>
        </GlassDisc>
      )}

      {paged && (
        <div
          className="mina-carousel__dots"
          style={
            {
              '--dot-cell': `${DOT_CELL}px`,
              '--dot-slots': Math.min(media.length, DOT_SLOTS),
            } as CSSProperties
          }
          // The dots sit inside the carousel, so without stopping these the
          // parent would also treat a dot click as a page-forward, and the
          // follow-cursor arrow would trail over the dots.
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerMove={(event) => {
            event.stopPropagation()
            setCursor(null)
          }}
        >
          {/* One cell per media, slid so the current one sits on its lit slot. */}
          <div
            className="mina-carousel__strip"
            style={{
              transform: `translateX(${-(index - litSlot(index, media.length)) * DOT_CELL}px)`,
            }}
          >
            {media.map((item, slot) => {
              const step = DOT_STEPS[Math.min(Math.abs(slot - index), DOT_STEPS.length - 1)]!
              return (
                <button
                  className="mina-carousel__cell"
                  type="button"
                  key={item.id}
                  aria-label={`Go to media ${slot + 1}`}
                  aria-current={slot === index}
                  onClick={() => setIndex(slot)}
                >
                  <span
                    className="mina-carousel__dot"
                    style={
                      { '--dot-scale': step.scale, '--dot-opacity': step.opacity } as CSSProperties
                    }
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type CSSProperties } from 'react'

import {
  cfImageCarousel,
  cfPoster,
  cfVideo,
  COPY_FLASH_MS,
  COPY_HOLD_MS,
  imageWidthFor,
  isLightImage,
  videoWidthFor,
} from '@/lib/media'
import { fingertipAt } from '@/lib/studio'
import type { CarouselFingertips, Fingertip, OnboardContent } from '@/types'

import { GlassDisc } from './GlassDisc'

import './Carousel.css'

const DRAG_THRESHOLD = 50
const DOT_SLOTS = 6
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
 * Which of the 6 slots is lit for media `i` of `n`.
 *
 * The lit slot walks 1 → 2 → 3, parks on 3 for the rest of the first half,
 * steps to 4 once past halfway and parks there, then finishes 5 → 6 on the
 * last two. While it is parked the strip keeps sliding underneath, so dots
 * still stream in from the edges on every swipe.
 */
function litSlot(i: number, n: number) {
  if (n <= DOT_SLOTS) return i
  if (i <= 2) return i
  if (i < n / 2) return 2
  if (i < n - 2) return DOT_SLOTS - 3
  return i - n + DOT_SLOTS
}

/** What the glass disc can show — each one a mask class in `Carousel.css`. */
type DiscIcon = Fingertip | 'liked' | 'fill' | 'fit' | 'link'

/** What each fingertip that the page decides calls, by name in `CarouselFingertips`. */
const PAGE_ACTIONS = { delete: 'onDelete', edit: 'onEdit', download: 'onDownload', like: 'onLike' } as const

/**
 * Only what it shows of each item, so the studio's uploads can page through it too.
 *
 * On its own it pages: the disc that stands in for the pointer shows which way,
 * and a click on either half or a drag goes there. A page can switch on its
 * `fingertips` as well, and decide what each does: along the top, from the
 * left, delete, edit, copy, download and like; paging on the two sides below;
 * a zoom anywhere else; and the right button copying the picture, or its share
 * link once held past a second. The disc darkens over a light picture either way.
 */
export function Carousel({
  media,
  startIndex = 0,
  onIndexChange,
  fingertips,
}: {
  media: Pick<OnboardContent, 'id' | 'media_url' | 'media_type' | 'thumbnail' | 'alt_text'>[]
  /** The media it opens on. */
  startIndex?: number
  /** Told the media on show, on opening and on every page. */
  onIndexChange?: (index: number) => void
  fingertips?: CarouselFingertips
}) {
  const [index, setIndex] = useState(startIndex)
  useEffect(() => onIndexChange?.(index), [index, onIndexChange])
  // Also doubles as the hover flag: null means the pointer is outside.
  const [cursor, setCursor] = useState<{ x: number; y: number; fingertip: Fingertip | null } | null>(null)
  const dragStartX = useRef<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  // Nothing is requested until the box is measured, so the original never loads.
  const [boxWidth, setBoxWidth] = useState(0)
  // Measured on each picture's load, so the disc turns dark over a light one.
  const [isLight, setIsLight] = useState(false)
  /** Set once the right button has been held long enough to mean "link". */
  const [isArmed, setIsArmed] = useState(false)
  /** The copy that just happened, held briefly so the disc can confirm it. */
  const [copied, setCopied] = useState<'copy' | 'link' | null>(null)
  const hold = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(hold.current), [])

  // Measured again whenever the box resizes with the screen; the width ladder in
  // lib/media keeps that from asking for a new picture on every pixel.
  useEffect(() => {
    const box = root.current!
    const observer = new ResizeObserver(() => setBoxWidth(box.clientWidth))
    observer.observe(box)

    return () => observer.disconnect()
  }, [])

  const go = (delta: number) => {
    if (media.length === 0) return
    setIndex((current) => (current + delta + media.length) % media.length)
  }

  const paged = media.length > 1

  /** The fingertip under the pointer: with none switched on, only which half it is on. */
  const fingertipUnder = (event: React.PointerEvent<HTMLDivElement>): Fingertip | null => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - left) / width

    if (!fingertips) return paged ? (x < 0.5 ? 'prev' : 'next') : null

    const fingertip = fingertipAt(x, (event.clientY - top) / height)
    if (fingertip === 'like' && !fingertips.canLike) return null
    if ((fingertip === 'prev' || fingertip === 'next') && !paged) return null

    return fingertip
  }

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const { left, top } = event.currentTarget.getBoundingClientRect()
    setCursor({ x: event.clientX - left, y: event.clientY - top, fingertip: fingertipUnder(event) })
  }

  const flash = (action: 'copy' | 'link') => {
    setCopied(action)
    window.setTimeout(() => setCopied(null), COPY_FLASH_MS)
  }

  const copy = () => {
    flash('copy')
    fingertips?.onCopy()
  }

  // Paging and copying are the carousel's own; the rest is the page's to decide.
  const act = (fingertip: Fingertip) => {
    if (fingertip === 'prev') go(-1)
    else if (fingertip === 'next') go(1)
    else if (fingertip === 'copy') copy()
    else fingertips?.[PAGE_ACTIONS[fingertip]]()
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartX.current
    dragStartX.current = null

    // The right button copies: the picture itself, or — held long enough — its link.
    if (fingertips && event.button === 2) {
      window.clearTimeout(hold.current)
      setIsArmed(false)
      if (isArmed) {
        flash('link')
        fingertips.onCopyLink()
      } else copy()
      return
    }

    // A drag past the threshold navigates; anything shorter is a click, which does
    // what the fingertip under it does — on its own, page by the half it landed on.
    if (start !== null && Math.abs(event.clientX - start) > DRAG_THRESHOLD) {
      go(event.clientX < start ? 1 : -1)
      return
    }

    const fingertip = fingertipUnder(event)
    if (fingertip) act(fingertip)
    else fingertips?.onZoom()
  }

  const current = media[index]
  const fingertip = cursor?.fingertip ?? null
  // What just happened wins, then what a right-button release would do, then what
  // a click does where the pointer is — with fingertips, a zoom where there is none.
  const zoom: DiscIcon | null = fingertips ? (fingertips.isFitted ? 'fill' : 'fit') : null
  const icon: DiscIcon | null =
    copied ?? (isArmed ? 'link' : fingertip === 'like' && fingertips?.isLiked ? 'liked' : (fingertip ?? zoom))
  // A light picture darkens what floats over it — the arrow disc and the dots.
  const isOverLight = isLight && current?.media_type !== 'video'
  // Nothing to request until there is both a URL and a measured box.
  const url = boxWidth ? current?.media_url : null
  const videoWidth = videoWidthFor(boxWidth)
  // A transform can fail where the original does not; fall back to it once.
  const fallBack = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    if (url && event.currentTarget.src !== url) event.currentTarget.src = url
  }

  return (
    <div
      ref={root}
      className={`mina-carousel${paged || fingertips ? ' mina-carousel--disc' : ''}${isOverLight ? ' mina-carousel--light' : ''}${fingertips?.isFitted ? ' mina-carousel--fitted' : ''}`}
      onPointerDown={(event) => {
        dragStartX.current = event.clientX
        // A touch tap fires no `pointermove` before it, so read the fingertip where it landed.
        track(event)
        if (fingertips && event.button === 2) hold.current = window.setTimeout(() => setIsArmed(true), COPY_HOLD_MS)
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        window.clearTimeout(hold.current)
        setCursor(null)
        setIsArmed(false)
      }}
      onPointerMove={track}
      // With fingertips the right button is the copy gesture, so the browser's own menu would land on top of it.
      onContextMenu={fingertips ? (event) => event.preventDefault() : undefined}
    >
      {current?.media_type === 'video' ? (
        <video
          className="mina-carousel__media"
          src={url ? cfVideo(url, videoWidth) : undefined}
          poster={
            !url
              ? undefined
              : current.thumbnail
                ? cfImageCarousel(current.thumbnail, imageWidthFor(boxWidth))
                : cfPoster(url, videoWidth)
          }
          onError={fallBack}
          aria-label={current.alt_text ?? undefined}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          className="mina-carousel__media"
          src={url ? cfImageCarousel(url, imageWidthFor(boxWidth)) : undefined}
          // Fetched with CORS so isLightImage may read its pixels; without it
          // the canvas is tainted and every picture reads as dark.
          crossOrigin="anonymous"
          alt={current?.alt_text ?? ''}
          onError={fallBack}
          onLoad={(event) => setIsLight(isLightImage(event.currentTarget))}
          draggable={false}
        />
      )}

      {cursor && icon && (
        <GlassDisc
          x={cursor.x}
          y={cursor.y}
          anchor="absolute"
          size={48}
          tone={copied ? 'accent' : icon === 'liked' ? 'liked' : isOverLight ? 'dark' : 'glass'}
        >
          <span className={`mina-carousel__icon mina-carousel__icon--${icon}`} />
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

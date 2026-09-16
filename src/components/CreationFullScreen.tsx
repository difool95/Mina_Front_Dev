import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { isMotion, promptOf, ratioOf } from '@/lib/generations'
import type { IconName } from '@/lib/icons'
import { cfImage, FULLSCREEN_WIDTH } from '@/lib/media'
import type { MegaGeneration } from '@/types/generation.types'

import { GlassDisc } from './GlassDisc'
import { Icon } from './Icon'
import { VideoPlayer } from './VideoPlayer'

import './CreationFullScreen.css'

interface CreationFullScreenProps {
  generation: MegaGeneration
  onClose: () => void
  onDownload: () => void
  onCopyLink: () => void
  onCopyMedia: () => void
}

/** The middle 30% across and 87.5% down saves the file; the rest zooms. */
const SAVE_ZONE = { x: 0.15, y: 0.4375 }

/** How long the right button has to be held before it offers the link instead. */
const HOLD_MS = 1000

/** How long the disc stays green after a copy. */
const FLASH_MS = 900

/**
 * One creation, filling the screen.
 *
 * A native `<dialog>` opened with `showModal()`, so Escape, focus trapping and
 * the page behind it staying put all come from the platform — same as the
 * legal and tutorial panels.
 *
 * The pointer is drawn rather than set through `cursor`, because the disc has
 * to blur what it passes over and a cursor image cannot: it is a flat picture
 * the compositor knows nothing about.
 *
 * The right button carries the two copy gestures: a quick press puts the image
 * itself on the clipboard, holding it past a second offers the share link
 * instead, and the disc shows which one it is about to do.
 */
export function CreationFullScreen({
  generation,
  onClose,
  onDownload,
  onCopyLink,
  onCopyMedia,
}: CreationFullScreenProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const hold = useRef<number | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [pointer, setPointer] = useState<{ x: number; y: number; save: boolean } | null>(null)
  const [pressing, setPressing] = useState(false)
  /** Set once the right button has been held long enough to mean "link". */
  const [armed, setArmed] = useState<IconName | null>(null)
  /** The copy that just happened, held briefly so the disc can confirm it. */
  const [copied, setCopied] = useState<IconName | null>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  useEffect(() => () => window.clearTimeout(hold.current ?? undefined), [])

  // What just happened wins, then what a release would do, then the plain
  // left-button reading of where the pointer is.
  const mode: IconName =
    copied ?? armed ?? (pointer?.save ? 'download' : zoomed ? 'reduce' : 'expand')

  const track = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = Math.abs((event.clientX - rect.left) / rect.width - 0.5)
    const offsetY = Math.abs((event.clientY - rect.top) / rect.height - 0.5)

    setPointer({
      x: event.clientX,
      y: event.clientY,
      save: offsetX <= SAVE_ZONE.x && offsetY <= SAVE_ZONE.y,
    })
  }

  const act = () => {
    if (pointer?.save) {
      onDownload()
      return
    }

    setZoomed(!zoomed)
  }

  const press = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      setPressing(true)
      return
    }

    if (event.button !== 2) return

    hold.current = window.setTimeout(() => setArmed('link'), HOLD_MS)
  }

  const release = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      setPressing(false)
      return
    }

    if (event.button !== 2) return

    window.clearTimeout(hold.current ?? undefined)

    // Held long enough to have armed the link; otherwise it was a quick press,
    // which copies the creation itself.
    const action: IconName = armed ?? 'copy'

    setArmed(null)
    setCopied(action)
    window.setTimeout(() => setCopied(null), FLASH_MS)

    if (action === 'link') onCopyLink()
    else onCopyMedia()
  }

  const leave = () => {
    window.clearTimeout(hold.current ?? undefined)
    setPointer(null)
    setPressing(false)
    setArmed(null)
  }

  const url = generation.mg_output_url ?? ''
  const motion = isMotion(generation)

  // `.mina-video` takes its size from whatever contains it, so the box has to
  // be cut to the creation's own shape or the controls would span the viewport
  // rather than the clip. Vertical is the safe default for an unknown platform.
  const [ratioWidth, ratioHeight] = (ratioOf(generation) ?? '9:16').split(':').map(Number)

  return (
    <dialog
      className="mina-fullscreen"
      ref={ref}
      // Closing always goes through `onClose` so React unmounts the dialog.
      // Calling `close()` instead leaves it mounted but shut, and it can then
      // never be reopened.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // A click that lands on the dialog itself rather than the media is a
      // click on the empty space around it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button
        className="mina-fullscreen__close"
        type="button"
        aria-label="Close"
        onClick={onClose}
      >
        <span className="mina-fullscreen__close-bar" aria-hidden="true" />
      </button>

      {/* A clip gets the shared video player, and none of the pointer gestures: its
          controls need a real cursor.*/}
      {motion ? (
        <div
          className="mina-fullscreen__player"
          style={{ '--player-ratio': ratioWidth! / ratioHeight! } as CSSProperties}
        >
          <VideoPlayer src={url} />
        </div>
      ) : (
        <div
          className={`mina-fullscreen__media${zoomed ? ' mina-fullscreen__media--zoomed' : ''}`}
          onMouseMove={track}
          onMouseLeave={leave}
          onMouseDown={press}
          onMouseUp={release}
          onClick={act}
          // The right button is the copy gesture here, so the browser's own
          // menu would land on top of it.
          onContextMenu={(event) => event.preventDefault()}
        >
          <img src={cfImage(url, FULLSCREEN_WIDTH, 90)} alt={promptOf(generation)} />
        </div>
      )}

      {pointer && (
        <GlassDisc
          x={pointer.x}
          y={pointer.y}
          tone={copied || (pressing && pointer.save) ? 'accent' : 'glass'}
        >
          <Icon name={mode} />
        </GlassDisc>
      )}
    </dialog>
  )
}

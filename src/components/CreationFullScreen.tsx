import { useEffect, useRef, useState } from 'react'

import { isMotion, promptOf } from '@/lib/generations'
import type { IconName } from '@/lib/icons'
import type { MegaGeneration } from '@/types/generation.types'

import { GlassDisc } from './GlassDisc'
import { Icon } from './Icon'

import './CreationFullScreen.css'

interface CreationFullScreenProps {
  generation: MegaGeneration
  onClose: () => void
  onDownload: () => void
}

/** The middle 30% across and 87.5% down saves the file; the rest zooms. */
const SAVE_ZONE = { x: 0.15, y: 0.4375 }

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
 */
export function CreationFullScreen({ generation, onClose, onDownload }: CreationFullScreenProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [zoomed, setZoomed] = useState(false)
  const [pointer, setPointer] = useState<{ x: number; y: number; save: boolean } | null>(null)
  const [pressing, setPressing] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  // The middle always saves, zoomed in or out; the surround toggles the zoom.
  const mode: IconName = pointer?.save ? 'download' : zoomed ? 'reduce' : 'expand'

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

  const url = generation.mg_output_url ?? ''

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

      <div
        className={`mina-fullscreen__media${zoomed ? ' mina-fullscreen__media--zoomed' : ''}`}
        onMouseMove={track}
        onMouseLeave={() => {
          setPointer(null)
          setPressing(false)
        }}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onClick={act}
      >
        {isMotion(generation) ? (
          <video src={url} autoPlay muted loop playsInline />
        ) : (
          <img src={url} alt={promptOf(generation)} />
        )}
      </div>

      {pointer && (
        <GlassDisc
          x={pointer.x}
          y={pointer.y}
          tone={pressing && pointer.save ? 'accent' : 'glass'}
        >
          <Icon name={mode} />
        </GlassDisc>
      )}
    </dialog>
  )
}

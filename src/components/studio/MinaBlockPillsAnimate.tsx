import { useRef, useState, type ReactNode } from 'react'

import { useLongPress } from '@/hooks/useLongPress'
import { animateThumbnail } from '@/lib/media'
import {
  ANIMATE_DURATION_HOLD_MS,
  ANIMATE_DURATION_RANGE,
  ANIMATE_RESOLUTIONS,
  animateCost,
  clampAnimateDuration,
} from '@/lib/studio'
import type { AnimateUpload } from '@/types'

import './MinaBlockPills.css'

/** Every pill's value is held by `MinaBlock`, whose call to action prices them and sends them. */
export function MinaBlockPillsAnimate({
  animateUploads,
  resolution,
  duration,
  onNextResolution,
  onNextDuration,
  onSetDuration,
  isSoundOn,
  onToggleSound,
  onOpenFilePicker,
  ratioPill,
}: {
  animateUploads: AnimateUpload[]
  resolution: (typeof ANIMATE_RESOLUTIONS)[number]
  /** In seconds. */
  duration: number
  onNextResolution: () => void
  onNextDuration: () => void
  /** A duration typed into the held pill, already kept within range. */
  onSetDuration: (seconds: number) => void
  isSoundOn: boolean
  onToggleSound: () => void
  /** Opens the file picker, as the upload row's "+" does. */
  onOpenFilePicker: () => void
  ratioPill: ReactNode
}) {
  // Shared by the resolution and duration pills, and follows both.
  const costTooltip = `${animateCost(resolution, duration)} matcha (${duration}s, Director, ${resolution})`
  const hold = useLongPress(ANIMATE_DURATION_HOLD_MS)
  // What is typed in the held duration pill; null while it only shows the duration.
  const [draft, setDraft] = useState<string | null>(null)
  const field = useRef<HTMLInputElement>(null)
  // The first upload stands in for the "+" once there is one.
  const first = animateUploads[0]
  const thumbnail = first && animateThumbnail(first, 22)

  return (
    <div className="mina-pills">
      {/* The only upload kind here, so it is always the one lit. */}
      <button
        className="mina-pills__pill paragraph-title-button pill"
        type="button"
        aria-pressed="true"
        data-tooltip="Add frames & elements - start frame first, then images / video / audio as references"
        onClick={onOpenFilePicker}
      >
        <span className="mina-pills__icon comment" aria-hidden="true">
          {thumbnail ? <img src={thumbnail} alt="" draggable={false} /> : '+'}
        </span>
        <span className="comment">Frames &amp; elements</span>
      </button>

      {/* Fixed for now: the one animation style there is. */}
      <span
        className="mina-pills__pill mina-pills__pill--text mina-pills__engine comment-button pill"
        data-tooltip="Director - 5 matchas"
      >
        <span className="comment">Director</span>
      </span>

      <button
        className="mina-pills__pill mina-pills__pill--text paragraph-title-button pill"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextResolution}
      >
        <span className="comment">{resolution}</span>
      </button>

      <button
        className="mina-pills__pill mina-pills__pill--text paragraph-title-button pill"
        type="button"
        data-tooltip="Toggle audio"
        onClick={onToggleSound}
      >
        <span className="comment">{isSoundOn ? 'Sound' : 'Muted'}</span>
      </button>

      {/* Always a field, read-only until held: a tap cycles the presets, a hold lets the user type the seconds. */}
      {/* A span, not a label: a label would hand every click to the field and open it for typing. */}
      <span
        className="mina-pills__pill mina-pills__pill--text mina-pills__pill--duration paragraph-title-button pill"
        data-tooltip={`${costTooltip} · Hold to type ${ANIMATE_DURATION_RANGE.min}–${ANIMATE_DURATION_RANGE.max}s`}
        onPointerDown={(event) => {
          // Once open, a press inside the field is just typing's own (placing the caret).
          if (draft !== null) return
          // A press never focuses the field by itself: only a hold opens it.
          event.preventDefault()
          hold.start(() => {
            setDraft(String(duration))
            field.current?.focus()
            field.current?.select()
          })
        }}
        onPointerUp={hold.end}
        onPointerLeave={hold.end}
        // A long press on touch would otherwise open the system menu.
        onContextMenu={(event) => event.preventDefault()}
        // On click on the duration pill
        onClick={() => draft === null && !hold.wasHeld() && onNextDuration()}
      >
        <input
          ref={field}
          className="mina-pills__duration comment"
          aria-label="Duration in seconds"
          inputMode="numeric"
          readOnly={draft === null}
          // Out of the tab order until held, so it is never open for typing by accident.
          tabIndex={draft === null ? -1 : undefined}
          value={draft ?? duration}
          style={{ width: `${String(draft ?? duration).length || 1}ch` }}
          // Digits only, two at most: nothing in range needs more.
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          // Clicking out confirms: kept within 4–30s, and an emptied field keeps the duration it had.
          onBlur={() => {
            if (draft) onSetDuration(clampAnimateDuration(Number(draft)))
            setDraft(null)
          }}
        />
        <span className="comment">s</span>
      </span>

      {ratioPill}
    </div>
  )
}
//////////////////////Animate (Mode)//////////////////////////////

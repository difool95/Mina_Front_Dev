import type { ReactNode } from 'react'

import { ANIMATE_DURATIONS, ANIMATE_MATCHA_COST, ANIMATE_RESOLUTIONS } from '@/lib/studio'

import './MinaBlockPills.css'

/** Every pill's value is held by `MinaBlock`, whose call to action prices them and sends them. */
export function MinaBlockPillsAnimate({
  resolution,
  duration,
  onNextResolution,
  onNextDuration,
  isSoundOn,
  onToggleSound,
  onOpenFilePicker,
  ratioPill,
}: {
  resolution: (typeof ANIMATE_RESOLUTIONS)[number]
  duration: (typeof ANIMATE_DURATIONS)[number]
  onNextResolution: () => void
  onNextDuration: () => void
  isSoundOn: boolean
  onToggleSound: () => void
  /** Opens the file picker, as the upload row's "+" does. */
  onOpenFilePicker: () => void
  ratioPill: ReactNode
}) {
  // Shared by the resolution and duration pills, and follows both.
  const costTooltip = `${ANIMATE_MATCHA_COST[resolution][duration]} matcha (${duration}, Director, ${resolution})`

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
          +
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

      <button
        className="mina-pills__pill mina-pills__pill--text paragraph-title-button pill"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextDuration}
      >
        <span className="comment">{duration}</span>
      </button>

      {ratioPill}
    </div>
  )
}
//////////////////////Animate (Mode)//////////////////////////////

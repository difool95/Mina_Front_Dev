import { useState, type ReactNode } from 'react'

import { ANIMATE_DURATIONS, ANIMATE_MATCHA_COST, ANIMATE_RESOLUTIONS } from '@/lib/studio'

import './MinaBlockPills.css'

/** Resolution, duration and the ratio pill are held by `MinaBlock`, whose call to action prices them. */
export function MinaBlockPillsAnimate({
  resolution,
  duration,
  onNextResolution,
  onNextDuration,
  ratioPill,
}: {
  resolution: (typeof ANIMATE_RESOLUTIONS)[number]
  duration: (typeof ANIMATE_DURATIONS)[number]
  onNextResolution: () => void
  onNextDuration: () => void
  ratioPill: ReactNode
}) {
  const [isMuted, setIsMuted] = useState(false)
  // Shared by the resolution and duration pills, and follows both.
  const costTooltip = `${ANIMATE_MATCHA_COST[resolution][duration]} matcha (${duration}, Director, ${resolution})`

  return (
    <div className="mina-pills">
      {/* The only upload kind here, so it is always the one lit. */}
      <button
        className="mina-pills__pill pill"
        type="button"
        aria-pressed="true"
        data-tooltip="Add frames & elements - start frame first, then images / video / audio as references"
      >
        <span className="mina-pills__icon h5" aria-hidden="true">
          +
        </span>
        <span className="h5">Frames &amp; elements</span>
      </button>

      {/* Fixed for now: the one animation style there is. */}
      <span
        className="mina-pills__pill mina-pills__pill--text mina-pills__engine pill-small"
        data-tooltip="Director - 5 matchas"
      >
        <span className="h5">Director</span>
      </span>

      <button
        className="mina-pills__pill mina-pills__pill--text pill"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextResolution}
      >
        <span className="h5">{resolution}</span>
      </button>

      <button
        className="mina-pills__pill mina-pills__pill--text pill"
        type="button"
        data-tooltip="Toggle audio"
        onClick={() => setIsMuted((was) => !was)}
      >
        <span className="h5">{isMuted ? 'Muted' : 'Sound'}</span>
      </button>

      <button
        className="mina-pills__pill mina-pills__pill--text pill"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextDuration}
      >
        <span className="h5">{duration}</span>
      </button>

      {ratioPill}
    </div>
  )
}

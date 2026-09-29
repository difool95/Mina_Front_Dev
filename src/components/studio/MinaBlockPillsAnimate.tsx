import { useState } from 'react'

import { ANIMATE_DURATIONS, ANIMATE_MATCHA_COST, ANIMATE_RESOLUTIONS } from '@/lib/studio'

import { MinaBlockRatioPill } from './MinaBlockRatioPill'

import './MinaBlockPills.css'

/** Resolution and duration are held by `MinaBlock`, whose call to action prices them. */
export function MinaBlockPillsAnimate({
  resolution,
  duration,
  onNextResolution,
  onNextDuration,
}: {
  resolution: (typeof ANIMATE_RESOLUTIONS)[number]
  duration: (typeof ANIMATE_DURATIONS)[number]
  onNextResolution: () => void
  onNextDuration: () => void
}) {
  const [isMuted, setIsMuted] = useState(false)
  // Shared by the resolution and duration pills, and follows both.
  const costTooltip = `${ANIMATE_MATCHA_COST[resolution][duration]} matcha (${duration}, Director, ${resolution})`

  return (
    <div className="mina-pills">
      {/* The only upload kind here, so it is always the one lit. */}
      <button
        className="mina-pills__pill"
        type="button"
        aria-pressed="true"
        data-tooltip="Add frames & elements - start frame first, then images / video / audio as references"
      >
        <span className="mina-pills__icon" aria-hidden="true">
          +
        </span>
        Frames &amp; elements
      </button>

      {/* Fixed for now: the one animation style there is. */}
      <span className="mina-pills__pill mina-pills__pill--text" data-tooltip="Director - 5 matchas">
        Director
      </span>

      <button
        className="mina-pills__pill mina-pills__pill--text"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextResolution}
      >
        {resolution}
      </button>

      <button
        className="mina-pills__pill mina-pills__pill--text"
        type="button"
        data-tooltip="Toggle audio"
        onClick={() => setIsMuted((was) => !was)}
      >
        {isMuted ? 'Muted' : 'Sound'}
      </button>

      <button
        className="mina-pills__pill mina-pills__pill--text"
        type="button"
        data-tooltip={costTooltip}
        onClick={onNextDuration}
      >
        {duration}
      </button>

      <MinaBlockRatioPill />
    </div>
  )
}

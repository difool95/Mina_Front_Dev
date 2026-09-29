import { useState } from 'react'

import { ANIMATE_DURATIONS, ANIMATE_MATCHA_COST, ANIMATE_RESOLUTIONS } from '@/lib/studio'

import { MinaBlockRatioPill } from './MinaBlockRatioPill'

import './MinaBlockPills.css'

export function MinaBlockPillsAnimate() {
  const [resolutionIndex, setResolutionIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [durationIndex, setDurationIndex] = useState(0)
  const resolution = ANIMATE_RESOLUTIONS[resolutionIndex]!
  const duration = ANIMATE_DURATIONS[durationIndex]!
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
        onClick={() => setResolutionIndex((index) => (index + 1) % ANIMATE_RESOLUTIONS.length)}
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
        onClick={() => setDurationIndex((index) => (index + 1) % ANIMATE_DURATIONS.length)}
      >
        {duration}
      </button>

      <MinaBlockRatioPill />
    </div>
  )
}

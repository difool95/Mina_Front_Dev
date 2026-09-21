import type { CSSProperties } from 'react'

import './MatchaSlider.css'

export interface MatchaStop {
  matchas: number
  /** Already converted and formatted — the track knows nothing of currency. */
  price: string
  /** Where it stands along the track, as a percentage of it. */
  at: number
}

interface MatchaSliderProps {
  stops: readonly MatchaStop[]
  /** The chosen stop, by its matcha count. */
  value: number
  onChange: (matchas: number) => void
}

/**
 * A track of fixed stops rather than a continuous range: the packs are the
 * only amounts that can be bought, so there is nothing between them to land
 * on. Each stop carries its amount above and its price below, and every stop
 * up to the chosen one reads as reached.
 *
 * Each stop says where it stands, so the spacing is the design's to set and
 * not a function of how many packs there happen to be.
 */
export function MatchaSlider({ stops, value, onChange }: MatchaSliderProps) {
  const chosen = stops.findIndex((stop) => stop.matchas === value)

  return (
    <div className="mina-slider">
      {/* A length of rail between each pair of stops rather than one bar
          behind them all, so each can stop short of the dots at its ends and
          fill on its own once the chosen stop is past it. */}
      {stops.slice(0, -1).map((stop, index) => (
        <span
          className={`mina-slider__rail${index < chosen ? ' mina-slider__rail--filled' : ''}`}
          key={stop.matchas}
          style={{ left: `${stop.at}%`, right: `${100 - stops[index + 1]!.at}%` }}
        />
      ))}

      {stops.map((stop, index) => (
        <button
          className={`mina-slider__stop${index <= chosen ? ' mina-slider__stop--on' : ''}`}
          type="button"
          key={stop.matchas}
          style={{ '--at': `${stop.at}%` } as CSSProperties}
          aria-pressed={index === chosen}
          aria-label={`${stop.matchas} matcha for ${stop.price}`}
          onClick={() => onChange(stop.matchas)}
        >
          <span className="mina-slider__amount">{stop.matchas}</span>
          <span className="mina-slider__dot" />
          <span className="mina-slider__price">{stop.price}</span>
        </button>
      ))}
    </div>
  )
}

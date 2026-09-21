import { ICON_PATHS, type IconName } from '@/lib/icons'

/**
 * A stroke icon from `lib/icons`.
 *
 * Takes its colour from whatever it sits in via `currentColor`, so the same
 * icon works on glass, on paper, or inverted, without a variant each time.
 */
export function Icon({
  name,
  size = 22,
  isFilled = false,
}: {
  name: IconName
  size?: number
  /** Floods a closed shape with the same colour it is drawn in — a liked heart. */
  isFilled?: boolean
}) {
  const entry = ICON_PATHS[name]
  // Most icons are a bare list of paths on the house 24×24 grid; one that
  // brought its own grid says so, and carries the stroke drawn at that size.
  const { box, stroke, paths } =
    'paths' in entry ? entry : { box: '0 0 24 24', stroke: 1.5, paths: entry }

  return (
    <svg
      viewBox={box}
      width={size}
      height={size}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

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
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

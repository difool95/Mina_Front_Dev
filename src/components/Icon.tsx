import { ICON_PATHS, type IconName } from '@/lib/icons'

/**
 * A stroke icon from `lib/icons`.
 *
 * Takes its colour from whatever it sits in via `currentColor`, so the same
 * icon works on glass, on paper, or inverted, without a variant each time.
 */
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
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

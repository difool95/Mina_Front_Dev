/**
 * Stroke paths for the app's icons, each drawn on a 24×24 grid.
 *
 * Paths only — no `<svg>`, no colour, no width. `components/Icon` supplies
 * those, so an icon can be reused at any size and take the colour of whatever
 * it sits in.
 *
 * `expand` and `reduce` share one diagonal, top-right to bottom-left, and
 * differ only in which end of each bracket the corner sits on: out at the
 * frame to open up, in towards the middle to pull back.
 */
export const ICON_PATHS = {
  download: ['M12 5.5v8.5', 'M8.5 10.5 12 14l3.5-3.5', 'M7 17.5h10'],
  expand: ['M13 7h4.5v4.5', 'M11 17H6.5v-4.5'],
  reduce: ['M18 10.5h-4.5V6', 'M6 13.5h4.5V18'],
} as const

export type IconName = keyof typeof ICON_PATHS

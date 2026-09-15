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
  /* Two rings broken on the diagonal, joined by the bar that runs through the
     gap each one leaves. */
  link: [
    'M11.4 9A3.6 3.6 0 1 1 15 12.6',
    'M12.6 15A3.6 3.6 0 1 1 9 11.4',
    'M10.5 13.5 13.5 10.5',
  ],
  /* Two square sheets, the front one whole and the back one drawn only where
     the front does not already cover it. */
  copy: ['M9 9V4h11v11h-5', 'M4 9h11v11H4z'],
} as const

export type IconName = keyof typeof ICON_PATHS

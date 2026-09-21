/**
 * Stroke paths for the app's icons, each drawn on a 24×24 grid.
 *
 * Paths only — no `<svg>`, no colour, no width. `components/Icon` supplies
 * those, so an icon can be reused at any size and take the colour of whatever
 * it sits in.
 *
 * An icon that arrives drawn on its own grid keeps it, as `{ box, stroke,
 * paths }` — redrawing it onto 24×24 by hand is how a shape gets subtly
 * wrong. `Icon` reads whichever form it finds.
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
  /* A single open chevron, mirrored across the vertical for the other
     direction — the carousel's paging arrows. */
  prev: ['M14.5 6.5 8.5 12l6 5.5'],
  next: ['M9.5 6.5 15.5 12l-6 5.5'],
  /* Two arcs meeting at the point. Closed, so `Icon` can fill it once the
     creation is liked. */
  heart: ['M12 19.5c-1.2-.9-7-4.6-7-9.1a3.9 3.9 0 0 1 7-2.4 3.9 3.9 0 0 1 7 2.4c0 4.5-5.8 8.2-7 9.1z'],
  /* The matcha cup, as drawn: the foam, the stem, then the cup and its rim. */
  matcha: {
    box: '0 0 128 147',
    /* Heavier than the 12 it was drawn at: at 12px across, the thinner line
       all but disappears beside the text it sits with. */
    stroke: 15,
    paths: [
      'M95.8665 77.4368L85.9668 69.64C83.3154 67.5519 79.6389 67.3522 76.7177 69.1409L71.4052 72.4983C68.0404 74.6013 63.6425 73.9201 61.0176 70.8977L57.7549 66.9984C55.3029 64.1159 51.1666 63.3458 47.8415 65.1526L31.5469 74.007',
      'M87.5128 4.82837L64.8774 21.5266V43.8245',
      'M28.8157 44.5255H100.94M28.8157 44.5255L35.2117 139.385H94L100.94 44.5255M28.8157 44.5255H14.6624M100.94 44.5255H114.457',
    ],
  },
} as const

export type IconName = keyof typeof ICON_PATHS

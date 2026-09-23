//THIS SCRIPT IS RELATED TO ANY HELPERS CONSTANTS RELATED TO THE GENERATIONS MEDIA, LIKE IMAGE OR VIDEO IN PROFILE.
/**
 * Cloudflare delivery URLs for the creations on `assets.faltastudio.com`.
 *
 * Originals are enormous — a still measures 27 MB, a clip 6.9 MB — so nothing
 * ever displays one. Images go through `/cdn-cgi/image`, video through the
 * separate `/cdn-cgi/media` pipeline, and both are asked for at the size the
 * tile actually occupies.
 *
 * The transformed URLs carry **no** `Access-Control-Allow-Origin` header, while
 * the originals do. Display never needs it; `fetch` always does. So anything
 * that reads bytes — download, clipboard, canvas — must keep the original URL,
 * and these builders exist only for `src`, `poster` and `background-image`.
 */

const ASSET_ORIGIN = 'https://assets.faltastudio.com/'

const VIDEO_FILE = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i

/**
 * The path a transform hangs off, or null when the URL must be left alone.
 *
 * Unwraps a URL that is already transformed rather than nesting a second
 * transform inside the first, which breaks. `creators/` sits outside the
 * pipeline and 404s when wrapped, and the raster transform rejects SVG.
 */
function assetPath(url: string) {
  if (!url.startsWith(ASSET_ORIGIN)) return null

  const rest = url.slice(ASSET_ORIGIN.length)
  const path = /^cdn-cgi\/(?:image|media)\/[^/]+\/(.+)$/.exec(rest)?.[1] ?? rest

  if (path.startsWith('creators/') || /\.svg(?:$|[?#])/i.test(path)) return null

  return path
}

/**
 * Widths we are willing to ask for.
 *
 * Every distinct width is its own transform and its own cache entry, so a
 * measured width is snapped up to the next rung — otherwise a dragged window
 * would mint a cold transform per pixel. Video runs a coarser ladder because
 * a transcode costs far more than a resize.
 */
const IMAGE_WIDTHS = [240, 320, 400, 480, 560, 640, 720, 800, 960, 1200, 1440, 1920]
const VIDEO_WIDTHS = [240, 360, 480, 640, 854, 1280]

/** The most a creation is ever shown at, full screen included. */
export const FULLSCREEN_WIDTH = 1920

function snap(width: number, ladder: readonly number[]) {
  return ladder.find((rung) => rung >= width) ?? ladder[ladder.length - 1]!
}

/**
 * What to request for a tile of `cssWidth`, at the screen's pixel density.
 *
 * Capped at 2× because beyond that the extra pixels are invisible and the
 * bytes are not.
 */
function requestWidth(cssWidth: number, ladder: readonly number[]) {
  const density = Math.min(window.devicePixelRatio || 1, 2)

  return snap(Math.round((cssWidth || 360) * density), ladder)
}

export function imageWidthFor(cssWidth: number) {
  return requestWidth(cssWidth, IMAGE_WIDTHS)
}

export function videoWidthFor(cssWidth: number) {
  return requestWidth(cssWidth, VIDEO_WIDTHS)
}

export function isVideoUrl(url: string) {
  return VIDEO_FILE.test(url.split('?')[0] ?? '')
}

export function cfImage(url: string, width: number, quality = 80) {
  const path = assetPath(url)

  if (!path || isVideoUrl(path)) return url

  return `${ASSET_ORIGIN}cdn-cgi/image/width=${width},quality=${quality},format=auto/${path}`
}

export function cfImageCarousel(url: string, width: number, quality = 90) {
  const path = assetPath(url)

  if (!path || isVideoUrl(path)) return url

  return `${ASSET_ORIGIN}cdn-cgi/image/width=${width},quality=${quality},format=auto/${path}`
}

export function cfVideo(url: string, width: number) {
  const path = assetPath(url)

  if (!path || !isVideoUrl(path)) return url

  return `${ASSET_ORIGIN}cdn-cgi/media/mode=video,width=${width}/${path}`
}

/**
 * A still lifted out of a clip, so a video tile can paint from ~23 KB instead
 * of pulling megabytes of video just to stop being blank.
 */
export function cfPoster(url: string, width: number) {
  const path = assetPath(url)

  if (!path || !isVideoUrl(path)) return undefined

  return `${ASSET_ORIGIN}cdn-cgi/media/mode=frame,time=0s,width=${width},format=jpg/${path}`
}

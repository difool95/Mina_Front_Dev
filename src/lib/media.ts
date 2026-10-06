//THIS SCRIPT IS RELATED TO ANY HELPERS CONSTANTS RELATED TO THE GENERATIONS MEDIA, LIKE IMAGE OR VIDEO IN PROFILE.
import { UPLOAD_ERRORS, UPLOAD_PREP } from '@/lib/studio'

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

/** Brightness (0-255) above which a picture counts as light. */
const LIGHT_IMAGE_THRESHOLD = 160

//THIS METHOD IS USED TO DETERMINE IF AN IMAGE IS LIGHT OR DARK, IT TAKES AN HTMLIMAGEELEMENT AS PARAMETER AND RETURNS A BOOLEAN
export function isLightImage(image: HTMLImageElement) {
  const size = 16
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return false

  context.drawImage(image, 0, 0, size, size)

  let pixels: Uint8ClampedArray
  try {
    pixels = context.getImageData(0, 0, size, size).data
  } catch {
    return false
  }

  let total = 0
  for (let i = 0; i < pixels.length; i += 4) {
    // Perceived brightness: green counts most, blue least.
    total += 0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!
  }

  return total / (size * size) > LIGHT_IMAGE_THRESHOLD
}

//Check if the image has transparency by checking the alpha channel of each pixel. If any pixel has an alpha value less than 255, the image is considered to have transparency.
function hasTransparency(context: CanvasRenderingContext2D) {
  const { data } = context.getImageData(0, 0, context.canvas.width, context.canvas.height)

  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 255) return true
  }

  return false
}

/**
 * The picture to upload for a file picked in the studio, by the rules in
 * `UPLOAD_PREP`. Throws a message for the user when the file is refused.
 *
 * Decoded by the browser, so a format it cannot read — HEIC outside Safari —
 * is refused rather than converted.
 */
export async function prepareStudioImage(file: File): Promise<Blob> {
  if (file.size > UPLOAD_PREP.maxBytes) throw new Error(UPLOAD_ERRORS.tooHeavy(file.name))

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(UPLOAD_ERRORS.unreadable(file.name))
  })
  const longest = Math.max(bitmap.width, bitmap.height)

  if (longest > UPLOAD_PREP.maxSide) throw new Error(UPLOAD_ERRORS.tooLarge(file.name))

  const isTooSmall = longest < UPLOAD_PREP.minSide
  // If the file is small enough to be uploaded as-is, and it is not too small, and it is of a type that we want to keep,
  // then return the file as-is. Otherwise, we need to resize or re-encode the image.
  if (!isTooSmall && file.size <= UPLOAD_PREP.reduceAbove && UPLOAD_PREP.keptTypes.includes(file.type)) return file

  const scale = isTooSmall ? UPLOAD_PREP.upscaleSide / longest : Math.min(1, UPLOAD_PREP.targetSide / longest)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const type = hasTransparency(context) ? 'image/webp' : 'image/jpeg'

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(UPLOAD_ERRORS.unreadable(file.name)))),
      type,
      UPLOAD_PREP.quality,
    )
  })
}

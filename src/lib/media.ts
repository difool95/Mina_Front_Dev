//THIS SCRIPT IS RELATED TO ANY HELPERS CONSTANTS RELATED TO THE GENERATIONS MEDIA, LIKE IMAGE OR VIDEO IN PROFILE.
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  MP3,
  Mp3OutputFormat,
  Mp4OutputFormat,
  Output,
  Quality,
  WAVE,
  WavOutputFormat,
  type ConversionVideoOptions,
  type InputFormat,
  type OutputFormat,
  type VideoSample,
} from 'mediabunny'

import {
  UPLOAD_ERRORS,
  UPLOAD_PREP,
  ANIMATE_MEDIA,
} from '@/lib/studio'
import type { AnimateUpload, PreparedMedia } from '@/types'

/**
 * Cloudflare delivery URLs for the creations on `assets.faltastudio.com`.
 *
 * Originals are enormous — a still measures 27 MB, a clip 6.9 MB — so nothing
 * ever displays one. Images go through `/cdn-cgi/image`, video through the
 * separate `/cdn-cgi/media` pipeline, and both are asked for at the size the
 * tile actually occupies.
 *
 * Both the originals and the transformed URLs answer with
 * `Access-Control-Allow-Origin: *` (checked 2026-10-06), so a canvas can read
 * a transformed image as long as its `<img>` asks with `crossOrigin`.
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

/** How long the right button has to be held over a creation before it offers the link instead of the picture. */
export const COPY_HOLD_MS = 1000

/** Whether a pointer event landed on the video player's own controls, which a view's gestures must leave alone. */
export function isOnVideoControls(target: EventTarget | null) {
  return (target as HTMLElement).closest('.mina-video__controls') !== null
}

/** How long the glass disc stays green after a copy. */
export const COPY_FLASH_MS = 900

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

//this method is used to prepare an image for upload, it takes a File object as parameter and returns a Promise that resolves to a Blob object.
//It checks the file size, creates an ImageBitmap, and resizes the image if necessary. It also checks if the image has transparency and sets the
//appropriate MIME type for the output Blob.
export async function prepareStudioImage(file: File): Promise<Blob> {
  if (file.size > UPLOAD_PREP.maxBytes) throw new Error(UPLOAD_ERRORS.tooHeavy(file.name))

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(UPLOAD_ERRORS.unreadable(file.name))
  })
  const longest = Math.max(bitmap.width, bitmap.height)

  const isTooSmall = longest < UPLOAD_PREP.minSide
  // A light file can still be huge in pixels, so it only goes as it is when it is also no bigger than `targetSide`.
  const isAsIs =
    !isTooSmall &&
    longest <= UPLOAD_PREP.targetSide &&
    file.size <= UPLOAD_PREP.reduceAbove &&
    UPLOAD_PREP.keptTypes.includes(file.type)
  if (isAsIs) return file

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

//////////////////////Animate (Mode)//////////////////////////////
export const AUDIO_ICON_URL = '/assets/gifs/audio-mina-icon.gif'

/**
 * A still standing for an Animate upload `cssWidth` wide: the picture itself, a video's first
 * frame, or Mina's audio icon for a sound. Undefined for a video not on R2 yet, which has no frame to lift.
 */
export function animateThumbnail({ mediaType, url }: Pick<AnimateUpload, 'mediaType' | 'url'>, cssWidth: number) {
  if (mediaType === 'audio') return AUDIO_ICON_URL
  if (mediaType === 'video') return cfPoster(url, videoWidthFor(cssWidth))

  return cfImage(url, imageWidthFor(cssWidth))
}

//this method is used to fit the seconds of a media file to the room seconds, it returns an object with the new seconds and a change property that indicates
//if the media was trimmed or lengthened.
function fitSeconds(seconds: number, roomSeconds: number): Pick<PreparedMedia, 'seconds' | 'change'> {
  if (seconds > roomSeconds) return { seconds: roomSeconds, change: 'trimmed' }
  if (seconds < ANIMATE_MEDIA.minSeconds) return { seconds: ANIMATE_MEDIA.minSeconds, change: 'lengthened' }

  return { seconds }
}

/** The formats a sound can be sent in as it is, each with the type it is uploaded as and how a cut of it is written. */
const KEPT_AUDIO = new Map<InputFormat, { type: string; output: () => OutputFormat }>([
  [MP3, { type: 'audio/mpeg', output: () => new Mp3OutputFormat() }],
  [WAVE, { type: 'audio/wav', output: () => new WavOutputFormat() }],
])

//This method prepares a sound for Animate mode. An MP3 or WAV is kept as it is, or cut without re-encoding when it is too long, so its bitrate never rises.
//Anything else (another format, a sound under 2s, a WAV still too heavy once cut) is rewritten as WAV.
export async function prepareStudioAudio(file: File, roomSeconds: number): Promise<PreparedMedia> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })

  try {
    const format = await input.getFormat().catch(() => undefined)
    const kept = format && KEPT_AUDIO.get(format)

    if (kept) {
      const duration = await input.computeDuration()
      const fit = fitSeconds(duration, roomSeconds)
      // Its size once cut: a WAV recorded at high settings can still be over the limit.
      const isLight = (file.size * Math.min(duration, fit.seconds)) / duration < ANIMATE_MEDIA.maxAudioUploadBytes

      if (fit.change !== 'lengthened' && isLight) {
        const blob =
          fit.change === 'trimmed'
            ? await cutAudio(input, fit.seconds, kept.output())
            : new Blob([file], { type: kept.type })
        if (blob) return { ...fit, blob }
      }
    }
  } finally {
    input.dispose()
  }

  return rewriteAsWav(file, roomSeconds)
}

/** `input` up to `end` seconds, its packets copied as they are, or null when they cannot be. */
async function cutAudio(input: Input, end: number, format: OutputFormat) {
  const output = new Output({ format, target: new BufferTarget() })
  const conversion = await Conversion.init({
    input,
    output,
    trim: { start: 0, end },
    copy: { boundaryPolicy: 'shrink' },
    // Cover art and other tags only add weight.
    tags: {},
    showWarnings: false,
  })

  if (!conversion.isValid) return null

  await conversion.execute()

  return new Blob([output.target.buffer!], { type: format.mimeType })
}

//This method reduces or increases the seconds of a sound to fit the room seconds and writes it as a 44.1 kHz 16-bit WAV, it returns an object with the new seconds and
//a change property that indicates if the sound was trimmed or lengthened and the new blob.
async function rewriteAsWav(file: File, roomSeconds: number): Promise<PreparedMedia> {
  const decoded = await new OfflineAudioContext(1, 1, ANIMATE_MEDIA.sampleRate)
    .decodeAudioData(await file.arrayBuffer())
    .catch(() => {
      throw new Error(UPLOAD_ERRORS.unreadableMedia(file.name))
    })
  const fit = fitSeconds(decoded.duration, roomSeconds)

  // A new buffer starts silent, so a short sound is padded and a long one cut by the copy alone.
  const channels = Math.min(decoded.numberOfChannels, ANIMATE_MEDIA.maxChannels)
  const length = Math.round(fit.seconds * decoded.sampleRate)
  const samples = Array.from({ length: channels }, (_, channel) => {
    const data = new Float32Array(length)
    data.set(decoded.getChannelData(channel).subarray(0, length))
    return data
  })

  return { ...fit, blob: encodeWav(samples, decoded.sampleRate) }
}

//This method encodes to WAV a given array of Float32Array channels and a sample rate, it returns a Blob with the WAV data.
function encodeWav(channels: Float32Array[], sampleRate: number) {
  const length = channels[0]!.length
  const blockAlign = channels.length * 2
  const view = new DataView(new ArrayBuffer(44 + length * blockAlign))
  const text = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))

  text(0, 'RIFF')
  view.setUint32(4, 36 + length * blockAlign, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels.length, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, length * blockAlign, true)

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (const channel of channels) {
      const sample = Math.max(-1, Math.min(1, channel[i]!))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

//This method is for preparing a video file for Animate mode. It checks the file size, decodes the video, fits it to the room seconds, scales it if necessary,
//and encodes it to MP4 format. It returns an object containing the new seconds, change type (trimmed or lengthened), and the resulting Blob.
export async function prepareStudioVideo(file: File, roomSeconds: number): Promise<PreparedMedia> {
  if (file.size > ANIMATE_MEDIA.maxVideoBytes) throw new Error(UPLOAD_ERRORS.tooHeavyVideo(file.name))

  const unreadable = () => new Error(UPLOAD_ERRORS.unreadableMedia(file.name))
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })

  try {
    const track = await input.getPrimaryVideoTrack().catch(() => null)
    if (!track) throw unreadable()

    const duration = await input.computeDuration()
    const fit = fitSeconds(duration, roomSeconds)
    const end = Math.min(duration, fit.seconds)
    const scale = Math.min(1, ANIMATE_MEDIA.longSide / Math.max(track.displayWidth, track.displayHeight))
    const isLight = scale === 1 && file.size < ANIMATE_MEDIA.maxVideoUploadBytes
    // 10% headroom for the container and the encoder overshooting its target.
    const budget = (ANIMATE_MEDIA.maxVideoUploadBytes * 8 * 0.9) / fit.seconds - ANIMATE_MEDIA.videoAudioBitrate
    // Never above the original's own bitrate: re-encoding cannot add quality, only weight.
    const original = (file.size * 8) / duration
    const bitrate = Math.round(Math.min(ANIMATE_MEDIA.maxVideoBitrate, budget, original))

    const encoded: ConversionVideoOptions = {
      codec: 'avc',
      // An object: a bare number would be read as a 0–1 quality level, not bits per second.
      quality: new Quality({ bitrate }),
      // Even sides: the encoder refuses odd ones.
      width: Math.round((track.displayWidth * scale) / 2) * 2,
      height: Math.round((track.displayHeight * scale) / 2) * 2,
      // Both sides already keep the video's shape, so filling them only absorbs the even rounding.
      fit: 'fill',
      forceTranscode: !isLight || fit.change === 'lengthened',
      process: fit.change === 'lengthened' ? holdLastFrame(end, fit.seconds) : undefined,
    }

    // The shape as displayed: a scaled copy keeps it.
    const frame = { width: track.displayWidth, height: track.displayHeight }
    const blob = await convertToMp4(input, end, encoded)
    if (blob) return { ...fit, ...frame, blob }

    // No encoder: copy what can be copied, which cannot make a clip longer.
    if (fit.change === 'lengthened') throw new Error(UPLOAD_ERRORS.tooShort(file.name))

    const copied = await convertToMp4(input, end, {})
    if (!copied) throw unreadable()

    return { ...fit, ...frame, blob: copied }
  } finally {
    input.dispose()
  }
}

/** `input` up to `end` seconds as an MP4, or null when the browser cannot make its video track that way. */
async function convertToMp4(input: Input, end: number, video: ConversionVideoOptions) {
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() })
  const conversion = await Conversion.init({
    input,
    output,
    trim: { start: 0, end },
    // A copied cut lands on packet boundaries: shrink it, so the 30s are never overrun.
    copy: { boundaryPolicy: 'shrink' },
    video,
    audio: { codec: 'aac', quality: new Quality({ bitrate: ANIMATE_MEDIA.videoAudioBitrate }) },
    showWarnings: false,
  })

  if (!conversion.isValid || conversion.discardedTracks.some(({ track }) => track.isVideoTrack())) return null

  await conversion.execute()

  return new Blob([output.target.buffer!], { type: 'video/mp4' })
}

/** A `process` hook that repeats the frame ending at `end` until `until` seconds. */
function holdLastFrame(end: number, until: number) {
  return (sample: VideoSample) => {
    const sampleEnd = sample.timestamp + sample.duration
    if (sampleEnd < end - 0.001) return sample

    // Repeated at the clip's own pace: a single long frame stalls players, and some tools count it as a shorter clip.
    // Identical frames cost the encoder almost nothing.
    const step = sample.duration || 1 / 30
    const held = [sample]

    for (let at = sampleEnd; at < until - 0.001; at += step) {
      const copy = sample.clone()
      copy.setTimestamp(at)
      copy.setDuration(Math.min(step, until - at))
      held.push(copy)
    }

    return held
  }
}
//////////////////////Animate (Mode)//////////////////////////////

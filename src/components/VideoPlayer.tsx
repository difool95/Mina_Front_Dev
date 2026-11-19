import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'

import { formatDuration } from '@/lib/format'

import './VideoPlayer.css'

/** How long after the pointer leaves before the controls fade out. */
const HIDE_DELAY = 3000

/**
 * Video with custom controls: play/pause, a seekable timeline, remaining time
 * and mute. Controls fade out once the pointer has been away for 3s.
 *
 * Starts muted because browsers refuse to autoplay a video with sound — the
 * mute button is how the viewer turns it on.
 */
export function VideoPlayer({
  src,
  poster,
  className,
  onError,
  ref,
}: {
  src: string
  /** The video element itself, for a parent that copies the frame on show. */
  ref?: Ref<HTMLVideoElement | null>
  /** Shown until the first frame has loaded. */
  poster?: string
  /** Added to the player's own class, for a parent that sizes it. */
  className?: string
  onError?: (event: React.SyntheticEvent<HTMLVideoElement>) => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  // Read once mounted, when the element is always there.
  useImperativeHandle(ref, () => video.current!, [])

  const scheduleHide = () => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), HIDE_DELAY)
  }

  // Hide on load too, so the controls do not sit there if nobody interacts.
  useEffect(() => {
    scheduleHide()
    return () => clearTimeout(hideTimer.current)
  }, [])

  const played = duration > 0 ? (time / duration) * 100 : 0

  return (
    <div
      className={`mina-video${showControls ? '' : ' mina-video--idle'}${className ? ` ${className}` : ''}`}
      onPointerEnter={() => {
        clearTimeout(hideTimer.current)
        setShowControls(true)
      }}
      onPointerLeave={scheduleHide}
    >
      <video
        className="mina-video__media"
        ref={video}
        src={src}
        poster={poster}
        // Fetched with CORS so the frame on show can be painted onto a canvas and copied;
        // without it the canvas is tainted. The assets answer with `Access-Control-Allow-Origin: *`.
        crossOrigin="anonymous"
        onError={onError}
        autoPlay
        muted
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />

      <div className="mina-video__controls">
        <button
          className="mina-video__button"
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            const el = video.current
            if (!el) return
            if (el.paused) void el.play()
            else el.pause()
          }}
        >
          <span className={`mina-video__icon mina-video__icon--${playing ? 'pause' : 'play'}`} />
        </button>

        <input
          className="mina-video__seek"
          style={{ '--played': `${played}%` } as CSSProperties}
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={time}
          aria-label="Seek"
          onChange={(event) => {
            const next = Number(event.target.value)
            setTime(next)
            if (video.current) video.current.currentTime = next
          }}
        />

        <span className="mina-video__time">{formatDuration(duration - time)}</span>

        <button
          className="mina-video__button"
          type="button"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => {
            const el = video.current
            if (!el) return
            el.muted = !el.muted
            setMuted(el.muted)
          }}
        >
          {/* Each file is named for what a click does: muted shows "unmute". */}
          <span className={`mina-video__icon mina-video__icon--${muted ? 'unmute' : 'mute'}`} />
        </button>
      </div>
    </div>
  )
}

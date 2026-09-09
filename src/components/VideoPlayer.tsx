import { useEffect, useRef, useState, type CSSProperties } from 'react'

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
export function VideoPlayer({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

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
      className={`mina-video${showControls ? '' : ' mina-video--idle'}`}
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
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5l11 7-11 7z" />
            </svg>
          )}
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
          {muted ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 9h3l5-4v14l-5-4H4z" />
              <path d="M15.2 10l1.1-1.1 4.6 4.6-1.1 1.1z" />
              <path d="M19.8 8.9l1.1 1.1-4.6 4.6-1.1-1.1z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 9h3l5-4v14l-5-4H4z" />
              <path d="M15.5 8.6a4.5 4.5 0 010 6.8v-1.7a3 3 0 000-3.4zM18 6.4a7.5 7.5 0 010 11.2v-1.7a5.8 5.8 0 000-7.8z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

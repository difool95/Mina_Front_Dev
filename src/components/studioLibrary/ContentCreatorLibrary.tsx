import { useEffect, useMemo, useRef, useState } from 'react'

import { CreationMedia } from '@/components/CreationMedia'
import { RoleTagCard } from '@/components/RoleTagCard'
import { useContentLibrary } from '@/hooks/useContentLibrary'
import { MINA_LOGO_URL } from '@/lib/constants'
import { toRoman } from '@/lib/format'
import { cfImage, cfVideo, imageWidthFor, videoWidthFor } from '@/lib/media'
import {
  LIBRARY_HIDE_DELAY_MS,
  CONTENT_LIBRARY_MAX_VISIBLE,
  LIBRARY_PER_ROW,
  libraryPreviewWidth,
  pickRandom,
} from '@/lib/studio'
import type { ContentLibraryItem } from '@/types'

/**
 * Animate mode's library: video templates, laid out like the Scene Library.
 *
 * A card shows its thumbnail; hovered, it plays its video over it, and the
 * preview on the right plays the same one with sound. The preview keeps
 * playing — muted — after the card is left, and hovering it turns sound back
 * on. The card plays muted so the sound only ever comes from one place.
 *
 * Only `CONTENT_LIBRARY_MAX_VISIBLE` cards are visible at once. Hovering a hidden one
 * fades it in straight away; after `LIBRARY_HIDE_DELAY_MS`, one random visible
 * card fades out for it.
 *
 * "Content" is the one tab for now; "Creator" is kept for the Creators Library.
 */
export function ContentCreatorLibrary({ onClose }: { onClose: () => void }) {
  const { data: items = [] } = useContentLibrary()
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState<string[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  // Cards revealed less than the delay ago, which the fade-out must spare.
  const fresh = useRef(new Set<string>())
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items

    return items.filter((item) =>
      [item.title, item.content_type, item.asset_ref, ...(item.keywords ?? []), ...(item.tags ?? [])].some(
        (text) => text?.toLowerCase().includes(term),
      ),
    )
  }, [items, search])

  // A fresh, scattered set of visible cards every time the list itself changes.
  useEffect(() => {
    setShown(pickRandom(matches, CONTENT_LIBRARY_MAX_VISIBLE).map((item) => item.id))
  }, [matches])

  // Shows the card at once; after the delay, one random other fades out in its
  // place — so fade-outs keep the rhythm of the hovers that caused them, and
  // never take a card hovered within that delay.
  const reveal = (id: string) => {
    setPreviewId(id)
    setHoveredId(id)
    if (shown.includes(id)) return

    fresh.current.add(id)
    setShown((ids) => (ids.includes(id) ? ids : [...ids, id]))

    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      fresh.current.delete(id)
      setShown((ids) => {
        const droppable = ids.filter((shownId) => !fresh.current.has(shownId))
        if (ids.length <= CONTENT_LIBRARY_MAX_VISIBLE || !droppable.length) return ids

        const dropped = droppable[Math.floor(Math.random() * droppable.length)]
        return ids.filter((shownId) => shownId !== dropped)
      })
    }, LIBRARY_HIDE_DELAY_MS)

    timers.current.add(timer)
  }

  const preview = matches.find((item) => item.id === previewId) ?? matches[0]
  const rows = Array.from({ length: Math.ceil(matches.length / LIBRARY_PER_ROW) }, (_, row) =>
    matches.slice(row * LIBRARY_PER_ROW, (row + 1) * LIBRARY_PER_ROW),
  )

  return (
    <div className="mina-library__panel">
      {/* Phones only: the studio's own logo row, with the way out spelled out. */}
      <div className="mina-library__mobile-bar">
        <span className="mina-library__brand">
          <img className="mina-library__logo" src={MINA_LOGO_URL} alt="Mina" />
          <RoleTagCard />
        </span>
        <button className="mina-library__mobile-close" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <header className="mina-library__bar">
        <h2 className="mina-library__title">Content Library</h2>
        <input
          className="mina-library__search"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="mina-library__filters">
          <button className="mina-library__filter" type="button" aria-pressed="true">
            Content
          </button>
          <button className="mina-library__filter" type="button">
            Creator
          </button>
          <button className="mina-library__close" type="button" aria-label="Close content library" onClick={onClose}>
            —
          </button>
        </div>
      </header>

      <div className="mina-library__grid">
        {rows.map((row) => (
          <div key={row[0]!.id} className="mina-library__row">
            {row.map((item) => (
              <button
                key={item.id}
                className="mina-library__cell"
                type="button"
                data-hidden={!shown.includes(item.id) || undefined}
                onMouseEnter={() => reveal(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => reveal(item.id)}
              >
                <span className="mina-library__number">{toRoman(item.sort_order)}.</span>
                <span className="mina-library__media">
                  <CreationMedia url={item.thumbnail_url} alt={item.title} motion={false} />
                  {hoveredId === item.id && (
                    <video src={cfVideo(item.url, videoWidthFor(150))} autoPlay loop muted playsInline />
                  )}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mina-library__preview">
        {preview && <ContentPreview key={preview.id} item={preview} isCardHovered={hoveredId === preview.id} />}
      </div>
    </div>
  )
}

function ContentPreview({ item, isCardHovered }: { item: ContentLibraryItem; isCardHovered: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const isAudible = isCardHovered || isHovered

  // Where the browser refuses sound, it pauses rather than plays aloud: fall
  // back to muted, so the preview keeps moving either way.
  useEffect(() => {
    const player = video.current
    if (!player) return

    player.muted = !isAudible
    void player.play().catch(() => {
      player.muted = true
      void player.play().catch(() => {})
    })
  }, [isAudible])

  return (
    <video
      ref={video}
      src={cfVideo(item.url, videoWidthFor(libraryPreviewWidth()))}
      poster={cfImage(item.thumbnail_url, imageWidthFor(libraryPreviewWidth()))}
      loop
      playsInline
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  )
}

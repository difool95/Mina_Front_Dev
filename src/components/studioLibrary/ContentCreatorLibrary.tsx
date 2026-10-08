import { useEffect, useMemo, useRef, useState } from 'react'

import { CreationMedia } from '@/components/CreationMedia'
import { RoleTagCard } from '@/components/RoleTagCard'
import { useContentLibrary } from '@/hooks/useContentLibrary'
import { useCreatorLibrary } from '@/hooks/useCreatorLibrary'
import { MINA_LOGO_URL } from '@/lib/constants'
import { toRoman } from '@/lib/format'
import { cfImage, cfVideo, imageWidthFor, videoWidthFor } from '@/lib/media'
import {
  LIBRARY_HIDE_DELAY_MS,
  CONTENT_LIBRARY_MAX_VISIBLE,
  CREATOR_LIBRARY_MAX_VISIBLE,
  LIBRARY_PER_ROW,
  libraryPreviewWidth,
  NO_LIBRARY_ITEMS,
  pickRandom,
} from '@/lib/studio'
import type { ContentLibraryItem, CreatorLibraryItem } from '@/types'

export function ContentCreatorLibrary({ onClose }: { onClose: () => void }) {
  const { data: contents = NO_LIBRARY_ITEMS } = useContentLibrary()
  const { data: creators = NO_LIBRARY_ITEMS } = useCreatorLibrary()
  const [tab, setTab] = useState<'content' | 'creator'>('content')
  const isContent = tab === 'content'
  const items: (ContentLibraryItem | CreatorLibraryItem)[] = isContent ? contents : creators
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
      // Creators are searched by their keywords; templates by those and how they are filed.
      ('content_type' in item
        ? [item.title, item.content_type, item.asset_ref, ...(item.keywords ?? []), ...(item.tags ?? [])]
        : [item.title, ...(item.keywords ?? [])]
      ).some((text) => text?.toLowerCase().includes(term)),
    )
  }, [items, search])

  // A fresh, scattered set of visible cards every time the list itself changes.
  useEffect(() => {
    setShown(pickRandom(matches, isContent ? CONTENT_LIBRARY_MAX_VISIBLE : CREATOR_LIBRARY_MAX_VISIBLE).map((item) => item.id))
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
        if (ids.length <= (isContent ? CONTENT_LIBRARY_MAX_VISIBLE : CREATOR_LIBRARY_MAX_VISIBLE) || !droppable.length) return ids

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
        <h2 className="mina-library__title">{isContent ? 'Content Library' : 'Creators Library'}</h2>
        <input
          className="mina-library__search"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="mina-library__filters">
          <button
            className="mina-library__filter"
            type="button"
            aria-pressed={isContent}
            onClick={() => setTab('content')}
          >
            Content
          </button>
          <button
            className="mina-library__filter"
            type="button"
            aria-pressed={!isContent}
            onClick={() => setTab('creator')}
          >
            Creator
          </button>
          <button className="mina-library__close" type="button" aria-label="Close library" onClick={onClose}>
            <span className="mina-library__close-icon" aria-hidden="true" />
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
                  {isContent && hoveredId === item.id && (
                    <video src={cfVideo(item.url, videoWidthFor(150))} autoPlay loop muted playsInline />
                  )}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mina-library__preview">
        {preview &&
          ('content_type' in preview ? (
            <ContentPreview key={preview.id} item={preview} isCardHovered={hoveredId === preview.id} />
          ) : (
            <img src={cfImage(preview.url, imageWidthFor(libraryPreviewWidth()))} alt={preview.title} />
          ))}
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

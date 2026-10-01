import { useEffect, useMemo, useRef, useState } from 'react'

import { CreationMedia } from '@/components/CreationMedia'
import { RoleTagCard } from '@/components/RoleTagCard'
import { useSceneLibrary } from '@/hooks/useSceneLibrary'
import { MINA_LOGO_URL } from '@/lib/constants'
import { toRoman } from '@/lib/format'
import { cfImage, imageWidthFor } from '@/lib/media'
import {
  LIBRARY_HIDE_DELAY_MS,
  SCENE_LIBRARY_MAX_VISIBLE,
  LIBRARY_PER_ROW,
  libraryPreviewWidth,
  NO_LIBRARY_ITEMS,
  pickRandom,
  SCENE_LIBRARY_FILTERS,
} from '@/lib/studio'

/**
 * Create mode's library: a grid of pictures and, beside it, the last one
 * hovered shown large.
 *
 * Every picture is loaded, but only `SCENE_LIBRARY_MAX_VISIBLE` are visible at once.
 * Hovering a hidden one fades it in straight away; after
 * `LIBRARY_HIDE_DELAY_MS`, one random visible picture fades out for it.
 */
export function SceneLibrary({ onClose, onPick }: { onClose: () => void; onPick: (url: string) => void }) {
  const { data: scenes = NO_LIBRARY_ITEMS } = useSceneLibrary()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  const [shown, setShown] = useState<string[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  // Pictures revealed less than the delay ago, which the fade-out must spare.
  const fresh = useRef(new Set<string>())
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const matches = useMemo(() => {
    const terms = [search, filter ?? ''].map((term) => term.trim().toLowerCase()).filter(Boolean)

    return scenes.filter((scene) =>
      terms.every((term) =>
        [scene.title, ...(scene.keywords ?? [])].some((text) => text.toLowerCase().includes(term)),
      ),
    )
  }, [scenes, search, filter])

  // A fresh, scattered set of visible pictures every time the list itself changes.
  useEffect(() => {
    setShown(pickRandom(matches, SCENE_LIBRARY_MAX_VISIBLE).map((scene) => scene.id))
  }, [matches])

  // Shows the picture at once; after the delay, one random other fades out in
  // its place — so fade-outs keep the rhythm of the hovers that caused them,
  // and never take a picture hovered within that delay.
  const reveal = (id: string) => {
    setPreviewId(id)
    if (shown.includes(id)) return

    fresh.current.add(id)
    setShown((ids) => (ids.includes(id) ? ids : [...ids, id]))

    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      fresh.current.delete(id)
      setShown((ids) => {
        const droppable = ids.filter((shownId) => !fresh.current.has(shownId))
        if (ids.length <= SCENE_LIBRARY_MAX_VISIBLE || !droppable.length) return ids

        const dropped = droppable[Math.floor(Math.random() * droppable.length)]
        return ids.filter((shownId) => shownId !== dropped)
      })
    }, LIBRARY_HIDE_DELAY_MS)

    timers.current.add(timer)
  }

  const preview = matches.find((scene) => scene.id === previewId) ?? matches[0]
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
        <h2 className="mina-library__title">Scene Library</h2>
        <input
          className="mina-library__search"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="mina-library__filters">
          {SCENE_LIBRARY_FILTERS.map((name) => (
            <button
              key={name}
              className="mina-library__filter"
              type="button"
              aria-pressed={filter === name}
              onClick={() => setFilter((current) => (current === name ? null : name))}
            >
              {name}
            </button>
          ))}
          <button className="mina-library__close" type="button" aria-label="Close scene library" onClick={onClose}>
            —
          </button>
        </div>
      </header>

      <div className="mina-library__grid">
        {rows.map((row) => (
          <div key={row[0]!.id} className="mina-library__row">
            {row.map((scene) => (
              <button
                key={scene.id}
                className="mina-library__cell"
                type="button"
                data-hidden={!shown.includes(scene.id) || undefined}
                onMouseEnter={() => reveal(scene.id)}
                onFocus={() => reveal(scene.id)}
                //THIS LINE IS ADDING THE FUNCTIONALITY TO PICK A SCENE BROWSE FROM THE LIBRARY AND CLOSE THE LIBRARY PANEL
                onClick={() => {
                  onPick(scene.url)
                  onClose()
                }}
              >
                <span className="mina-library__number">{toRoman(scene.sort_order)}.</span>
                <span className="mina-library__media">
                  <CreationMedia url={scene.url} alt={scene.title} motion={false} />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mina-library__preview">
        {preview && <img src={cfImage(preview.url, imageWidthFor(libraryPreviewWidth()))} alt={preview.title} />}
      </div>
    </div>
  )
}

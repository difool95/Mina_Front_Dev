import { useRef, type CSSProperties } from 'react'

import { useLongPress } from '@/hooks/useLongPress'
import { TILE_HOLD_MS } from '@/lib/constants'
import { cfImage, imageWidthFor } from '@/lib/media'

import './AssetTiles.css'

export interface AssetTile {
  url: string
  /** What the click does, read out since the tile shows only a picture. */
  action: string
  onClick: () => void
  /** A line of text under the picture. */
  label?: string
  /** A word over the picture's corner, like "COVER". */
  badge?: string
  /** A word shown over the darkened picture while it is hovered, like "Remove". */
  hover?: string
  /** The app's usual hover tooltip (`data-tooltip`, index.css). */
  tooltip?: string
  /** Still on its way to R2: the picture flashes until it lands (index.css). */
  isUploading?: boolean
  /** Runs when the tile is held down; the click its release fires is then skipped. */
  onLongPress?: () => void
  /** Washed in the delete red, like a creation card waiting to be deleted. */
  isSelected?: boolean
}

/**
 * Square pictures in a row, each a button, with a "+" after them (or before
 * them, `isAddFirst`) that opens the file picker. On one line that scrolls
 * sideways (`isScroll`), or wrapping. With `onCancel`, a red "×" takes the
 * "+"'s place, to leave a select mode.
 */
export function AssetTiles({
  tiles,
  size,
  isScroll,
  isAddFirst,
  onAdd,
  onCancel,
}: {
  tiles: AssetTile[]
  /** Each picture's side, in px. */
  size: number
  isScroll?: boolean
  isAddFirst?: boolean
  /** The pictures picked from the "+"; left out, there is no "+". */
  onAdd?: (files: File[]) => void
  /** Given, the "+" becomes a red "×" that calls it. */
  onCancel?: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const hold = useLongPress(TILE_HOLD_MS)

  return (
    <div
      className={`mina-tiles${isScroll ? ' mina-tiles--scroll' : ''}${isAddFirst ? ' mina-tiles--add-first' : ''}`}
      style={{ '--tile': `${size}px` } as CSSProperties}
    >
      {tiles.map(({ url, action, onClick, label, badge, hover, tooltip, isUploading, onLongPress, isSelected }) => (
        <button
          className="mina-tiles__tile button"
          type="button"
          key={url}
          aria-label={action}
          aria-pressed={isSelected}
          data-tooltip={tooltip}
          data-uploading={isUploading || undefined}
          data-selected={isSelected || undefined}
          onPointerDown={onLongPress && (() => hold.start(onLongPress))}
          onPointerUp={hold.end}
          onPointerLeave={hold.end}
          // A long press on touch would otherwise open the system menu.
          onContextMenu={onLongPress && ((event) => event.preventDefault())}
          // A hold already did its work; the click its release fires does nothing.
          onClick={() => !hold.wasHeld() && onClick()}
        >
          <span className="mina-tiles__picture">
            <img src={cfImage(url, imageWidthFor(size))} alt="" draggable={false} />
            {badge && <span className="mina-tiles__badge body-text-button">{badge}</span>}
            {hover && <span className="mina-tiles__hover body-text-button">{hover}</span>}
          </span>
          {label !== undefined && <span className="mina-tiles__label body-text">{label}</span>}
        </button>
      ))}

      {onCancel ? (
        <button
          className="mina-tiles__tile mina-tiles__add-tile button"
          type="button"
          aria-label="Leave select mode"
          data-selected
          onClick={onCancel}
        >
          <span className="mina-tiles__picture mina-tiles__add">
            <span className="mina-tiles__cancel-icon" aria-hidden="true" />
          </span>
        </button>
      ) : (
        onAdd && (
          <button
            className="mina-tiles__tile mina-tiles__add-tile button"
            type="button"
            aria-label="Add image"
            onClick={() => fileInput.current?.click()}
          >
            <span className="mina-tiles__picture mina-tiles__add h5">+</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                onAdd([...(event.target.files ?? [])])
                // Cleared so picking the same file again still fires a change.
                event.target.value = ''
              }}
            />
          </button>
        )
      )}
    </div>
  )
}

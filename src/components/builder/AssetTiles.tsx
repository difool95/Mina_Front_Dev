import { useRef, type CSSProperties } from 'react'

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
  /** Still on its way to R2: the picture flashes until it lands (index.css). */
  isUploading?: boolean
}

/**
 * Square pictures in a row, each a button, with a "+" after them that opens
 * the file picker. On one line that scrolls sideways (`isScroll`), or wrapping.
 */
export function AssetTiles({
  tiles,
  size,
  isScroll,
  onAdd,
}: {
  tiles: AssetTile[]
  /** Each picture's side, in px. */
  size: number
  isScroll?: boolean
  /** The pictures picked from the "+"; left out, there is no "+". */
  onAdd?: (files: File[]) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`mina-tiles${isScroll ? ' mina-tiles--scroll' : ''}`}
      style={{ '--tile': `${size}px` } as CSSProperties}
    >
      {tiles.map(({ url, action, onClick, label, badge, isUploading }) => (
        <button
          className="mina-tiles__tile button"
          type="button"
          key={url}
          aria-label={action}
          data-uploading={isUploading || undefined}
          onClick={onClick}
        >
          <span className="mina-tiles__picture">
            <img src={cfImage(url, imageWidthFor(size))} alt="" draggable={false} />
            {badge && <span className="mina-tiles__badge body-text-button">{badge}</span>}
          </span>
          {label !== undefined && <span className="mina-tiles__label body-text">{label}</span>}
        </button>
      ))}

      {onAdd && (
        <button
          className="mina-tiles__tile button"
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
      )}
    </div>
  )
}

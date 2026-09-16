import type { CSSProperties } from 'react'
import { useState } from 'react'

import { isMotion, promptOf } from '@/lib/generations'
import type { MegaGeneration } from '@/types/generation.types'

import { CreationMedia } from './CreationMedia'

import './CreationCard.css'

interface CreationCardProps {
  generation: MegaGeneration
  /**
   * Editorial only — the frame this one fills, how wide it runs and how far it
   * hangs. Library passes nothing and takes its one shape from CSS instead.
   */
  placement?: { ratio: string; span: number; offset: string }
  onOpen: () => void
  onDownload: () => void
  onDelete: () => void
}

export function CreationCard({
  generation,
  placement,
  onOpen,
  onDownload,
  onDelete,
}: CreationCardProps) {
  const [confirming, setConfirming] = useState(false)

  const url = generation.mg_output_url ?? ''
  const prompt = promptOf(generation)

  return (
    <article
      className={`mina-creation${confirming ? ' mina-creation--confirming' : ''}`}
      // Handed to CSS as custom properties rather than set directly, so the
      // one-column phone layout can ignore them without fighting inline styles.
      style={
        placement
          ? ({
              '--card-span': placement.span,
              '--card-offset': placement.offset,
            } as CSSProperties)
          : undefined
      }
    >
      <header className="mina-creation__bar">
        <button className="mina-creation__action" type="button" onClick={onDownload}>
          Download
        </button>

        {confirming ? (
          <span className="mina-creation__confirm">
            <button
              className="mina-creation__action mina-creation__action--danger"
              type="button"
              onClick={onDelete}
            >
              delete
            </button>
            <button
              className="mina-creation__action"
              type="button"
              onClick={() => setConfirming(false)}
            >
              cancel
            </button>
          </span>
        ) : (
          <button
            className="mina-creation__menu"
            type="button"
            aria-label="Creation options"
            onClick={() => setConfirming(true)}
          >
            {/* Drawn rather than a glyph, so its size is ours to set. */}
            <span className="mina-creation__menu-bar" aria-hidden="true" />
          </button>
        )}
      </header>

      <button
        className="mina-creation__media"
        type="button"
        aria-label="Open creation"
        style={placement ? { aspectRatio: placement.ratio } : undefined}
        onClick={onOpen}
      >
        <CreationMedia url={url} alt={prompt} motion={isMotion(generation)} />
      </button>

      <footer className="mina-creation__foot">
        <p className="mina-creation__prompt">{prompt}</p>
        <button className="mina-creation__more" type="button">
          more
        </button>
      </footer>
    </article>
  )
}

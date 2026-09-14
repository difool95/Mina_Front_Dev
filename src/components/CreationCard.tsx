import { useState } from 'react'

import { aspectRatioOf, isMotion, promptOf } from '@/lib/generations'
import type { MegaGeneration } from '@/types/generation.types'

import './CreationCard.css'

interface CreationCardProps {
  generation: MegaGeneration
  /** Editorial keeps each creation's own shape; library squares them all off. */
  uniform: boolean
  onDownload: () => void
  onDelete: () => void
}

export function CreationCard({ generation, uniform, onDownload, onDelete }: CreationCardProps) {
  const [confirming, setConfirming] = useState(false)

  const url = generation.mg_output_url ?? ''
  const prompt = promptOf(generation)

  return (
    <article className="mina-creation">
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
            &minus;
          </button>
        )}
      </header>

      <div
        className="mina-creation__media"
        // Editorial reads the ratio off the platform the creation was made for;
        // library ignores it so every tile matches.
        style={uniform ? undefined : { aspectRatio: aspectRatioOf(generation) }}
      >
        {isMotion(generation) ? (
          <video src={url} muted loop playsInline preload="metadata" />
        ) : (
          <img src={url} alt={prompt} loading="lazy" />
        )}
      </div>

      <footer className="mina-creation__foot">
        <p className="mina-creation__prompt">{prompt}</p>
        <button className="mina-creation__more" type="button">
          more
        </button>
      </footer>
    </article>
  )
}

import type { CSSProperties } from 'react'

import './CreationSkeleton.css'

interface CreationSkeletonProps {
  /** Editorial only, so the placeholders stand where the creations will. */
  placement?: { ratio: string; span: number; offset: string }
}

/**
 * The shape of a creation, before there is one.
 *
 * It borrows the card's own structural classes and its placement, so the grid
 * that appears while loading is the grid that stays — the real creations drop
 * into these exact frames instead of shoving the page around as they arrive.
 */
export function CreationSkeleton({ placement }: CreationSkeletonProps) {
  return (
    <article
      className="mina-creation mina-creation--skeleton"
      style={
        placement
          ? ({
              '--card-span': placement.span,
              '--card-offset': placement.offset,
            } as CSSProperties)
          : undefined
      }
      aria-hidden="true"
    >
      <header className="mina-creation__bar">
        <span className="mina-creation__ghost mina-creation__ghost--action" />
        <span className="mina-creation__ghost mina-creation__ghost--menu" />
      </header>

      <div
        className="mina-creation__media"
        style={placement ? { aspectRatio: placement.ratio } : undefined}
      />

      <footer className="mina-creation__foot">
        <span className="mina-creation__ghost mina-creation__ghost--prompt" />
      </footer>
    </article>
  )
}

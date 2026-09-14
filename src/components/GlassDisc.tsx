import type { CSSProperties, ReactNode } from 'react'

import './GlassDisc.css'

interface GlassDiscProps {
  x: number
  y: number
  /**
   * `fixed` places it by viewport coordinates (`clientX`/`clientY`);
   * `absolute` by offsets inside the nearest positioned ancestor.
   */
  anchor?: 'fixed' | 'absolute'
  size?: number
  /** `accent` fills it green — for a moment of confirmation. */
  tone?: 'glass' | 'accent'
  children: ReactNode
}

/**
 * The frosted disc that stands in for the pointer, over the carousel and over
 * a full-screen creation.
 *
 * It is a real element rather than a `cursor:` image because it has to blur
 * what it passes over, and a cursor image is a flat picture the compositor
 * knows nothing about. Whoever renders it tracks the pointer and hides the
 * real one with `cursor: none`.
 */
export function GlassDisc({
  x,
  y,
  anchor = 'fixed',
  size = 44,
  tone = 'glass',
  children,
}: GlassDiscProps) {
  return (
    <span
      className={`mina-glass mina-glass--${anchor} mina-glass--${tone}`}
      style={{ left: x, top: y, '--glass-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

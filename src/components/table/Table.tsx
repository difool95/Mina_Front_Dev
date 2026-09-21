import type { ReactNode } from 'react'

import './Table.css'

interface RowProps {
  /**
   * Where the cells sit across the row. `between` pins the first to the left
   * edge and the last to the right, spreading any others equally between
   * them; `left` and `right` pack them all against one side.
   */
  anchor?: 'between' | 'left' | 'right'
  /** `top` for a row whose cells differ in height — one holding a paragraph. */
  valign?: 'center' | 'top'
  className?: string
  children: ReactNode
}

/**
 * Layout built as a table: rows stacked down, cells laid across.
 *
 * Every row keeps the same height, so a stack of them reads as a table rather
 * than a pile of boxes, and grows past it only when its own content asks.
 *
 * A cell never breaks its text over two lines. When a row runs out of width
 * the row itself wraps, carrying whole cells to the next line — which is why
 * three buttons become two and one rather than three broken words.
 *
 * `Table.css` holds the sizing as variables, so a single table can be retuned
 * by overriding them on its own class.
 */
export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`mina-table${className ? ` ${className}` : ''}`}>{children}</div>
}

export function Row({ anchor = 'between', valign = 'center', className, children }: RowProps) {
  return (
    <div
      className={`mina-table__row mina-table__row--${anchor} mina-table__row--${valign}${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </div>
  )
}

/** The line between two rows, and a row in its own right. */
export function Rule() {
  return <div className="mina-table__rule" />
}

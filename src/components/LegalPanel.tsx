import { useEffect, useRef } from 'react'

import { Markdown } from './Markdown'

import './LegalPanel.css'

/**
 * The legal document panel (Policies / Terms / Refund).
 *
 * A native `<dialog>` opened with `showModal()`, so the blurred `::backdrop`,
 * focus trapping and Escape-to-close come from the platform rather than from
 * hand-written listeners.
 */
export function LegalPanel({
  title,
  body,
  onClose,
}: {
  title: string
  body: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      className="mina-panel"
      ref={ref}
      // Every close path calls `onClose` directly and lets React unmount the
      // dialog. Routing through `close()` and the native close event does not
      // reach React, which leaves the element mounted but shut — after which
      // it can never be reopened.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // The backdrop is part of the dialog, so a click landing on the element
      // itself rather than on the card means the user clicked outside.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <header className="mina-panel__bar">
        <h2 className="mina-panel__title">{title}</h2>
        <button className="mina-panel__close" type="button" aria-label="Close" onClick={onClose}>
          —
        </button>
      </header>

      <div className="mina-panel__body">
        <Markdown source={body} />
      </div>
    </dialog>
  )
}

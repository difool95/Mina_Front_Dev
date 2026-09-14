import { useEffect, useRef, useState } from 'react'

import './AccountMenu.css'

/**
 * The signed-in address, and the list of accounts behind it.
 *
 * "Add another account…" is inert for now — the second account flow does not
 * exist yet, but the design calls for the slot.
 */
export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', close)

    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="mina-account" ref={root}>
      <button
        className="mina-account__trigger"
        type="button"
        aria-expanded={open}
        data-tooltip="Switch account"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {email}
        <span className="mina-account__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="mina-account__menu">
          <p className="mina-account__current">
            {email}
            <span aria-hidden="true">✓</span>
          </p>
          <button className="mina-account__add" type="button">
            Add another account&hellip;
          </button>
        </div>
      )}
    </div>
  )
}

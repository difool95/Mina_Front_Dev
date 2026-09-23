import { useEffect, useRef, useState } from 'react'

import type { SavedAccount } from '@/types/account.types'

import './AccountMenu.css'

/**
 * The signed-in address, and the other accounts signed in on this browser —
 * each one a click away, no login needed.
 */
export function AccountMenu({
  email,
  currentUserId,
  accounts,
  canAdd,
  error,
  onSwitch,
  onAdd,
}: {
  email: string
  currentUserId: string
  accounts: SavedAccount[]
  /** False once this browser holds as many accounts as it is allowed. */
  canAdd: boolean
  /** Why the last switch failed, if it did. */
  error: string | null
  onSwitch: (account: SavedAccount) => void
  onAdd: () => void
}) {
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

  const others = accounts.filter((account) => account.userId !== currentUserId)

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
          {others.map((account) => (
            <button
              key={account.userId}
              className="mina-account__other"
              type="button"
              onClick={() => {
                setOpen(false)
                onSwitch(account)
              }}
            >
              {account.email}
            </button>
          ))}
          {error && <p className="mina-account__error">{error}</p>}
          <button className="mina-account__add" type="button" disabled={!canAdd} onClick={onAdd}>
            {canAdd ? <>Add another account&hellip;</> : 'Account limit reached'}
          </button>
        </div>
      )}
    </div>
  )
}

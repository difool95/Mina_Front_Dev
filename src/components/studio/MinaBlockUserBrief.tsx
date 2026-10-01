import { useState, type CSSProperties } from 'react'

import { Icon } from '@/components/Icon'
import { BRIEF_CHARS_PER_PX, BRIEF_MAX_LENGTH, BRIEF_SHRINK_FROM } from '@/lib/studio'

import './MinaBlockUserBrief.css'

/**
 * The brief, and the one passage of it that can be locked.
 *
 * Selecting text shows a lock pill at the bottom right; clicking it moves the
 * selection out of the brief into a small, faded strip under it, where it can
 * no longer be edited or deleted by accident. Hovering the strip brings the
 * pill back, and clicking it then appends the locked text to the brief again.
 * Only one passage is locked at a time, and Ctrl+Z (⌘Z) undoes the last lock
 * as long as nothing has been typed since.
 */
export function MinaBlockUserBrief({ placeholder }: { placeholder: string }) {
  const [brief, setBrief] = useState('')
  const [locked, setLocked] = useState('')
  // The live selection in the brief, kept only while it holds more than whitespace.
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  // The brief as it stood before the last lock, until the next keystroke. The
  // browser's own undo cannot do this: it loses its history whenever React
  // sets the value itself, which locking does.
  const [beforeLock, setBeforeLock] = useState<string | null>(null)

  const readSelection = (input: HTMLTextAreaElement) => {
    const { selectionStart: start, selectionEnd: end, value } = input
    setSelection(value.slice(start, end).trim() ? { start, end } : null)
  }

  const lock = () => {
    if (!selection) return
    setBeforeLock(brief)
    setLocked(brief.slice(selection.start, selection.end).trim())
    // Joined with one space, so the gap the passage leaves does not double up.
    setBrief(
      [brief.slice(0, selection.start).trimEnd(), brief.slice(selection.end).trimStart()]
        .filter(Boolean)
        .join(' '),
    )
    setSelection(null)
  }

  const unlock = () => {
    setBrief(brief ? `${brief} ${locked}` : locked)
    setLocked('')
    setBeforeLock(null)
  }

  return (
    <div className="mina-brief">
      <textarea
        className="mina-brief__input"
        value={brief}
        maxLength={BRIEF_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => {
          setBrief(event.target.value)
          setBeforeLock(null)
        }}
        onKeyDown={(event) => {
          if (beforeLock === null || event.shiftKey || !(event.ctrlKey || event.metaKey)) return
          if (event.key.toLowerCase() !== 'z') return

          event.preventDefault()
          setBrief(beforeLock)
          setLocked('')
          setBeforeLock(null)
        }}
        onSelect={(event) => readSelection(event.currentTarget)}
        // Leaving the tab blurs the brief but keeps its selection; reading it
        // again on the way back brings the pill back with it.
        onFocus={(event) => readSelection(event.currentTarget)}
        onBlur={() => setSelection(null)}
        style={
          {
            '--brief-shrink': Math.max(0, brief.length - BRIEF_SHRINK_FROM) / BRIEF_CHARS_PER_PX,
          } as CSSProperties
        }
      />

      {(locked || selection) && (
        <div className="mina-brief__bottom" data-locked={locked ? '' : undefined}>
          {locked && <p className="mina-brief__locked">{locked}</p>}
          <button
            className="mina-brief__lock"
            type="button"
            aria-label={locked ? 'Unlock text' : 'Lock selected text'}
            data-tooltip={locked ? 'Click to unlock' : 'Lock selected text'}
            // Keeps the brief focused, so pressing the pill does not blur away the selection it locks.
            onMouseDown={(event) => event.preventDefault()}
            onClick={locked ? unlock : lock}
          >
            <Icon name="lock" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

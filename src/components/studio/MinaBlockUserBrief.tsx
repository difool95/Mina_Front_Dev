import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'

import { BRIEF_CHARS_PER_PX, BRIEF_MAX_LENGTH, BRIEF_SHRINK_FROM } from '@/lib/studio'
import { studioSession } from '@/lib/sessionStorage/studioSession'
import type { BriefRange, MinaBlockUserBriefHandle, MinaNote } from '@/types'

import { MinaBlockMinaBrief } from './MinaBlockMinaBrief'

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
 *
 * A brand memory's full name typed in the brief shows purple. A textarea
 * cannot colour part of its text, so its own text is transparent and a copy
 * laid out the same way, under it, draws it.
 */
export function MinaBlockUserBrief({
  placeholder,
  minaNote,
  onClearMinaNote,
  onTextChange,
  nameRanges,
  ref,
}: {
  placeholder: string
  /**
   * What Mina says over the brief: a picture refused or that does not fit, a
   * prompt file loaded or not. The brief stays underneath, and going back to
   * it (a click, focus or a key) calls `onClearMinaNote`.
   */
  minaNote: MinaNote | null
  onClearMinaNote: () => void
  /** Told the brief and its locked passage whenever either changes. */
  onTextChange: (text: { brief: string; locked: string }) => void
  /** Where brand memories' full names stand in the brief, drawn purple. */
  nameRanges: BriefRange[]
  ref?: Ref<MinaBlockUserBriefHandle>
}) {
  const input = useRef<HTMLTextAreaElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const [brief, setBrief] = useState(() => studioSession.read().brief ?? '')
  const [locked, setLocked] = useState(() => studioSession.read().locked ?? '')
  useEffect(() => studioSession.save({ brief, locked }), [brief, locked])
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

 //THIS METHOD IS EXPOSED TO THE PARENT COMPONENT (MinaBlock) TO SETUP THE BRIEF WHEN A SCENE IS PICKED FROM THE SCENE LIBRARY
  useImperativeHandle(ref, () => ({
    setupBrief: (nextLocked, nextBrief) => {
      setLocked(nextLocked.trim())
      setBrief(nextBrief.slice(0, BRIEF_MAX_LENGTH))
      // Neither Ctrl+Z nor a stale selection should reach back past it.
      setBeforeLock(null)
      setSelection(null)
    },
    focus: () => input.current?.focus(),
  }))

// Whenever the brief or its locked passage changes, tell the parent so it can re update everything that depends on them (brand memory picks, the prompt file,
// the still generation).
  useLayoutEffect(() => onTextChange({ brief, locked }), [brief, locked, onTextChange])

  const shrink = { '--brief-shrink': Math.max(0, brief.length - BRIEF_SHRINK_FROM) / BRIEF_CHARS_PER_PX } as CSSProperties

  return (
    <div className="mina-brief" data-mina-note={minaNote ? '' : undefined}>
      <div className="mina-brief__field">
        <div ref={mirror} className="mina-brief__input mina-brief__mirror h1" aria-hidden="true" style={shrink}>
          {withNames(brief, nameRanges)}
        </div>
        <textarea
          ref={input}
          className="mina-brief__input mina-brief__typed h1 placeholder-faint"
          value={brief}
          maxLength={BRIEF_MAX_LENGTH}
          placeholder={placeholder}
          onChange={(event) => {
            setBrief(event.target.value)
            setBeforeLock(null)
          }}
          onPointerDown={onClearMinaNote}
          onKeyDown={(event) => {
            onClearMinaNote()
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
          onFocus={(event) => {
            onClearMinaNote()
            readSelection(event.currentTarget)
          }}
          onBlur={() => setSelection(null)}
          onScroll={(event) => mirror.current && (mirror.current.scrollTop = event.currentTarget.scrollTop)}
          style={shrink}
        />
      </div>

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
            <span className="mina-brief__lock-icon" aria-hidden="true" />
          </button>
        </div>
      )}

      {minaNote && <MinaBlockMinaBrief note={minaNote} />}
    </div>
  )
}

// The brief with each range wrapped in a purple span. Ranges can overlap when
// one name holds another ("Leather" in "Leather Clutch"), so a covered stretch
// is drawn once. The trailing space keeps a last empty line as tall as the
// textarea's, so both scroll the same.
function withNames(brief: string, ranges: BriefRange[]) {
  const parts: ReactNode[] = []
  let at = 0

  for (const { start, end } of [...ranges].sort((a, b) => a.start - b.start)) {
    if (end <= at) continue

    const from = Math.max(start, at)
    parts.push(
      brief.slice(at, from),
      <span key={from} className="mina-brief__name">
        {brief.slice(from, end)}
      </span>,
    )
    at = end
  }
  parts.push(`${brief.slice(at)} `)

  return parts
}

import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { MINA_LINE_MS, hasEnded, minaLine } from '@/lib/minaBrief'
import type { MinaNote, MmaStatus } from '@/types'

import './MinaBlockMinaBrief.css'

/**
 * What Mina types in the brief's place, letter by letter, in one of two ways
 * depending on what she is given:
 * - `status`: while a Create runs, a green line every few seconds, picked by the
 *   step the generation is on; once it has ended and its last line has had its
 *   time, `onEnd`.
 * - `note`: one line, drawn over the brief, that stays until the user goes back
 *   to the brief (MinaBlockUserBrief clears it then); pink when it is a warning.
 */
export function MinaBlockMinaBrief(
  props: { status: MmaStatus; onEnd: () => void } | { note: MinaNote },
) {
  return 'note' in props ? (
    <MinaTypedLine line={props.note.line} isNote tone={props.note.tone} />
  ) : (
    <MinaGenerationLines status={props.status} onEnd={props.onEnd} />
  )
}

/** The green lines of a running Create, one every few seconds; a step that outlasts its own lines moves on to chitchat. */
function MinaGenerationLines({ status, onEnd }: { status: MmaStatus; onEnd: () => void }) {
  const [line, setLine] = useState(() => minaLine(status, 0, []))
  // The timer below runs once for the whole generation, so it reads the props from here.
  const latest = useRef({ status, onEnd })
  useEffect(() => {
    latest.current = { status, onEnd }
  })
  // The step the line on screen belongs to, how many lines that step has had, and every line so far.
  const typed = useRef({ status, nth: 0, shown: [line] })

  useEffect(() => {
    const timer = setInterval(() => {
      const { status, onEnd } = latest.current
      const turn = typed.current
      if (hasEnded(turn.status)) return onEnd()

      turn.nth = status === turn.status ? turn.nth + 1 : 0
      turn.status = status
      const next = minaLine(status, turn.nth, turn.shown)
      turn.shown.push(next)
      setLine(next)
    }, MINA_LINE_MS)

    return () => clearInterval(timer)
  }, [])

  return <MinaTypedLine line={line} />
}

/** One line typed out letter by letter: green by default, pink for a warning, over the brief for a note. */
function MinaTypedLine({ line, isNote, tone }: { line: string; isNote?: boolean; tone?: MinaNote['tone'] }) {
  return (
    // Keyed by the line, so each new one types itself out from the start.
    <p
      key={line}
      className={`mina-mina-brief${isNote ? ' mina-mina-brief--note' : ''}${tone === 'warning' ? ' mina-mina-brief--warning' : ''}`}
    >
      {/* Every letter is laid out from the start, so the line never reflows as it types. */}
      {[...line].map((letter, index) => (
        <span key={index} className="mina-mina-brief__letter" style={{ '--letter': index } as CSSProperties}>
          {letter}
        </span>
      ))}
    </p>
  )
}

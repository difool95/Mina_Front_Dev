import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { MINA_LINE_MS, hasEnded, minaLine } from '@/lib/minaBrief'
import type { MmaStatus } from '@/types'

import './MinaBlockMinaBrief.css'

/**
 * What Mina types in the brief's place while a Create runs: a new line every
 * few seconds, picked by the step the generation is on, typed out letter by
 * letter. A step that outlasts its own lines moves on to chitchat. Once the
 * generation has ended and its last line has had its time, `onEnd`.
 */
export function MinaBlockMinaBrief({ status, onEnd }: { status: MmaStatus; onEnd: () => void }) {
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

  return (
    // Keyed by the line, so each new one types itself out from the start.
    <p key={line} className="mina-mina-brief">
      {/* Every letter is laid out from the start, so the line never reflows as it types. */}
      {[...line].map((letter, index) => (
        <span key={index} className="mina-mina-brief__letter" style={{ '--letter': index } as CSSProperties}>
          {letter}
        </span>
      ))}
    </p>
  )
}

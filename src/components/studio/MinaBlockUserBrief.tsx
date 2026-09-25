import { useState, type CSSProperties } from 'react'

import { BRIEF_CHARS_PER_PX, BRIEF_MAX_LENGTH, BRIEF_SHRINK_FROM } from '@/lib/studio'

import './MinaBlockUserBrief.css'

export function MinaBlockUserBrief({ placeholder }: { placeholder: string }) {
  const [brief, setBrief] = useState('')

  return (
    <textarea
      className="mina-brief"
      value={brief}
      maxLength={BRIEF_MAX_LENGTH}
      placeholder={placeholder}
      onChange={(event) => setBrief(event.target.value)}
      style={
        {
          '--brief-shrink': Math.max(0, brief.length - BRIEF_SHRINK_FROM) / BRIEF_CHARS_PER_PX,
        } as CSSProperties
      }
    />
  )
}

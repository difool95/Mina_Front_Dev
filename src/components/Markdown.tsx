import type { ReactNode } from 'react'

import './Markdown.css'

/**
 * Renders the markdown subset the `onboard_content` legal bodies actually use:
 * `#`/`##`/`###` headings, `**bold**`, `-` bullet lists, and blank-line
 * separated paragraphs.
 *
 * Deliberately not a full markdown parser — a dependency would be far more
 * code than the content needs. Output is React elements rather than HTML, so
 * database copy can never inject markup. Anything outside that subset (links,
 * tables, images) renders as literal text.
 */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let bullets: string[] = []

  const flush = () => {
    if (paragraph.length > 0) {
      // Joined with newlines and shown as `pre-line`, so consecutive lines keep
      // their soft breaks (the "Effective Date / Last Updated" pair).
      blocks.push(<p key={blocks.length}>{inline(paragraph.join('\n'))}</p>)
      paragraph = []
    }
    if (bullets.length > 0) {
      blocks.push(
        <ul key={blocks.length}>
          {bullets.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      )
      bullets = []
    }
  }

  for (const raw of source.split('\n')) {
    const line = raw.trim()

    if (line === '') {
      flush()
      continue
    }

    if (line.startsWith('- ')) {
      if (paragraph.length > 0) flush()
      bullets.push(line.slice(2))
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      const Tag = `h${heading[1]!.length}` as 'h1' | 'h2' | 'h3'
      blocks.push(<Tag key={blocks.length}>{inline(heading[2]!)}</Tag>)
      continue
    }

    if (bullets.length > 0) flush()
    paragraph.push(line)
  }
  flush()

  return <div className="mina-md">{blocks}</div>
}

/** `**bold**` spans; everything else stays literal text. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  )
}

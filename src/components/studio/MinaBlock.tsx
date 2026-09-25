import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'

import type { UploadKind } from '@/types'

import { Rule } from '../builder/Table'
import { MinaBlockPills } from './MinaBlockPills'
import { MinaBlockUploadAndLibraries } from './MinaBlockUploadAndLibraries'
import { MinaBlockUserBrief } from './MinaBlockUserBrief'

import './MinaBlock.css'

/**
 * The studio's prompt: pills, brief, uploads, vision switch and the call to action.
 *
 * It opens on the brief alone. The long animation — focusing the brief, or
 * the page calling `animate()` through `ref` before it has opened — brings in
 * everything else, with the brief sliding from where it stood alone to its
 * place in the full block. Once open, each `animate()` plays the simple one.
 */
export function MinaBlock({
  placeholder,
  ref,
}: {
  placeholder: string
  ref?: Ref<{ animate: () => void }>
}) {
  // Shared by the pills, which pick it, and the upload row, which follows it.
  const [upload, setUpload] = useState<UploadKind>('scene')
  // Null while closed; which entrance plays is also what CSS keys off.
  const [animation, setAnimation] = useState<'long' | 'simple' | null>(null)
  const [simpleRuns, setSimpleRuns] = useState(0)
  const isOpen = animation !== null
  const block = useRef<HTMLDivElement>(null)
  const brief = useRef<HTMLDivElement>(null)
  const closedTop = useRef(0)


  useLayoutEffect(() => {
    if (!isOpen || !brief.current) return

    const openTop = brief.current.getBoundingClientRect().top
    brief.current.style.setProperty('--block-from', `${closedTop.current - openTop}px`)
  }, [isOpen])

  useLayoutEffect(() => {
    if (!simpleRuns) return

    for (const running of block.current?.getAnimations({ subtree: true }) ?? []) {
      if (!(running instanceof CSSAnimation)) continue
      running.cancel()
      running.play()
    }
  }, [simpleRuns])

  const openLong = () => {
    if (isOpen || !brief.current) return

    closedTop.current = brief.current.getBoundingClientRect().top
    setAnimation('long')
  }

  useImperativeHandle(ref, () => ({
    animate: () => {
      if (!isOpen) return openLong()

      setAnimation('simple')
      setSimpleRuns((runs) => runs + 1)
    },
  }))

  return (
    <div ref={block} className="mina-block" data-animation={animation ?? undefined}>
      {isOpen && <MinaBlockPills upload={upload} onUpload={setUpload} />}
      <div ref={brief} className="mina-block__brief" onFocus={openLong}>
        <MinaBlockUserBrief placeholder={placeholder} />
      </div>
      {isOpen && (
        <>
          {/* Each rule enters with the section under it, so they travel as one group. */}
          <div className="mina-block__group mina-block__group--uploads">
            <Rule />
            <MinaBlockUploadAndLibraries upload={upload} />
          </div>
          <div className="mina-block__group mina-block__group--actions">
            <Rule />
            <MinaBlockVisionIntelligence />
            <MinaBlockCTA />
          </div>
        </>
      )}
    </div>
  )
}

function MinaBlockVisionIntelligence() {
  const [isOn, setIsOn] = useState(true)

  return (
    <button className="mina-block__vision" type="button" onClick={() => setIsOn((was) => !was)}>
      Mina vision intelligence: {isOn ? 'ON' : 'OFF'}
    </button>
  )
}

function MinaBlockCTA() {
  return (
    <button className="mina-block__cta" type="button">
      Describe more
    </button>
  )
}

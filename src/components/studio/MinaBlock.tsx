import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'

import {
  ANIMATE_DURATIONS,
  ANIMATE_RESOLUTIONS,
  ANIMATE_UPLOAD_TITLE,
  BRIEF_PLACEHOLDERS,
  CONTENT_LIBRARY_PREVIEW_URLS,
  LIBRARY_PREVIEW_URLS,
  NEED_MATCHA_LABEL,
  STUDIO_CTA_LABELS,
  UPLOAD_KINDS,
  canAffordGeneration,
} from '@/lib/studio'
import type { StudioMode, UploadKind } from '@/types'

import { Rule } from '../builder/Table'
import { StudioLibrary } from '../studioLibrary/StudioLibrary'
import { MinaBlockPillsAnimate } from './MinaBlockPillsAnimate'
import { MinaBlockPillsCreate } from './MinaBlockPillsCreate'
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
 *
 * `credits` is undefined until the balance has loaded; the call to action
 * keeps its usual label until then rather than flashing the matcha one.
 */
export function MinaBlock({
  mode,
  credits,
  onNeedMatcha,
  ref,
}: {
  mode: StudioMode
  credits: number | undefined
  onNeedMatcha: () => void
  ref?: Ref<{ animate: () => void }>
}) {
  const [upload, setUpload] = useState<UploadKind>('scene')
  const [resolutionIndex, setResolutionIndex] = useState(0)
  const [durationIndex, setDurationIndex] = useState(0)
  const resolution = ANIMATE_RESOLUTIONS[resolutionIndex]!
  const duration = ANIMATE_DURATIONS[durationIndex]!
  const canAfford = credits === undefined || canAffordGeneration(credits, mode, resolution, duration)
  const [uploadSwitch, setUploadSwitch] = useState<'up' | 'down' | null>(null)
  const [leavingUpload, setLeavingUpload] = useState<UploadKind | null>(null)
  const [animation, setAnimation] = useState<'long' | 'simple' | null>(null)
  const [simpleRuns, setSimpleRuns] = useState(0)
  const [openLibrary, setOpenLibrary] = useState<'scene' | 'content' | null>(null)
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
      // The upload switch belongs to the pills' hover, not to the entrance.
      if (!(running instanceof CSSAnimation) || running.animationName.startsWith('mina-block-upload-')) continue
      running.cancel()
      running.play()
    }
  }, [simpleRuns])

  const openLong = () => {
    if (isOpen || !brief.current) return

    closedTop.current = brief.current.getBoundingClientRect().top
    setAnimation('long')
  }

  const pickUpload = (next: UploadKind) => {
    if (next === upload) return

    const stack = UPLOAD_KINDS.map((entry) => entry.kind)
    const isUp = stack.indexOf(next) > stack.indexOf(upload)
    setUploadSwitch(isUp ? 'up' : 'down')
    setLeavingUpload(isUp ? null : upload)
    setUpload(next)
  }

  useImperativeHandle(ref, () => ({
    animate: () => {
      if (!isOpen) return openLong()

      // A mode switch is not a pill hover: the upload row must not replay its slide.
      setUploadSwitch(null)
      setLeavingUpload(null)
      setAnimation('simple')
      setSimpleRuns((runs) => runs + 1)
    },
  }))

  // Animate has one upload row with the content library; create's follows the "+" pills.
  const uploadRow = (kind: UploadKind) =>
    mode === 'animate' ? (
      <MinaBlockUploadAndLibraries
        title={ANIMATE_UPLOAD_TITLE}
        addLabel="Add start frame (image)"
        library={{
          label: 'Open the Content Library - pick a template to load its whole setup',
          previewUrls: CONTENT_LIBRARY_PREVIEW_URLS,
          onBrowse: () => setOpenLibrary('content'),
        }}
      />
    ) : (
      <MinaBlockUploadAndLibraries
        title={UPLOAD_KINDS.find((entry) => entry.kind === kind)!.title}
        library={
          kind === 'scene'
            ? {
                label: 'Browse scene library',
                previewUrls: LIBRARY_PREVIEW_URLS,
                onBrowse: () => setOpenLibrary('scene'),
              }
            : undefined
        }
      />
    )

  return (
    <div ref={block} className="mina-block" data-animation={animation ?? undefined}>
      {isOpen &&
        (mode === 'animate' ? (
          <MinaBlockPillsAnimate
            resolution={resolution}
            duration={duration}
            onNextResolution={() => setResolutionIndex((index) => (index + 1) % ANIMATE_RESOLUTIONS.length)}
            onNextDuration={() => setDurationIndex((index) => (index + 1) % ANIMATE_DURATIONS.length)}
          />
        ) : (
          <MinaBlockPillsCreate upload={upload} onUpload={pickUpload} />
        ))}
      <div ref={brief} className="mina-block__brief" onFocus={openLong}>
        <MinaBlockUserBrief placeholder={BRIEF_PLACEHOLDERS[mode]} />
      </div>
      {isOpen && (
        <>
          {/* Each rule enters with the section under it, so they travel as one group. */}
          <div className="mina-block__group mina-block__group--uploads">
            {/* Keyed by the upload, so every switch remounts it and replays the slide. */}
            <div
              key={mode === 'animate' ? 'animate' : upload}
              className="mina-block__switch"
              data-switch={(mode === 'create' && uploadSwitch) || undefined}
            >
              <Rule />
              {uploadRow(upload)}
            </div>
            {mode === 'create' && leavingUpload && (
              <div
                key={`leaving-${leavingUpload}`}
                className="mina-block__switch mina-block__switch--leaving"
                onAnimationEnd={(event) => event.target === event.currentTarget && setLeavingUpload(null)}
              >
                <Rule />
                {uploadRow(leavingUpload)}
              </div>
            )}
          </div>
          <div className="mina-block__group mina-block__group--actions">
            <Rule />
            <MinaBlockVisionIntelligence />
            {canAfford ? (
              <MinaBlockCTA label={STUDIO_CTA_LABELS[mode]} />
            ) : (
              <MinaBlockCTA label={NEED_MATCHA_LABEL} onClick={onNeedMatcha} />
            )}
          </div>
        </>
      )}
      {openLibrary && <StudioLibrary library={openLibrary} onClose={() => setOpenLibrary(null)} />}
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

function MinaBlockCTA({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button className="mina-block__cta" type="button" onClick={onClick}>
      {label}
    </button>
  )
}

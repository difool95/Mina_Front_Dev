import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type Ref,
  type SetStateAction,
} from 'react'

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
  UPLOAD_LIMITS,
  canAffordGeneration,
} from '@/lib/studio'
import type { MinaBlockHandle, MinaBlockUserBriefHandle, StudioMode, StudioUpload, UploadKind } from '@/types'

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
  uploads,
  onUploads,
  ref,
}: {
  mode: StudioMode
  credits: number | undefined
  onNeedMatcha: () => void
  uploads: StudioUpload[]
  onUploads: Dispatch<SetStateAction<StudioUpload[]>>
  ref?: Ref<MinaBlockHandle>
}) {
  const [upload, setUpload] = useState<UploadKind>('scene')
  // The file input is outside the pills so it can be reused for every pill, the ref is used to trigger the file picker when the user clicks on the "+" button of a pill
  const fileInput = useRef<HTMLInputElement>(null)
  // Opens the computer's file dialog for that pill, unless it is already full.
  // Nothing is uploaded here: the chosen files become blob URLs in the input's onChange.
  const openFilePicker = (kind: UploadKind) => roomFor(kind) > 0 && fileInput.current?.click()

  const urlsOf = (kind: UploadKind) => uploads.filter((entry) => entry.kind === kind).map((entry) => entry.url)
  //this is a method that checks if there is room for more uploads of a certain kind, it returns the number of remaining uploads allowed for that kind
  const roomFor = (kind: UploadKind) => UPLOAD_LIMITS[kind] - urlsOf(kind).length
  // the add function is used to add an upload to the list of uploads, it is passed down to the upload row component
  const add = (kind: UploadKind, urls: string[]) =>
    onUploads((list) => [...list, ...urls.map((url) => ({ kind, url }))])
  // the remove function is used to remove an upload from the list of uploads, it is passed down to the upload row component
  const remove = (url: string) => {
    URL.revokeObjectURL(url)
    onUploads((list) => list.filter((entry) => entry.url !== url))
  }

// the move function is used to reorder the uploads in the list, it is passed down to the MinaBlockUploadAndLibraries component, 
// it takes the url of the upload to move and the url of the target upload to move it before, it updates the list of uploads in 
// the parent component (StudioPage) through the onUploads prop
  const move = (url: string, target: string) =>
    onUploads((list) => {
      const next = [...list]
      next.splice(
        list.findIndex((entry) => entry.url === target),
        0,
        ...next.splice(list.findIndex((entry) => entry.url === url), 1),
      )
      return next
    })


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
  const userBrief = useRef<MinaBlockUserBriefHandle>(null)
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

// this method is used to select the upload kind, it is passed down to the pills component, it is called when the user clicks on a pill,
//  it sets the upload kind and triggers the animation of the upload row
  const selectUploadKind = (next: UploadKind) => {
    if (next === upload) return

    const stack = UPLOAD_KINDS.map((entry) => entry.kind)
    const isUp = stack.indexOf(next) > stack.indexOf(upload)
    setUploadSwitch(isUp ? 'up' : 'down')
    setLeavingUpload(isUp ? null : upload)
    setUpload(next)
  }

  //THESE METHODS animate() and OpenFilePickerScene() ARE CALLED FROM THE PARENT COMPONENT (STUDIO PAGE) TO ANIMATE THE BLOCK AT START AND TO OPEN THE FILE PICKER FOR THE SCENE PILL
  //THIS IS A DEFAULT REACT HOOK THAT ALLOWS THE PARENT COMPONENT TO CALL METHODS ON THE CHILD COMPONENT (MINABLOCK) THROUGH A REF
  useImperativeHandle(ref, () => ({
    animate: () => {
      if (!isOpen) return openLong()

      // A mode switch is not a pill hover: the upload row must not replay its slide.
      setUploadSwitch(null)
      setLeavingUpload(null)
      setAnimation('simple')
      setSimpleRuns((runs) => runs + 1)
    },
    OpenFilePickerScene: () => {
      openLong()
      selectUploadKind('scene')
      openFilePicker('scene')
    },
    lockText: (text) => userBrief.current?.lockText(text),
  }))

// The upload row is the same for every pill, but the scene pill has a library card too.
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
        images={urlsOf(kind)}
        canAdd={roomFor(kind) > 0}
        onOpenFilePicker={() => openFilePicker(kind)}
        onRemove={remove}
        onMove={move}
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
          <MinaBlockPillsCreate
            upload={upload}
            uploads={uploads}
            onSelectUploadKind={selectUploadKind}
            onOpenFilePicker={openFilePicker}
          />
        ))}
      <div ref={brief} className="mina-block__brief" onFocus={openLong}>
        <MinaBlockUserBrief ref={userBrief} placeholder={BRIEF_PLACEHOLDERS[mode]} />
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
      {openLibrary && (
        <StudioLibrary
          library={openLibrary}
          onClose={() => setOpenLibrary(null)}
          onPickScene={(url) => add('scene', [url])}
        />
      )}
      {/* The file input is outside the pills so it can be reused for every pill, it can be put anywhere in the component tree */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple={UPLOAD_LIMITS[upload] > 1}
        hidden
        onChange={(event) => {
          // Past the pill's limit, the extra files are dropped rather than refused.
          const files = [...(event.target.files ?? [])].slice(0, roomFor(upload))
          add(upload, files.map((file) => URL.createObjectURL(file)))
          // Cleared so picking the same file again still fires a change.
          event.target.value = ''
        }}
      />
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

import {
  useEffect,
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
  DESCRIBE_MORE_LABEL,
  CONTENT_LIBRARY_PREVIEW_URLS,
  LIBRARY_PREVIEW_URLS,
  NEED_MATCHA_LABEL,
  NEED_MATCHA_LINE,
  PROMPT_FILE_EXTENSION,
  PROMPT_FILE_LINES,
  SCENE_LIBRARY_BRIEF,
  STILL_LANES,
  STUDIO_CTA_LABELS,
  STUDIO_RATIOS,
  UPLOADING_LABEL,
  UPLOAD_ERRORS,
  UPLOAD_KINDS,
  UPLOAD_LIMITS,
  canAffordGeneration,
  studioSetup,
} from '@/lib/studio'
import { useImportPromptFile } from '@/hooks/usePromptFiles'
import { useDeleteStudioImage, useUploadStudioImage } from '@/hooks/useStudioUploads'
import { prepareStudioImage } from '@/lib/media'
import { studioSession } from '@/lib/sessionStorage/studioSession'
import { useAuth } from '@/providers/AuthProvider'
import type {
  MinaBlockHandle,
  MinaBlockUserBriefHandle,
  MinaNote,
  MmaStatus,
  StudioMode,
  StudioSetup,
  StudioUpload,
  UploadKind,
} from '@/types'

import { Rule } from '../builder/Table'
import { StudioLibrary } from '../studioLibrary/StudioLibrary'
import { MinaBlockPillsAnimate } from './MinaBlockPillsAnimate'
import { MinaBlockPillsCreate } from './MinaBlockPillsCreate'
import { MinaBlockMinaBrief } from './MinaBlockMinaBrief'
import { MinaBlockRatioPill } from './MinaBlockRatioPill'
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
  onCreate,
  uploads,
  onUploads,
  minaStatus,
  onMinaEnd,
  ref,
}: {
  mode: StudioMode
  credits: number | undefined
  onNeedMatcha: () => void
  /** Create mode's call to action; Animate's is not wired yet. */
  onCreate: () => void
  uploads: StudioUpload[]
  onUploads: Dispatch<SetStateAction<StudioUpload[]>>
  /** The running Create's step, while Mina types in the brief's place; undefined the rest of the time. */
  minaStatus: MmaStatus | undefined
  onMinaEnd: () => void
  ref?: Ref<MinaBlockHandle>
}) {
  const [upload, setUpload] = useState<UploadKind>('scene')
  // The file input is outside the pills so it can be reused for every pill, the ref is used to trigger the file picker when the user clicks on the "+" button of a pill
  const fileInput = useRef<HTMLInputElement>(null)
  // Opens the computer's file dialog for that pill, unless it is already full.
  // The chosen files are uploaded in the input's onChange.
  const openFilePicker = (kind: UploadKind) => roomFor(kind) > 0 && fileInput.current?.click()

  const uploadsOf = (kind: UploadKind) => uploads.filter((entry) => entry.kind === kind)
  //this is a method that checks if there is room for more uploads of a certain kind, it returns the number of remaining uploads allowed for that kind
  const roomFor = (kind: UploadKind) => UPLOAD_LIMITS[kind] - uploadsOf(kind).length

  const { session } = useAuth()
  const uploadImage = useUploadStudioImage()
  const deleteImage = useDeleteStudioImage()
  const importPromptFile = useImportPromptFile()
  // Whether the brief has nothing to send, typed or locked: Create then asks for more instead.
  const [isBriefEmpty, setIsBriefEmpty] = useState(() => {
    const { brief, locked } = studioSession.read()
    return !brief?.trim() && !locked
  })
  // What Mina says over the brief (a picture refused, a prompt file loaded), until the user goes back to the brief.
  const [minaNote, setMinaNote] = useState<MinaNote | null>(null)
  const sayWarning = (line: string) => setMinaNote({ line, tone: 'warning' })
  // The list as it stands now, for an upload that lands after the render that started it.
  const latestUploads = useRef(uploads)
  useEffect(() => {
    latestUploads.current = uploads
  })

// This method is called when the user uses the file picker to upload a file to the server, it takes the kind of upload and the file to be uploaded as parameters
  const uploadFile = async (kind: UploadKind, file: File) => {
    if (!session) return

    let image: Blob
    try {
      image = await prepareStudioImage(file)
    } catch (error) {
      sayWarning((error as Error).message)
      return
    }

    const preview = URL.createObjectURL(image)
    //this line adds the new upload to the list of uploads in the parent component (StudioPage) through the onUploads prop,
    //it sets the kind, url, origin and isUploading properties of the new upload
    onUploads((list) => [...list, { kind, url: preview, origin: 'upload', isUploading: true }])

    try {
      //This line uploads the image to the server using the useUploadStudioImage hook, it passes the access token and the image to be uploaded as parameters
      const { url } = await uploadImage.mutateAsync({ token: session.access_token, image })

      //this line checks if the upload that just finished is still in the list of uploads, if it is not,
      //it means that the user has removed it before it finished uploading, so it deletes the image from the server
      if (!latestUploads.current.some((entry) => entry.url === preview)) {
        deleteImage.mutate({ token: session.access_token, url })
        return
      }
      //this line updates the list of uploads in the parent component (StudioPage) through the onUploads prop, it sets the kind, url and origin 
      //properties of the upload that just finished uploading
      onUploads((list) => list.map((entry) => (entry.url === preview ? { kind, url, origin: 'upload' } : entry)))
    } catch {
      //this line removes the upload that failed from the list of uploads in the parent component (StudioPage) through the onUploads prop
      onUploads((list) => list.filter((entry) => entry.url !== preview))
      sayWarning(UPLOAD_ERRORS.failed(file.name))
    } finally {
      URL.revokeObjectURL(preview)
    }
  }

  // the remove function is used to remove an upload from the MinaBlockUploadAndLibraries component.
  const remove = (url: string) => {
    const entry = uploads.find((upload) => upload.url === url)
    onUploads((list) => list.filter((upload) => upload.url !== url))

    //This line checks if the upload that is being removed is an upload that was uploaded by the user, and if it is not still uploading and has not been sent to the server yet,
    //if all these conditions are met, it calls the deleteImage.mutate function to delete the image from the server
    if (session && entry?.origin === 'upload' && !entry.isUploading && !entry.isSent) {
      deleteImage.mutate({ token: session.access_token, url })
    }
  }

  /**
   * Pictures for the lit pill, from the file picker, a paste or a drop. A new
   * scene takes the old one's place, since there is only ever one; on the other
   * pills only what fits is uploaded, and Mina says so in the brief when some
   * did not. A new add starts with Mina's last upload error cleared.
   */
  const addPictures = (files: File[]) => {
    setMinaNote(null)

    if (upload === 'scene') {
      for (const entry of uploadsOf('scene')) remove(entry.url)
      void uploadFile('scene', files[0]!)
      return
    }

    const room = roomFor(upload)
    for (const file of files.slice(0, room)) void uploadFile(upload, file)
    if (files.length <= room) return

    sayWarning(UPLOAD_ERRORS.full(UPLOAD_LIMITS[upload]))
  }
  /**
   * A dropped `.mina` file: the API unseals it, then its setup replaces the
   * studio's, the current pictures leaving as a removal would take them. Mina
   * says how it went over the brief, in green either way.
   */
  const openPromptFile = async (file: File) => {
    if (!session) return
    setMinaNote(null)

    let setup: StudioSetup
    try {
      setup = await importPromptFile.mutateAsync({ token: session.access_token, file })
    } catch {
      setMinaNote({ line: PROMPT_FILE_LINES.unreadable, tone: 'info' })
      return
    }
  // When we import a correct mina prompt file we start removing any old url uploaded by the user
    for (const entry of latestUploads.current) remove(entry.url)

    // Each piece saves itself to the session, as it does when the user changes it.
    const next = studioSetup(setup)
    onUploads(next.uploads)
    setLaneIndex(STILL_LANES.findIndex((entry) => entry.lane === next.lane))
    setRatioIndex(next.ratioIndex)
    setIsLandscape(next.isLandscape)
    userBrief.current?.setupBrief(next.locked, next.brief)
    setMinaNote({ line: PROMPT_FILE_LINES.loaded, tone: 'info' })
  }

  // The latest ones, for the page-wide paste and drop listeners below.
  const latestAddPictures = useRef(addPictures)
  const latestOpenPromptFile = useRef(openPromptFile)
  useEffect(() => {
    latestAddPictures.current = addPictures
    latestOpenPromptFile.current = openPromptFile
  })

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
  // Kept in sessionStorage, where the Create request reads it.
  const [laneIndex, setLaneIndex] = useState(() =>
    Math.max(0, STILL_LANES.findIndex((entry) => entry.lane === studioSession.read().lane)),
  )
  const lane = STILL_LANES[laneIndex]!
  useEffect(() => studioSession.save({ lane: lane.lane }), [lane])
  // Shared by both modes' pills, and kept in sessionStorage like the lane.
  const [ratioIndex, setRatioIndex] = useState(() => studioSession.read().ratioIndex ?? 0)
  const [isLandscape, setIsLandscape] = useState(() => studioSession.read().isLandscape ?? false)
  useEffect(() => studioSession.save({ ratioIndex, isLandscape }), [ratioIndex, isLandscape])
  const ratioPill = (
    <MinaBlockRatioPill
      ratioIndex={ratioIndex}
      isLandscape={isLandscape}
      onNext={() => setRatioIndex((index) => (index + 1) % STUDIO_RATIOS.length)}
      onFlip={() => setIsLandscape((was) => !was)}
    />
  )
  //If the image is in the process of being uploaded, the create button is disabled / changes the text to uploading... to prevent the user from starting a generation with incomplete or missing uploads.
  const isUploading = mode === 'create' && uploads.some((entry) => entry.isUploading)
  const canAfford = credits === undefined || canAffordGeneration(credits, mode, lane, resolution, duration)
  const [uploadSwitch, setUploadSwitch] = useState<'up' | 'down' | null>(null)
  const [leavingUpload, setLeavingUpload] = useState<UploadKind | null>(null)

//the animation is simple if the block is already open, or if we refresh the page and the brief is already filled, otherwise it is long,
//  this is used to determine which animation to play when the block opens
  const [animation, setAnimation] = useState<'long' | 'simple' | null>(() => {
    const { brief, locked } = studioSession.read()
    return brief || locked || uploads.length ? 'simple' : null
  })
  const [simpleRuns, setSimpleRuns] = useState(0)
  const [openLibrary, setOpenLibrary] = useState<'scene' | 'content' | null>(null)
  const isOpen = animation !== null

  // Once the block is open in Create mode, a picture pasted or dropped anywhere on
  // the page goes to the lit pill, as the "+" would take it. Anything else pasted
  // (text into the brief) is left alone.
  useEffect(() => {
    if (mode !== 'create' || !isOpen) return

    const take = (files: FileList | null | undefined) => {
      const pictures = [...(files ?? [])].filter((file) => file.type.startsWith('image/'))
      if (pictures.length) latestAddPictures.current(pictures)
      return pictures.length > 0
    }
    const paste = (event: ClipboardEvent) => {
      if (take(event.clipboardData?.files)) event.preventDefault()
    }
    // Without it the browser refuses the drop, or opens the picture in place of the studio.
    const dragOver = (event: DragEvent) => event.preventDefault()
    const drop = (event: DragEvent) => {
      event.preventDefault()
      // A prompt file is a whole setup, so it wins over any pictures dropped with it.
      // .mina upload: the first dropped file whose name ends in `.mina`, if there is one.
      const promptFile = [...(event.dataTransfer?.files ?? [])].find((file) =>
        file.name.toLowerCase().endsWith(PROMPT_FILE_EXTENSION),
      )
      // .mina prompt file drag drop upload
      if (promptFile) return void latestOpenPromptFile.current(promptFile)
      // Pictures drag drop upload
      take(event.dataTransfer?.files)
    }

    document.addEventListener('paste', paste)
    document.addEventListener('dragover', dragOver)
    document.addEventListener('drop', drop)

    return () => {
      document.removeEventListener('paste', paste)
      document.removeEventListener('dragover', dragOver)
      document.removeEventListener('drop', drop)
    }
  }, [mode, isOpen])
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

  //THESE METHODS animate() and OpenFilePickerScene() and ShowScene() ARE CALLED FROM THE PARENT COMPONENT (STUDIO PAGE) TO ANIMATE THE BLOCK AT START AND TO OPEN THE FILE PICKER FOR THE SCENE PILL
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
    removeUpload: remove,
    showScene: () => {
      openLong()
      selectUploadKind('scene')
    },
  }))

//This shows the upload row depending on the mode and the kind of upload selected, if the mode is animate it shows the animate upload row,
//if the mode is create it shows the create upload row with the selected kind
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
        images={uploadsOf(kind)}
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
            ratioPill={ratioPill}
          />
        ) : (
          <MinaBlockPillsCreate
            upload={upload}
            uploads={uploads}
            onSelectUploadKind={selectUploadKind}
            onOpenFilePicker={openFilePicker}
            laneLabel={lane.label}
            onNextLane={() => setLaneIndex((index) => (index + 1) % STILL_LANES.length)}
            ratioPill={ratioPill}
          />
        ))}
      <div ref={brief} className="mina-block__brief" onFocus={openLong}>
        {minaStatus ? (
          <MinaBlockMinaBrief status={minaStatus} onEnd={onMinaEnd} />
        ) : (
          <MinaBlockUserBrief
            ref={userBrief}
            placeholder={BRIEF_PLACEHOLDERS[mode]}
            minaNote={minaNote}
            onClearMinaNote={() => setMinaNote(null)}
            onIsEmptyChange={setIsBriefEmpty}
          />
        )}
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
            {!canAfford ? (
              <MinaBlockCTA
                label={NEED_MATCHA_LABEL}
                isStill
                onClick={() => {
                  setMinaNote({ line: NEED_MATCHA_LINE, tone: 'info' })
                  onNeedMatcha()
                }}
              />
            ) : mode === 'create' && isBriefEmpty && !isUploading && !minaStatus ? (
              // Nothing to send yet: the button takes the user to the brief, as a click on it would.
              <MinaBlockCTA label={DESCRIBE_MORE_LABEL} isStill onClick={() => userBrief.current?.focus()} />
            ) : (
              <MinaBlockCTA
                label={isUploading ? UPLOADING_LABEL : STUDIO_CTA_LABELS[mode]}
                isDisabled={isUploading || Boolean(minaStatus)}
                onClick={mode === 'create' ? onCreate : undefined}
              />
            )}
          </div>
        </>
      )}
      {openLibrary && (
        <StudioLibrary
          library={openLibrary}
          onClose={() => setOpenLibrary(null)}
          onPickScene={(url) => {
            onUploads((list) => [...list, { kind: 'scene', url, origin: 'scene_library' }])
            //Setup the brief with the scene library upload.
            userBrief.current?.setupBrief(SCENE_LIBRARY_BRIEF.locked, SCENE_LIBRARY_BRIEF.brief)
          }}
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
          addPictures([...(event.target.files ?? [])])
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
    <button className="mina-block__vision comment-button button" type="button" onClick={() => setIsOn((was) => !was)}>
      Mina vision intelligence: {isOn ? 'ON' : 'OFF'}
    </button>
  )
}

function MinaBlockCTA({
  label,
  isDisabled,
  isStill,
  onClick,
}: {
  label: string
  isDisabled?: boolean
  /** No hover or click change, for "I need more matcha". */
  isStill?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`mina-block__cta h2 button${isStill ? ' mina-block__cta--still' : ''}`}
      type="button"
      disabled={isDisabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

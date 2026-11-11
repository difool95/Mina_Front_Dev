import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppFooter } from '@/components/AppFooter'
import { AutoMatchaPanel } from '@/components/AutoMatchaPanel'
import { MatchaPanel } from '@/components/MatchaPanel'
import { MinaBlock } from '@/components/studio/MinaBlock'
import { RightStudioPanel } from '@/components/studio/RightStudioPanel'
import { RoleTagCard } from '@/components/RoleTagCard'
import { useAccountSetup } from '@/hooks/useAccounts'
import { useCustomerCredits } from '@/hooks/useCustomerCredits'
import { useStartFingertips } from '@/hooks/useFingertips'
import { useGenerationStatus, useStartStillGeneration } from '@/hooks/useGenerations'
import { MINA_LOGO_URL } from '@/lib/constants'
import { studioSession } from '@/lib/sessionStorage/studioSession'
import { FINGERTIPS_MATCHAS, NEED_MATCHA_LINE, STILL_LANES, STUDIO_RATIOS, studioRatio, withScene } from '@/lib/studio'
import { useAuth } from '@/providers/AuthProvider'
import type { EditTool, GenerationProgress, PickedBrandMemoryPictures, MinaBlockHandle, MmaStatus, StudioMode, StudioUpload } from '@/types'

import './StudioPage.css'

/**
 * `/` once signed in — the workspace itself.
 *
 * Presentation only for now: nothing here submits a prompt or uploads a file
 * yet, so the two panels are laid out and left inert.
 */
export function StudioPage() {
  const [mode, setMode] = useState<StudioMode>('create')
  const block = useRef<MinaBlockHandle>(null)
  // Held here rather than in the block: the panel beside it shows them too.
  const [uploads, setUploads] = useState<StudioUpload[]>(() => studioSession.read().uploads ?? [])
//this line saves the uploads to the session storage whenever the uploads state changes. It filters out any uploads that are still
//uploading and only saves the completed uploads to the session storage. This ensures that the uploads are persisted across page refreshes
//and tab closures, while also preventing incomplete uploads from being saved.
  useEffect(() => studioSession.save({ uploads: uploads.filter((entry) => !entry.isUploading) }), [uploads])
  // Same single slot as the profile: "Back" in the auto panel returns to the buy panel.
  const [matchaPanel, setMatchaPanel] = useState<'buy' | 'auto' | null>(null)
  const { session } = useAuth()
  const { data: credits, isSuccess: hasCredits } = useCustomerCredits(session?.user.id)
  // ─── Create ─────────────────────────────────────────────────────────────
  const startGeneration = useStartStillGeneration(session?.user.id)
  const generationId = startGeneration.data?.generationId
  //this line starts polling the generation status for the current generationId and userId. It uses a custom hook useGenerationStatus that takes in the generationId and
  // userId as parameters and returns the current status of the generation. The status is updated every few seconds until the generation has ended.
  const createProgress = useGenerationStatus(generationId, session?.user.id)

  // The "Create" button is disabled while any upload is in progress, so the user cannot start a generation until all uploads are complete.
  // This prevents the user from starting a generation with incomplete or missing uploads, which could lead to errors or unexpected behavior.
  const create = (picked: { uploads: StudioUpload[]; brandMemories: PickedBrandMemoryPictures[] }) => {
    if (!session || minaStatus || uploads.some((entry) => entry.isUploading)) return

    const {
      studioSessionId = crypto.randomUUID(),
      ratioIndex = 0,
      isLandscape = false,
      lane = 'niche',
      brief = '',
      locked = '',
    } = studioSession.read()
    studioSession.save({ studioSessionId })
    startGeneration.mutate(
      {
        token: session.access_token,
        studioSessionId,
        platform: STUDIO_RATIOS[ratioIndex]!.platform,
        // The image engine renders this ratio, landscape flip included.
        aspectRatio: studioRatio(ratioIndex, isLandscape),
        lane,
        // MMA reads the locked strip as the brief's last line.
        brief: [brief, locked].filter(Boolean).join('\n'),
        //this line maps the uploads array to a new array of objects that only contain the kind, url, and origin properties. This is done to ensure that only
        //the necessary data is sent to the API for generation, and any additional properties that may be present in the uploads array are not included in the request body.
        uploads: picked.uploads.map(({ kind, url, origin }) => ({ kind, url, origin })),
        brandMemories: picked.brandMemories,
      },
      //This line updates the upload isSent state to true, this is done to indicate that the upload has been sent to the API for generation
      //and is no longer in the process of being uploaded. This is important for the user interface, as it allows the user to see which uploads
      //have been successfully uploaded in R2 cloudflare and which are still in progress.
      { onSuccess: () => setUploads((list) => list.map((entry) => ({ ...entry, isSent: true }))) },
    )
  }

  // ─── Edit tools (fingertips) ────────────────────────────────────────────
  // An edit tool's run on a picture of the right panel, followed the same way as a Create.
  const startEdit = useStartFingertips(session?.user.id)
  //the generationId is returned as part of the response from the startEdit.mutate function, which is called when the user initiates an edit on a picture.
  const editId = startEdit.data?.generationId
  const editProgress = useGenerationStatus(editId, session?.user.id)

  // An edit tool (Tweak, SVG) on the picture on show in the right panel.
  // Returns whether it started, so the edit bar only clears the note it was sent.
  const startFingertips = (tool: EditTool, imageUrl: string, brief = '') => {
    if (!session || minaStatus) return false

    const { ratioIndex = 0, isLandscape = false, lane = 'niche' } = studioSession.read()

    const balance = credits?.mg_credits ?? 0
    // The tool's own price (SVG), or for Tweak the lane picked in the block, as a Create.
    const price = FINGERTIPS_MATCHAS[tool] ?? STILL_LANES.find((entry) => entry.lane === lane)!.matchas
    // Only once the balance has loaded: before that, the API checks it anyway.
    const isShort = hasCredits && balance < price
    if (isShort) {
      // Mina's pink line in the brief, and nothing is sent.
      block.current?.sayWarning(NEED_MATCHA_LINE)
      return false
    }

    startEdit.mutate({
      token: session.access_token,
      tool,
      imageUrl,
      brief,
      lane,
      aspectRatio: studioRatio(ratioIndex, isLandscape),
      platform: STUDIO_RATIOS[ratioIndex]!.platform,
    })
    return true
  }

  // ─── Shared by both (Edit tools + Create) ───
  //We get the generations from the studio session storage and set them to the state variable generations.
  const [generations, setGenerations] = useState<string[]>(() => studioSession.read().generations ?? [])
  //We save the generations to the session storage whenever the generations state changes. This ensures that the generations are persisted across page
  //refreshes and tab closures.
  useEffect(() => studioSession.save({ generations }), [generations])
  //this is a conditional statement that checks if there is a generationId. If there is, it sets the running variable to createProgress, otherwise it sets it to
  //editProgress. This allows us to determine which generation is currently running and display the appropriate status in the UI.
  let running: GenerationProgress | undefined
  if (generationId) {
    // A Create has an id: Mina talks about the Create.
    running = createProgress
  } else {
    // No Create running: the edit's progress, or undefined when no edit is running either.
    running = editProgress
  }
  // A done picture shows the moment it is ready, and joins `generations` for good once Mina has finished talking.
  let shownGenerations: string[]
  if (running?.status === 'done') {
    // The run has finished: its new picture first, so the carousel opens on it, then the pictures already made.
    shownGenerations = [running.outputUrl, ...generations]
  } else {
    // Nothing running, still working, or failed: no new picture.
    shownGenerations = generations
  }
  const endMina = () => {
    // Keeps the new picture for good. Without one, it's the same list, so nothing changes.
    setGenerations(shownGenerations)
  // When we get the generation, we also get the Id's of the brand memories that were not used in the generation. We then call the untickMemories
  // method on the MinaBlock component to untick those memories in the UI so that they are not selected for next generation.
    if (createProgress?.unusedMemoryIds.length) block.current?.untickMemories(createProgress.unusedMemoryIds)
    startGeneration.reset()
    startEdit.reset()
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Mina types in the brief from the click until the generation has ended and she has said so;
  // `progressing` covers the request itself, before there is a status to read.
  // A Create or a Tweak was clicked (the request is on its way) or is running (it has an id to poll).
  const isCreating = startGeneration.isPending || Boolean(generationId)
  const isEditing = startEdit.isPending || Boolean(editId)

  let minaStatus: MmaStatus | undefined
  if (isCreating || isEditing) {
    // The step the backend wrote on the generation row, or 'progressing' until there is one to read.
    minaStatus = running?.status ?? 'progressing'
  } else {
    // Nothing running: the block shows the normal brief.
    minaStatus = undefined
  }

  const autoRefill = credits?.mg_mma_preferences?.autoRefill

  // Either mode button also plays the prompt block's entrance: the long one
  // if it has not opened yet, the simple one once it has.
  const pickMode = (next: StudioMode) => {
    setMode(next)
    //This is a method that is called from the parent component (StudioPage) to animate the block at start. It is a default React hook that allows the parent
    //component to call methods on the child component (MinaBlock) through a ref. This method is exposed to the parent component through the ref, it allows the parent
    //component to trigger the animation of the MinaBlock from outside.
    block.current?.animate()
  }

  // The free matchas are granted here rather than in AuthProvider, so the
  // magic-link tab — which never reaches the studio — cannot grant them too.
  useAccountSetup(session)

  return (
    <div className="mina-studio">
      <section className="mina-studio__main">
        <header className="mina-studio__bar">
          <div className="mina-studio__brand">
            <Link className="mina-studio__logo" to="/" aria-label="Mina home">
              <img src={MINA_LOGO_URL} alt="Mina" />
            </Link>
            <RoleTagCard />
          </div>

          <nav className="mina-studio__modes">
            <button
              className={`mina-studio__mode paragraph-title-button bold button${mode === 'create' ? '' : ' muted'}`}
              type="button"
              aria-current={mode === 'create'}
              onClick={() => pickMode('create')}
            >
              Create
            </button>
            <button
              className={`mina-studio__mode paragraph-title-button bold button${mode === 'animate' ? '' : ' muted'}`}
              type="button"
              aria-current={mode === 'animate'}
              onClick={() => pickMode('animate')}
            >
              Animate
            </button>
          </nav>
        </header>

        <main className="mina-studio__prompt">
          <MinaBlock
            ref={block}
            mode={mode}
            credits={hasCredits ? (credits?.mg_credits ?? 0) : undefined}
            onNeedMatcha={() => setMatchaPanel('buy')}
            onCreate={create}
            uploads={uploads}
            onUploads={setUploads}
            minaStatus={minaStatus}
            minaFlow={isEditing ? 'fingertips' : 'create'}
            onMinaEnd={endMina}
          />
        </main>

        <AppFooter current="studio" onOpenMatcha={() => setMatchaPanel('buy')} />
      </section>
      {/*the right studio panel and the block.current.OpenFilePickerScene() method is defined in the child component(MinaBlock) */}
      <RightStudioPanel
        mode={mode}
        uploads={uploads}
        generations={shownGenerations}
        //This return true if the minaStatus is not undefined, which means that the MinaBlock is currently processing a request. 
        //This disables the edit tools in the RightStudioPanel while Mina is busy.
        isBusy={Boolean(minaStatus)}
        onFingertips={startFingertips}
        onUpload={() => block.current?.OpenFilePickerScene()}
        onSetScene={(url) => {
          //This line updates the uploads state to include the new scene upload. It filters out any existing scene uploads and adds the new scene upload
          //to the end of the list. The new scene upload is marked as sent, indicating that it has been successfully uploaded to R2 cloudflare. This ensures 
          //that the user can see the newly added scene in the right studio panel and that it is available for use in the generation process.
          setUploads((list) => withScene(list, url))
          //This line calls the showScene() method defined on the MinaBlock component(the child component).
          block.current?.showScene()
        }}
        //we delete the upload from the uploads state and also remove it from the generations state. This ensures that the deleted upload is no longer displayed in the right studio panel
        //and is not available for use in the generation process.
        onRemove={(url) => {
          block.current?.removeUpload(url)
          setGenerations((list) => list.filter((entry) => entry !== url))
        }}
      />

      {matchaPanel === 'buy' && (
        <MatchaPanel
          onClose={() => setMatchaPanel(null)}
          isAutoMatchaOn={autoRefill?.enabled ?? false}
          onOpenAutoMatcha={() => setMatchaPanel('auto')}
        />
      )}

      {matchaPanel === 'auto' && (
        <AutoMatchaPanel
          onBack={() => setMatchaPanel('buy')}
          onSaved={() => setMatchaPanel(null)}
          initialAutoRefill={autoRefill}
        />
      )}
    </div>
  )
}

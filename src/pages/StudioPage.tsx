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
import { useStartStillGeneration } from '@/hooks/useGenerations'
import { MINA_LOGO_URL } from '@/lib/constants'
import { studioSession } from '@/lib/sessionStorage/studioSession'
import { STUDIO_RATIOS } from '@/lib/studio'
import { useAuth } from '@/providers/AuthProvider'
import type { MinaBlockHandle, StudioMode, StudioUpload } from '@/types'

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
  const startGeneration = useStartStillGeneration(session?.user.id)

  // The "Create" button is disabled while any upload is in progress, so the user cannot start a generation until all uploads are complete.
  // This prevents the user from starting a generation with incomplete or missing uploads, which could lead to errors or unexpected behavior.
  const create = () => {
    if (!session || startGeneration.isPending || uploads.some((entry) => entry.isUploading)) return

    const {
      studioSessionId = crypto.randomUUID(),
      ratioIndex = 0,
      isCreative = false,
      brief = '',
      locked = '',
    } = studioSession.read()
    studioSession.save({ studioSessionId })
    startGeneration.mutate(
      {
        token: session.access_token,
        studioSessionId,
        platform: STUDIO_RATIOS[ratioIndex]!.platform,
        isCreative,
        // MMA reads the locked strip as the brief's last line.
        brief: [brief, locked].filter(Boolean).join('\n'),
        //this line maps the uploads array to a new array of objects that only contain the kind, url, and origin properties. This is done to ensure that only
        //the necessary data is sent to the API for generation, and any additional properties that may be present in the uploads array are not included in the request body.
        uploads: uploads.map(({ kind, url, origin }) => ({ kind, url, origin })),
      },
      //This line updates the upload isSent state to true, this is done to indicate that the upload has been sent to the API for generation
      //and is no longer in the process of being uploaded. This is important for the user interface, as it allows the user to see which uploads
      //have been successfully uploaded in R2 cloudflare and which are still in progress.
      { onSuccess: () => setUploads((list) => list.map((entry) => ({ ...entry, isSent: true }))) },
    )
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
              className="mina-studio__mode"
              type="button"
              aria-current={mode === 'create'}
              onClick={() => pickMode('create')}
            >
              Create
            </button>
            <button
              className="mina-studio__mode"
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
          />
        </main>

        <AppFooter current="studio" onOpenMatcha={() => setMatchaPanel('buy')} />
      </section>
      {/*the right studio panel and the block.current.OpenFilePickerScene() method is defined in the child component(MinaBlock) */}
      <RightStudioPanel mode={mode} uploads={uploads} onUpload={() => block.current?.OpenFilePickerScene()} />

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

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppFooter } from '@/components/AppFooter'
import { AutoMatchaPanel } from '@/components/AutoMatchaPanel'
import { MatchaPanel } from '@/components/MatchaPanel'
import { MinaBlock } from '@/components/studio/MinaBlock'
import { RoleTagCard } from '@/components/RoleTagCard'
import { useAccountSetup } from '@/hooks/useAccounts'
import { useCustomerCredits } from '@/hooks/useCustomerCredits'
import { MINA_LOGO_URL } from '@/lib/constants'
import { useAuth } from '@/providers/AuthProvider'
import type { StudioMode } from '@/types'

import './StudioPage.css'

/**
 * `/` once signed in — the workspace itself.
 *
 * Presentation only for now: nothing here submits a prompt or uploads a file
 * yet, so the two panels are laid out and left inert.
 */
export function StudioPage() {
  const [mode, setMode] = useState<StudioMode>('create')
  const block = useRef<{ animate: () => void }>(null)
  // Same single slot as the profile: "Back" in the auto panel returns to the buy panel.
  const [matchaPanel, setMatchaPanel] = useState<'buy' | 'auto' | null>(null)
  const { session } = useAuth()
  const { data: credits, isSuccess: hasCredits } = useCustomerCredits(session?.user.id)
  const autoRefill = credits?.mg_mma_preferences?.autoRefill

  // Either mode button also plays the prompt block's entrance: the long one
  // if it has not opened yet, the simple one once it has.
  const pickMode = (next: StudioMode) => {
    setMode(next)
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
          />
        </main>

        <AppFooter current="studio" onOpenMatcha={() => setMatchaPanel('buy')} />
      </section>

      <section className="mina-studio__panel">
        <button className="mina-studio__upload" type="button">
          + Upload image or video
        </button>
      </section>

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

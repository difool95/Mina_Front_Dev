import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { AccountMenu } from '@/components/AccountMenu'
import { AppFooter } from '@/components/AppFooter'
import { CreationCard } from '@/components/CreationCard'
import { useCustomerCredits } from '@/hooks/useCustomerCredits'
import { useDeleteGeneration, useDownloadMedia, useGenerations } from '@/hooks/useGenerations'
import { MINA_LOGO_URL } from '@/lib/constants'
import {
  filenameOf,
  filterGenerations,
  labelFor,
  nextFilter,
  MODE_FILTERS,
  RATIO_FILTERS,
  TIME_FILTERS,
} from '@/lib/generations'
import { useAuth } from '@/providers/AuthProvider'
import { signOut } from '@/services/auth.service'
import type { ArchiveLayout, ModeFilter, RatioFilter, TimeFilter } from '@/types/generation.types'

import './ProfilePage.css'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'

  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** `/profile` — the account header and the archive of everything made. */
export function ProfilePage() {
  const [time, setTime] = useState<TimeFilter>('all')
  const [mode, setMode] = useState<ModeFilter>('all')
  const [ratio, setRatio] = useState<RatioFilter>('all')
  const [layout, setLayout] = useState<ArchiveLayout>('editorial')
  // Mobile only: the account fields collapse behind this, since the row cannot
  // fit across a phone. Desktop ignores it and shows them all.
  const [menuOpen, setMenuOpen] = useState(false)

  const { session, loading } = useAuth()
  const userId = session?.user.id

  const { data: generations, isPending } = useGenerations(userId)
  const { data: credits } = useCustomerCredits(userId)
  const remove = useDeleteGeneration(userId)
  const download = useDownloadMedia()

  const visible = filterGenerations(generations ?? [], { time, mode, ratio })

  // Covers both signing out from here and opening `/profile` with no session:
  // the moment the session goes, there is nothing on this page to show.
  if (!loading && !session) return <Navigate to="/" replace />

  return (
    <div className="mina-profile">
      <header className="mina-profile__top">
        <Link className="mina-profile__logo" to="/" aria-label="Mina home">
          <img src={MINA_LOGO_URL} alt="Mina" />
        </Link>
        <button className="mina-profile__matcha" type="button">
          Get more Matcha
        </button>
      </header>

      {/* The two wrappers below are `display: contents` on desktop, so every
          field still lays out as one wrapping row there. */}
      <div className="mina-profile__account">
        <div className="mina-profile__account-head">
          {/* Spelled out on desktop, clipped to fit the phone header. */}
          <Link className="mina-profile__back" to="/" data-tooltip="Back to the studio">
            <span className="mina-profile__back--long">Go Back</span>
            <span className="mina-profile__back--short">Back</span>
          </Link>
          <button
            className="mina-profile__menu"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((wasOpen) => !wasOpen)}
          >
            {menuOpen ? 'Close Menu' : 'Menu'}
          </button>
        </div>

        {/* Each label sits with its own value, so the two share a baseline
            however wide the value turns out to be. */}
        <div className="mina-profile__fields" data-open={menuOpen || undefined}>
          <span className="mina-profile__field mina-profile__field--email">
            <span className="mina-profile__label">Email</span>
            <AccountMenu email={session?.user.email ?? ''} />
          </span>

          <span className="mina-profile__field mina-profile__field--brand">
            <span className="mina-profile__label">Brand Memory</span>
            <button className="mina-profile__toggle" type="button">
              ON
            </button>
          </span>

          <span className="mina-profile__field mina-profile__field--auto">
            <span className="mina-profile__label">Auto-Matcha</span>
            <button className="mina-profile__toggle" type="button">
              OFF
            </button>
          </span>

          <span className="mina-profile__field mina-profile__field--matcha">
            <span className="mina-profile__label">Matcha</span>
            <span className="mina-profile__value">{credits?.mg_credits ?? 0}</span>
          </span>

          <span className="mina-profile__field mina-profile__field--expiry">
            <span className="mina-profile__label">Best before</span>
            <span className="mina-profile__value">{formatDate(credits?.mg_expires_at)}</span>
          </span>

          <button className="mina-profile__logout" type="button" onClick={() => void signOut()}>
            Logout
          </button>
        </div>
      </div>

      <div className="mina-profile__archive-head">
        <div>
          <h1 className="mina-profile__title">Archive</h1>
          <p className="mina-profile__count">
            {isPending
              ? 'Loading…'
              : `${visible.length} ${visible.length === 1 ? 'creation' : 'creations'}`}
          </p>
        </div>

        <div className="mina-profile__filters">
          {/* Dropped on phones, where four pills are all that fit beside the title. */}
          <button
            className="mina-profile__filter mina-profile__filter--date"
            type="button"
            data-tooltip="Filter by date"
            onClick={() => setTime(nextFilter(TIME_FILTERS, time))}
          >
            {labelFor(TIME_FILTERS, time)}
          </button>
          <button
            className="mina-profile__filter"
            type="button"
            data-tooltip="Filter by type"
            onClick={() => setMode(nextFilter(MODE_FILTERS, mode))}
          >
            {labelFor(MODE_FILTERS, mode)}
          </button>
          {/* Nothing in the schema records a like yet, so this only ever reads
              "Liked" — the slot is here for when that lands. */}
          <button className="mina-profile__filter" type="button" data-tooltip="Liked only">
            Liked
          </button>
          <button
            className="mina-profile__filter"
            type="button"
            data-tooltip="Filter by ratio"
            onClick={() => setRatio(nextFilter(RATIO_FILTERS, ratio))}
          >
            {labelFor(RATIO_FILTERS, ratio)}
          </button>
          <button
            className="mina-profile__filter mina-profile__filter--layout"
            type="button"
            aria-label="Change layout"
            aria-pressed={layout === 'library'}
            // Names the layout it switches *to*, not the one you are in.
            data-tooltip={layout === 'library' ? 'Editorial layout' : 'Library grid'}
            onClick={() => setLayout(layout === 'editorial' ? 'library' : 'editorial')}
          >
            {/* Four tiles that slide and resize between the two layouts: ragged
                heights for editorial, an even grid for library. The geometry
                lives in CSS so it can be transitioned. */}
            <svg
              className="mina-profile__layout-icon"
              viewBox="0 0 16 16"
              width="13"
              height="13"
              aria-hidden="true"
            >
              <rect x="0" y="0" width="6" height="9" />
              <rect x="8" y="0" width="8" height="5" />
              <rect x="0" y="11" width="6" height="5" />
              <rect x="8" y="7" width="8" height="9" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`mina-archive mina-archive--${layout}`}>
        {visible.map((generation) => (
          <CreationCard
            key={generation.mg_id}
            generation={generation}
            uniform={layout === 'library'}
            onDownload={() =>
              download.mutate({
                url: generation.mg_output_url ?? '',
                filename: filenameOf(generation),
              })
            }
            onDelete={() => remove.mutate(generation.mg_id)}
          />
        ))}
      </div>

      <AppFooter current="profile" mobileOnly />
    </div>
  )
}

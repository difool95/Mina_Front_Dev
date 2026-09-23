import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { AccountMenu } from '@/components/AccountMenu'
import { AppFooter } from '@/components/AppFooter'
import { AutoMatchaPanel } from '@/components/AutoMatchaPanel'
import { CreationCard } from '@/components/CreationCard'
import { CreationFullScreen } from '@/components/CreationFullScreen'
import { CreationSkeleton } from '@/components/CreationSkeleton'
import { MatchaPanel } from '@/components/MatchaPanel'
import { Row, Rule, Table } from '@/components/builder/Table'
import { useSignOutAccount, useSwitchAccount } from '@/hooks/useAccounts'
import { useCustomerCredits } from '@/hooks/useCustomerCredits'
import {
  useCopyLink,
  useCopyMedia,
  useDeleteGeneration,
  useDownloadMedia,
  useGenerations,
  useLikedGenerations,
} from '@/hooks/useGenerations'
import { MAX_ACCOUNTS, MINA_LOGO_URL } from '@/lib/constants'
import {
  editorialPlacement,
  filenameOf,
  filterGenerations,
  labelFor,
  nextFilter,
  viewerLinkFor,
  MODE_FILTERS,
  RATIO_FILTERS,
  TIME_FILTERS,
} from '@/lib/generations'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/providers/AuthProvider'
import type {
  ArchiveLayout,
  MegaGeneration,
  ModeFilter,
  RatioFilter,
  TimeFilter,
} from '@/types/generation.types'

import './ProfilePage.css'

/** Two full editorial rows of placeholders while the archive is on its way. */
const SKELETON_COUNT = 12

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
  const [isLikedOnly, setIsLikedOnly] = useState(false)
  const [layout, setLayout] = useState<ArchiveLayout>('editorial')
  // Mobile only: the account fields collapse behind this, since the row cannot
  // fit across a phone. Desktop ignores it and shows them all.
  const [menuOpen, setMenuOpen] = useState(false)
  // Which of the two matcha dialogs is open, if either — "Back" in the auto
  // panel always returns to the buy panel, so one slot is enough for both.
  const [matchaPanel, setMatchaPanel] = useState<'buy' | 'auto' | null>(null)
  // The creation shown full screen, or null when the archive is on show.
  const [opened, setOpened] = useState<MegaGeneration | null>(null)
  // The one creation whose panel is open, by `mg_id`. Held here rather than in
  // each card, which is what keeps a second panel from opening beside the first.
  const [panel, setPanel] = useState<string | null>(null)

  // The archive can run taller than the viewport; the page scrolls, but
  // without the browser's own scrollbar drawn over it.
  useEffect(() => {
    document.documentElement.classList.add('mina-no-scrollbar')
    return () => document.documentElement.classList.remove('mina-no-scrollbar')
  }, [])

  const { session, loading, accounts } = useAuth()
  const userId = session?.user.id
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const switchAccount = useSwitchAccount()
  const signOutAccount = useSignOutAccount()

  // Stripe redirects back here once checkout finishes; the balance it paid
  // for is already in Supabase by then, so a refetch is all this needs.
  useEffect(() => {
    if (!userId || searchParams.get('purchase') !== 'success') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.customer(userId) })
    setSearchParams((params) => {
      params.delete('purchase')
      return params
    })
  }, [userId, searchParams, queryClient, setSearchParams])

  const { data: generations, isPending } = useGenerations(userId)
  const { data: likedIds } = useLikedGenerations(userId)
  const { data: credits } = useCustomerCredits(userId)
  const autoRefill = credits?.mg_mma_preferences?.autoRefill
  const isAutoMatchaOn = autoRefill?.enabled ?? false
  const hasInvoices =
    credits?.mg_credit_lots?.some(
      (lot) => lot.ref_type === 'stripe_checkout' || lot.ref_type === 'stripe_auto_refill',
    ) ?? false
  const remove = useDeleteGeneration(userId)
  const download = useDownloadMedia()
  const copyLink = useCopyLink()
  const copyMedia = useCopyMedia()

  const visible = filterGenerations(generations ?? [], {
    time,
    mode,
    ratio,
    likedIds: isLikedOnly ? (likedIds ?? new Set()) : null,
  })

  // Paging inside the full-screen view walks the archive as it is filtered,
  // and wraps at both ends.
  const step = (delta: number) =>
    setOpened((current) => {
      const index = visible.findIndex((item) => item.mg_id === current?.mg_id)
      return visible[(index + delta + visible.length) % visible.length] ?? current
    })

  const saveMedia = (generation: MegaGeneration) =>
    download.mutate({
      url: generation.mg_output_url ?? '',
      filename: filenameOf(generation),
    })

  // Covers both signing out from here and opening `/profile` with no session:
  // the moment the session goes, there is nothing on this page to show.
  if (!loading && !session) return <Navigate to="/" replace />

  return (
    <div className="mina-profile">
      <Table className="mina-profile__head">
        <Row className="mina-profile__top">
          <Link className="mina-profile__logo" to="/" aria-label="Mina home">
            <img src={MINA_LOGO_URL} alt="Mina" />
          </Link>
          <button
            className="mina-profile__matcha"
            type="button"
            onClick={() => setMatchaPanel('buy')}
          >
            Get more Matcha
          </button>
        </Row>
        <Rule />
      </Table>

      {/* Four rows and their rules on a phone. On desktop the rows dissolve and
          every field lays out on one wrapping line — see ProfilePage.css. */}
      <Table className="mina-profile__account">
        {/* The one desktop line. It holds every row so they can dissolve into
            it, which leaves the closing rule below outside the line rather
            than wrapped into it — that is what centres the cells. */}
        <div className="mina-profile__line">
          <Row className="mina-profile__account-head">
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
          </Row>

          <Rule />

          {/* Dissolves like the rows do, so these are rows of the same table.
              It exists only to hide the three of them at once on a phone. */}
          <div className="mina-profile__fields" data-open={menuOpen || undefined}>
            {/* Brand Memory is dropped on a phone, which is what leaves Email
                and Auto-Matcha alone on this row. */}
            <Row>
              <span className="mina-profile__field mina-profile__field--email">
                <span className="mina-profile__label">Email</span>
                <AccountMenu
                  email={session?.user.email ?? ''}
                  currentUserId={userId ?? ''}
                  accounts={accounts}
                  canAdd={accounts.length < MAX_ACCOUNTS}
                  error={switchAccount.error?.message ?? null}
                  onSwitch={(account) => switchAccount.mutate(account)}
                  onAdd={() => navigate('/add-account', { state: { from: userId } })}
                />
              </span>

              <span className="mina-profile__field mina-profile__field--brand">
                <span className="mina-profile__label">Brand Memory</span>
                <button className="mina-profile__toggle" type="button">
                  ON
                </button>
              </span>

              <button
                className="mina-profile__field mina-profile__field--auto"
                type="button"
                onClick={() => setMatchaPanel('auto')}
              >
                <span className="mina-profile__label">Auto-Matcha</span>
                <span className="mina-profile__toggle">{isAutoMatchaOn ? 'ON' : 'OFF'}</span>
              </button>
            </Row>

            <Rule />

            <Row>
              <span className="mina-profile__field mina-profile__field--matcha">
                <span className="mina-profile__label">Matcha</span>
                <span className="mina-profile__value">{credits?.mg_credits ?? 0}</span>
              </span>

              <span className="mina-profile__field mina-profile__field--expiry">
                <span className="mina-profile__label">Best before</span>
                <span className="mina-profile__value">{formatDate(credits?.mg_expires_at)}</span>
              </span>
            </Row>

            <Rule />

            <Row>
              {hasInvoices && (
                <button className="mina-profile__invoices" type="button">
                  Invoices
                </button>
              )}
              <button
                className="mina-profile__logout"
                type="button"
                disabled={signOutAccount.isPending}
                onClick={() => userId && signOutAccount.mutate(userId)}
              >
                Logout
              </button>
            </Row>

            <Rule />
          </div>
        </div>

        {/* Closes the desktop line. On a phone the rule above, under Logout,
            already does it — and this one would double against it. */}
        <Rule />
      </Table>

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
          {/* The only filter that latches rather than stepping through values,
              so it keeps the hover ground while it is on. */}
          <button
            className="mina-profile__filter mina-profile__filter--liked"
            type="button"
            aria-pressed={isLikedOnly}
            data-tooltip={isLikedOnly ? 'Show all' : 'Liked only'}
            onClick={() => setIsLikedOnly(!isLikedOnly)}
          >
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
        {isPending &&
          Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <CreationSkeleton
              key={index}
              placement={layout === 'editorial' ? editorialPlacement(index) : undefined}
            />
          ))}

        {visible.map((generation, index) => (
          <CreationCard
            key={generation.mg_id}
            generation={generation}
            placement={layout === 'editorial' ? editorialPlacement(index) : undefined}
            isPanelOpen={panel === generation.mg_id}
            onTogglePanel={() =>
              setPanel((current) => (current === generation.mg_id ? null : generation.mg_id))
            }
            onOpen={() => setOpened(generation)}
            onDownload={() => saveMedia(generation)}
            onDelete={() => remove.mutate(generation.mg_id)}
          />
        ))}
      </div>

      {opened && (
        <CreationFullScreen
          generation={opened}
          onClose={() => setOpened(null)}
          onDownload={() => saveMedia(opened)}
          onCopyLink={() => copyLink.mutate(viewerLinkFor(opened))}
          onCopyMedia={() => copyMedia.mutate(opened.mg_output_url ?? '')}
          onNavigate={visible.length > 1 ? step : undefined}
        />
      )}

      {matchaPanel === 'buy' && (
        <MatchaPanel
          onClose={() => setMatchaPanel(null)}
          isAutoMatchaOn={isAutoMatchaOn}
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

      <AppFooter current="profile" mobileOnly />
    </div>
  )
}

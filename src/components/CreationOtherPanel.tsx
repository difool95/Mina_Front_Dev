import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useCopyLink,
  useLikeGeneration,
  useLikedGenerations,
  useUnlikeGeneration,
} from '@/hooks/useGenerations'
import { formatDateTime } from '@/lib/format'
import { detailsOf, promptOf, recreateOf, uploadsOf, viewerLinkFor } from '@/lib/generations'
import { cfImage, imageWidthFor } from '@/lib/media'
import { studioSession } from '@/lib/sessionStorage/studioSession'
import { withScene } from '@/lib/studio'
import { useAuth } from '@/providers/AuthProvider'
import type { StudioSession, UploadKind } from '@/types'
import type { MegaGeneration } from '@/types/generation.types'

import { Row, Rule, Table } from './builder/Table'

/** The studio actions the panel offers. Animate is not wired yet. */
const ACTIONS = ['Set scene', 'Animate', 'Re-create']

/** How long the share button says so after putting the link on the clipboard. */
const COPIED_MS = 1500

interface CreationOtherPanelProps {
  generation: MegaGeneration
  /** Owned by the archive, so opening one panel closes whichever was open. */
  isOpen: boolean
  onToggle: () => void
}

/**
 * The creation's caption, and everything behind it.
 *
 * Closed it is one line of the brief and a way in; open it is the settings the
 * creation was made with, the actions that can be taken on it, and the like.
 * It opens in place with no animation, because it pushes the cards below it
 * down and a moving gap is harder to read than one that is simply there.
 *
 * It takes the whole creation rather than a bag of props: everything on show
 * is derived from that row, so the card has nothing to unpack on its behalf.
 * Whether it is open is the exception — the archive holds that, so only one
 * panel can be open at a time.
 */
export function CreationOtherPanel({ generation, isOpen, onToggle }: CreationOtherPanelProps) {
  const [isCopied, setIsCopied] = useState(false)
  const copied = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(copied.current ?? undefined), [])

  const { session } = useAuth()
  const userId = session?.user.id

  const { data: liked } = useLikedGenerations(userId)
  const like = useLikeGeneration(userId)
  const unlike = useUnlikeGeneration(userId)
  const copyLink = useCopyLink()

  const generationId = generation.mg_generation_id ?? ''
  const isLiked = liked?.has(generationId) ?? false
  const details = detailsOf(generation)

  // The studio reads its settings from the studio session when it mounts.
  const navigate = useNavigate()
  const openStudio = (part: Partial<StudioSession>) => {
    studioSession.save(part)
    navigate('/')
  }
  const onAction: Record<string, () => void> = {
    // We get the generation url and put it as scene while saving it in studio Session
    'Set scene': () =>
      openStudio({ uploads: withScene(studioSession.read().uploads ?? [], generation.mg_output_url ?? '') }),
    // The brief, pictures, ratio and lane this creation was made with replace the studio's own.
    'Re-create': () => openStudio(recreateOf(generation)),
  }

  // The pictures it was made from, a pill to a cell: scene and logo share a row,
  // products have their own. A pill with nothing in it has no cell, and a row
  // with no cells is not drawn at all.
  const uploads = uploadsOf(generation)
  const picturesOf = (label: string, kind: UploadKind) => ({
    label,
    urls: uploads.filter((entry) => entry.kind === kind).map((entry) => entry.url),
  })
  //This variables has all the url's in each category (scene,Logo, product)
  const pictureRows = [
    [picturesOf('Scene', 'scene'), picturesOf('Logo & Designs', 'logo')],
    [picturesOf('Product and Elements', 'product')],
  ]
    .map((cells) => cells.filter(({ urls }) => urls.length))
    .filter((cells) => cells.length)

  const rows = [
    ['Mode', details.mode],
    ['Resolution', details.resolution],
    ['Ratio', details.ratio],
    ['Matcha', `${details.matchas} Matcha`],
    ['Created', formatDateTime(generation.mg_created_at)],
  ]

  return (
    <Table className="mina-other">
      <Row valign="top">
        <p className={`mina-other__prompt caption${isOpen ? ' mina-other__prompt--full' : ''}`}>
          {promptOf(generation)}
        </p>
        <button className="mina-other__toggle hyperlink-small" type="button" onClick={onToggle}>
          {isOpen ? 'less' : 'more'}
        </button>
      </Row>

      {isOpen && (
        <>
          <Rule />

          <Row>
            <span className="mina-other__label h6">Type</span>
            <span className="mina-other__value h6">{details.type}</span>
          </Row>

          <Rule />

          {/* The buttons are cells of this row, so they spread across it and
              carry to the next line whole rather than breaking their words. */}
          <Row>
            <span className="mina-other__label h6">Actions</span>
            {ACTIONS.map((action) => (
              <button
                className="mina-other__action button-small"
                type="button"
                key={action}
                onClick={onAction[action]}
              >
                {action}
              </button>
            ))}
          </Row>

          <Rule />

          {rows.map(([label, value]) => (
            <Row key={label}>
              <span className="mina-other__label h6">{label}</span>
              <span className="mina-other__value h6">{value}</span>
            </Row>
          ))}

          <Row>
            <span className="mina-other__label h6">Like</span>
            <button
              className={`mina-other__like button-small${isLiked ? ' mina-other__like--on' : ''}`}
              type="button"
              onClick={() => (isLiked ? unlike.mutate(generationId) : like.mutate(generation))}
            >
              {isLiked ? 'Dislike' : 'Like'}
              <span className={`mina-other__icon mina-other__icon--${isLiked ? 'liked' : 'like'}`} />
            </button>
          </Row>

          <Rule />

          {pictureRows.map((cells) => (
            <Fragment key={cells[0]!.label}>
              <Row>
                {cells.map(({ label, urls }) => (
                  <Fragment key={label}>
                    <span className="mina-other__label h6">{label}</span>
                    {/* The pictures are a way back to the setup they came from, as Re-create is. */}
                    <button
                      className="mina-other__pictures"
                      type="button"
                      aria-label="Re-create"
                      onClick={onAction['Re-create']}
                    >
                      {urls.map((url) => (
                        <img
                          className="mina-other__picture"
                          src={cfImage(url, imageWidthFor(34))}
                          alt=""
                          key={url}
                        />
                      ))}
                    </button>
                  </Fragment>
                ))}
              </Row>

              <Rule />
            </Fragment>
          ))}

          <Row>
            <span className="mina-other__label h6">Share</span>
            <button className="mina-other__action button-small" type="button">
              Prompt file
              <span className="mina-other__icon mina-other__icon--download" />
            </button>
            <button
              className="mina-other__action button-small"
              type="button"
              onClick={() =>
                copyLink.mutate(viewerLinkFor(generation), {
                  // Only says so once the clipboard has actually taken it.
                  onSuccess: () => {
                    setIsCopied(true)
                    copied.current = window.setTimeout(() => setIsCopied(false), COPIED_MS)
                  },
                })
              }
            >
              {isCopied ? 'Copied' : 'Copy link'}
              <span className="mina-other__icon mina-other__icon--link" />
            </button>
          </Row>
        </>
      )}
    </Table>
  )
}

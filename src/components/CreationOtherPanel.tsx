import { useState } from 'react'

import {
  useCopyLink,
  useLikeGeneration,
  useLikedGenerations,
  useUnlikeGeneration,
} from '@/hooks/useGenerations'
import { formatDateTime } from '@/lib/format'
import { detailsOf, promptOf, viewerLinkFor } from '@/lib/generations'
import { useAuth } from '@/providers/AuthProvider'
import type { MegaGeneration } from '@/types/generation.types'

import { Icon } from './Icon'

/** The studio actions the panel offers. None of them are wired to anything yet. */
const ACTIONS = ['Set scene', 'Animate', 'Re-create']

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
 */
export function CreationOtherPanel({ generation }: { generation: MegaGeneration }) {
  const [isOpen, setIsOpen] = useState(false)

  const { session } = useAuth()
  const userId = session?.user.id

  const { data: liked } = useLikedGenerations(userId)
  const like = useLikeGeneration(userId)
  const unlike = useUnlikeGeneration(userId)
  const copyLink = useCopyLink()

  const generationId = generation.mg_generation_id ?? ''
  const isLiked = liked?.has(generationId) ?? false
  const details = detailsOf(generation)

  const rows = [
    ['Mode', details.mode],
    ['Resolution', details.resolution],
    ['Ratio', details.ratio],
    ['Matcha', `${details.matchas} Matcha`],
    ['Created', formatDateTime(generation.mg_created_at)],
  ]

  return (
    <div className="mina-other">
      <div className="mina-other__head">
        <p className={`mina-other__prompt${isOpen ? ' mina-other__prompt--full' : ''}`}>
          {promptOf(generation)}
        </p>
        <button
          className="mina-other__toggle"
          type="button"
          onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        >
          {isOpen ? 'less' : 'more'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="mina-other__section mina-other__row">
            <span className="mina-other__label">Type</span>
            <span className="mina-other__value">{details.type}</span>
          </div>

          <div className="mina-other__section mina-other__row">
            <span className="mina-other__label">Actions</span>
            <span className="mina-other__buttons">
              {ACTIONS.map((action) => (
                <button className="mina-other__action" type="button" key={action}>
                  {action}
                </button>
              ))}
            </span>
          </div>

          <div className="mina-other__section">
            {rows.map(([label, value]) => (
              <div className="mina-other__row" key={label}>
                <span className="mina-other__label">{label}</span>
                <span className="mina-other__value">{value}</span>
              </div>
            ))}

            <div className="mina-other__row">
              <span className="mina-other__label">Like</span>
              <button
                className={`mina-other__like${isLiked ? ' mina-other__like--on' : ''}`}
                type="button"
                onClick={() => (isLiked ? unlike.mutate(generationId) : like.mutate(generation))}
              >
                {isLiked ? 'Dislike' : 'Like'}
                <Icon name="heart" size={13} isFilled={isLiked} />
              </button>
            </div>
          </div>

          <div className="mina-other__section mina-other__row">
            <span className="mina-other__label">Share</span>
            <span className="mina-other__buttons">
              <button className="mina-other__action" type="button">
                Prompt file
                <Icon name="download" size={12} />
              </button>
              <button
                className="mina-other__action"
                type="button"
                onClick={() => copyLink.mutate(viewerLinkFor(generation))}
              >
                Copy link
                <Icon name="link" size={12} />
              </button>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

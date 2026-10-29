import { useEffect, useRef, useState } from 'react'

import { useDeleteBrandMemory, useUpdateBrandMemory } from '@/hooks/useBrandMemories'
import { useDeleteStudioImage, useUploadStudioImage } from '@/hooks/useStudioUploads'
import {
  BRAND_MEMORY_CATEGORIES,
  BRAND_MEMORY_MAX_IMAGES,
  BRANDING_ASSETS_PANEL,
  withImages,
} from '@/lib/brandMemory'
import { prepareStudioImage } from '@/lib/media'
import { useAuth } from '@/providers/AuthProvider'
import type { BrandMemory, BrandMemoryVars } from '@/types'

import { AssetTiles } from '../builder/AssetTiles'
import { Row, Table } from '../builder/Table'

import './BrandingAssetsPanel.css'

/**
 * One brand memory, open for editing.
 *
 * Its pictures and the Mina vision switch save the moment they change: a "+"
 * adds pictures up to five, a click on one removes it (all but the last). The
 * category, name and description are drafts until Save, which only wakes once
 * one of them differs. Delete takes the memory and its pictures for good.
 *
 * A native `<dialog>` like the Matcha panel, closed by its × and nothing else.
 */
export function BrandingAssetsPanel({ memory, onClose }: { memory: BrandMemory; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { session } = useAuth()
  const userId = session?.user.id
  const vars = memory.mg_mma_vars
  const [draft, setDraft] = useState({ category: vars.category, name: vars.name, description: vars.description })
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  //This hook is called to upload a new picture under the same Branding Asset Panel
  const uploadImage = useUploadStudioImage()
  //This hook is called to delete a picture from the Branding Asset Panel
  const deleteImage = useDeleteStudioImage()
  //This hook is called for update/delete a brand memory
  const updateMemory = useUpdateBrandMemory(userId)
  //This hook is called to delete a brand memory from the database
  const deleteMemory = useDeleteBrandMemory(userId)


  // Save only wakes up once the user changed something: the category, name or description in the draft differs from the saved memory.
  const isCategoryChanged = draft.category !== vars.category
  const isNameChanged = draft.name !== vars.name
  const isDescriptionChanged = draft.description !== vars.description
  const hasUnsavedChanges = isCategoryChanged || isNameChanged || isDescriptionChanged

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const save = (next: BrandMemoryVars) => updateMemory.mutate({ mgId: memory.mg_id, vars: next })

  const addPicturesUnderSameAssetPanel = async (files: File[]) => {
    if (!session) return

    const shown: string[] = []
    try {
      const images = await Promise.all(
        files.slice(0, BRAND_MEMORY_MAX_IMAGES - vars.images.length).map(prepareStudioImage),
      )
      shown.push(...images.map((image) => URL.createObjectURL(image)))
      //Once we add a new picture it shows in the preview of the Panel
      setPreviews(shown)
      //we uploaded all the pictures that we added in the list of the panel
      const uploaded = await Promise.all(
        images.map((image) => uploadImage.mutateAsync({ token: session.access_token, image })),
      )
      await updateMemory.mutateAsync({
        mgId: memory.mg_id,
        vars: withImages(vars, [...vars.images, ...uploaded.map(({ url }) => url)]),
      })
    } catch {
      // As on the profile strip, a failed picture just leaves.
    } finally {
      setPreviews([])
      shown.forEach((url) => URL.revokeObjectURL(url))
    }
  }

  const removePicture = (url: string) => {
    // Deleting the file from R2 needs the user's token, so nothing happens signed out.
    if (!session) return

    // Every picture of this memory except the one that was clicked.
    const remainingImages = vars.images.filter((image) => image !== url)

    // The memory's vars rebuilt around those pictures: images, source_urls,
    // thumb_url and asset_items all follow the new list.
    const nextVars = withImages(vars, remainingImages)

    // Step 1: save the memory without that picture in the database.
    updateMemory.mutate(
      { mgId: memory.mg_id, vars: nextVars },
      {
        // Step 2: only once the save worked, delete the picture file from R2.
        // If the save failed, the memory still points at the file, so it stays.
        onSuccess: () => {
          deleteImage.mutate({ token: session.access_token, url })
        },
      },
    )
  }

  return (
    <dialog
      className="mina-assets"
      ref={ref}
      onCancel={(event) => event.preventDefault()}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <Table className="mina-assets__table">
        <Row className="mina-assets__lead">
          <h2 className="mina-assets__title h3">{BRANDING_ASSETS_PANEL.title}</h2>
          <button className="mina-assets__close button" type="button" aria-label="Close" onClick={onClose}>
            <span className="mina-assets__close-icon" aria-hidden="true" />
          </button>
        </Row>
        <Row>
          <p className="mina-assets__subtitle paragraph-title muted">{BRANDING_ASSETS_PANEL.subtitle}</p>
        </Row>

        <AssetTiles
          size={92}
          onAdd={vars.images.length + previews.length < BRAND_MEMORY_MAX_IMAGES ? addPicturesUnderSameAssetPanel : undefined}
          tiles={[
            ...vars.images.map((url, index) => ({
              url,
              action: 'Remove picture',
              badge: index === 0 ? 'COVER' : undefined,
              // The last picture can't be removed, so it doesn't offer to.
              hover: vars.images.length > 1 ? 'Remove' : undefined,
              onClick: () => vars.images.length > 1 && removePicture(url),
            })),
            ...previews.map((url) => ({ url, action: 'Uploading', isUploading: true, onClick: () => {} })),
          ]}
        />

        <Row anchor="left" className="mina-assets__category">
          <button
            className="paragraph-title-button bold button"
            type="button"
            aria-expanded={isCategoryOpen}
            onClick={() => setIsCategoryOpen((wasOpen) => !wasOpen)}
          >
            {BRAND_MEMORY_CATEGORIES.find((entry) => entry.category === draft.category)?.label} ·
          </button>
          {isCategoryOpen && (
            <ul className="mina-assets__categories">
              {BRAND_MEMORY_CATEGORIES.map(({ category, label }) => (
                <li key={category}>
                  <button
                    className="mina-assets__choice paragraph-title button"
                    type="button"
                    aria-pressed={category === draft.category}
                    onClick={() => {
                      setDraft((was) => ({ ...was, category }))
                      setIsCategoryOpen(false)
                    }}
                  >
                    {label}
                    {category === draft.category && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Row>

        <input
          className="mina-assets__name h3 placeholder-faint"
          value={draft.name}
          placeholder="Name"
          onChange={(event) => setDraft((was) => ({ ...was, name: event.target.value }))}
        />
        <textarea
          className="mina-assets__description paragraph-title placeholder-faint"
          rows={5}
          value={draft.description}
          placeholder="Description"
          onChange={(event) => setDraft((was) => ({ ...was, description: event.target.value }))}
        />

        <Row anchor="left">
          <span className="paragraph-title">{BRANDING_ASSETS_PANEL.vision}</span>
          <button
            className="paragraph-title-button bold button"
            type="button"
            aria-pressed={vars.memory_enabled}
            onClick={() => save({ ...vars, memory_enabled: !vars.memory_enabled })}
          >
            {vars.memory_enabled ? 'On' : 'Off'}
          </button>
        </Row>

        <Row className="mina-assets__foot" valign="bottom">
          <button
            className="mina-assets__delete body-text-button button"
            type="button"
            disabled={deleteMemory.isPending}
            onClick={() =>
              session && deleteMemory.mutate({ token: session.access_token, memory }, { onSuccess: onClose })
            }
          >
            {deleteMemory.isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button
            className="mina-assets__save h3 underline button"
            type="button"
            disabled={!hasUnsavedChanges || updateMemory.isPending}
            onClick={() => save({ ...vars, ...draft })}
          >
            Save
          </button>
        </Row>
      </Table>
    </dialog>
  )
}

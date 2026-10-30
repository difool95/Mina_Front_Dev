import { Fragment, useRef, useState } from 'react'

import {
  useBrandMemories,
  useCreateBrandMemory,
  useDeleteBrandMemories,
  useUpdateBrandMemory,
} from '@/hooks/useBrandMemories'
import { useUploadStudioImage } from '@/hooks/useStudioUploads'
import { BRAND_MEMORY_DROP_HINT, BRAND_MEMORY_MAX, BRAND_MEMORY_TILE_TOOLTIP } from '@/lib/brandMemory'
import { pendingFromDrop, pendingFromFiles } from '@/lib/brandMemoryImport'
import { prepareStudioImage } from '@/lib/media'
import { useAuth } from '@/providers/AuthProvider'
import type { PendingBrandMemory } from '@/types'

import { AssetTiles } from '../builder/AssetTiles'
import { Row, Rule, Table } from '../builder/Table'
import { BrandingAssetsPanel } from './BrandingAssetsPanel'

import './BrandMemoryBar.css'

/**
 * The profile's brand memories, one tile each, on a line that scrolls sideways.
 *
 * Each picture added from the "+" becomes a memory of its own: it is prepared
 * and put on R2 the way a studio picture is, then the API scans it. Its local
 * preview flashes until the memory is in the list, and simply leaves if any of
 * that fails. A tile opens its memory in the Branding Assets panel.
 *
 * Pictures and folders can also be dragged onto the strip. A folder's own
 * pictures make memories of up to five each, and its subfolders are read the
 * same way (lib/brandMemoryImport). Dropped memories, like several pictures
 * picked at once from the "+", aren't uploaded straight away: they wait in a
 * list under the strip, where any can be taken out, until "Add" uploads them
 * the way a single picture from the "+" is.
 *
 * Holding a memory down starts selecting, with that memory picked: the "+"
 * turns into a red "×" that stops it, a click picks or unpicks a memory, and
 * the row under the strip selects all and deletes the picked ones together.
 *
 * Dragging a memory onto another and letting go puts it in that one's place.
 */
export function BrandMemoryBar() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { data: memories = [] } = useBrandMemories(userId)
  const uploadImage = useUploadStudioImage()
  const createMemory = useCreateBrandMemory(userId)
  const [previews, setPreviews] = useState<string[]>([])
  // The highest sort_order handed to an upload so far.
  const lastSortOrder = useRef(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const openMemory = memories.find((memory) => memory.mg_id === openId)
  // True while pictures are dragged over the strip.
  const [isDragging, setIsDragging] = useState(false)
  // Memories dropped, or picked several at once from the "+", waiting for "Add" or "Cancel".
  const [pending, setPending] = useState<PendingBrandMemory[]>([])
  // The picked memories' ids while selecting; null when not selecting.
  const [selected, setSelected] = useState<string[] | null>(null)
  const isSelecting = selected !== null
  const isAllSelected = memories.length > 0 && selected?.length === memories.length
  const deleteMemories = useDeleteBrandMemories(userId)
  const updateMemory = useUpdateBrandMemory(userId)

  // Puts the dragged memory in the target's place. Only its sort_order changes: halfway between its new neighbours, or one past the end it lands on
  // (the left end holds the highest).
  const moveMemory = (mgId: string, targetId: string) => {
    const memory = memories.find((entry) => entry.mg_id === mgId)!
    const list = memories.filter((entry) => entry !== memory)
    list.splice(memories.findIndex((entry) => entry.mg_id === targetId), 0, memory)

    const at = list.indexOf(memory)
    const left = list[at - 1]?.mg_mma_vars.sort_order
    const right = list[at + 1]?.mg_mma_vars.sort_order
    const sortOrder = left === undefined ? right! + 1 : right === undefined ? left - 1 : (left + right) / 2

    updateMemory.mutate({ mgId, vars: { ...memory.mg_mma_vars, sort_order: sortOrder } })
  }

  // Picks the memory, or unpicks it if it already was.
  const toggleSelected = (mgId: string) => {
    setSelected((previousList) => {
      // Not selecting yet: start from an empty list.
      const list = previousList ?? []

      const isAlreadySelected = list.includes(mgId)

      if (isAlreadySelected) {
        // Unpick: keep every id except this one.
        return list.filter((id) => id !== mgId)
      }

      // Pick: the same list with this id added at the end.
      return [...list, mgId]
    })
  }

  // Deletes every picked memory in one go, then leaves select mode, even if some failed.
  const deleteSelected = () => {
    if (!session || !selected) return

    // The full memories behind the picked ids: the delete needs each one's pictures too.
    const pickedMemories = memories.filter((memory) => selected.includes(memory.mg_id))

    deleteMemories.mutate(
      { token: session.access_token, memories: pickedMemories },
      { onSettled: () => setSelected(null) },
    )
  }

  // One memory with all its pictures; its cover's preview stands for it while it uploads.
  const add = async (memory: PendingBrandMemory, sortOrder: number) => {
    if (!session) return

    let preview = ''
    try {
      const images = await Promise.all(memory.files.map(prepareStudioImage))
      preview = URL.createObjectURL(images[0])
      setPreviews((list) => [...list, preview])
      const uploaded = await Promise.all(
        images.map((image) => uploadImage.mutateAsync({ token: session.access_token, image })),
      )
      // Resolves once the list has refetched, so the memory takes the preview's place without a gap.
      await createMemory.mutateAsync({
        token: session.access_token,
        urls: uploaded.map(({ url }) => url),
        sortOrder,
      })
    } catch {
      // Nothing is said: the preview leaves and no memory is added.
    } finally {
      setPreviews((list) => list.filter((entry) => entry !== preview))
      if (preview) URL.revokeObjectURL(preview)
    }
  }

  // Uploads the memories; a batch past the cap keeps only what still fits.
  // Each is numbered above the current top before any upload starts, the first
  // listed highest so it leads the bar. The list only knows a number once its
  // memory is saved, so the last one handed out counts too: a second batch
  // started while the first still uploads goes above it rather than onto it.
  const addMemories = (list: PendingBrandMemory[]) => {
    const room = BRAND_MEMORY_MAX - memories.length - previews.length
    const kept = list.slice(0, room)
    const top = Math.max(memories[0]?.mg_mma_vars.sort_order ?? 0, lastSortOrder.current)
    lastSortOrder.current = top + kept.length
    kept.forEach((memory, index) => void add(memory, top + kept.length - index))
  }

  const addPending = () => {
    addMemories(pending)
    setPending([])
  }

  // One picture from the "+" goes straight up; several wait in the list, the same as a drop.
  const pickFiles = (files: File[]) => {
    const picked = pendingFromFiles(files)
    if (picked.length > 1) setPending((list) => [...list, ...picked])
    else addMemories(picked)
  }

  return (
    <section className="mina-brand-memory-bar">
      <div
        className="mina-brand-memory-bar__drop"
        data-dragging={isDragging || undefined}
        onDragOver={(event) => {
          // Without this the browser refuses the drop and opens the picture instead.
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          // Moving over a tile inside the strip fires a leave too; only leaving the strip counts.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void pendingFromDrop(event.dataTransfer).then((dropped) => setPending((list) => [...list, ...dropped]))
        }}
      >
        <AssetTiles
          size={48}
          isScroll
          isAddFirst
          // At the cap the "+" goes away; while selecting, it is the "×" that stops it.
          onAdd={memories.length + previews.length < BRAND_MEMORY_MAX ? pickFiles : undefined}
          onCancel={isSelecting ? () => setSelected(null) : undefined}
          onReorder={moveMemory}
          // Uploading ones first, where their memories will land: the newest leads the bar.
          tiles={[
            ...previews.map((url) => ({ url, action: 'Uploading', label: '', isUploading: true, onClick: () => {} })),
            ...memories.map((memory) => ({
              url: memory.mg_mma_vars.thumb_url,
              action: `Open ${memory.mg_prompt}`,
              label: memory.mg_prompt,
              // While selecting, a click picks instead of opening, so the tooltip would mislead.
              tooltip: isSelecting ? undefined : BRAND_MEMORY_TILE_TOOLTIP,
              isSelected: selected?.includes(memory.mg_id),
              onLongPress: isSelecting ? undefined : () => setSelected([memory.mg_id]),
              dragId: isSelecting ? undefined : memory.mg_id,
              onClick: () => (isSelecting ? toggleSelected(memory.mg_id) : setOpenId(memory.mg_id)),
            })),
          ]}
        />
        {isDragging && <p className="mina-brand-memory-bar__hint body-text">{BRAND_MEMORY_DROP_HINT}</p>}
      </div>
      <Rule />

      {selected && (
        <>
          <Table className="mina-brand-memory-bar__select">
            <Row anchor="left">
              <span className="body-text-button">{selected.length} selected</span>
            </Row>
            <Row anchor="left">
              <button
                className="body-text muted button"
                type="button"
                onClick={() => setSelected(isAllSelected ? [] : memories.map((memory) => memory.mg_id))}
              >
                {isAllSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button
                className="mina-brand-memory-bar__delete body-text-button underline button"
                type="button"
                disabled={selected.length === 0 || deleteMemories.isPending}
                onClick={deleteSelected}
              >
                {deleteMemories.isPending ? 'Deleting...' : `Delete ${selected.length}`}
              </button>
            </Row>
          </Table>
          <Rule />
        </>
      )}

      {pending.length > 0 && (
        <Table className="mina-brand-memory-bar__pending">
          <div className="mina-brand-memory-bar__files">
            {pending.map((memory, index) => (
              <Fragment key={`${index}-${memory.name}`}>
                <Row className="mina-brand-memory-bar__file">
                  <span className="paragraph-title">{memory.name}</span>
                  <span className="body-text muted">
                    {memory.files.length} {memory.files.length === 1 ? 'image' : 'images'}
                  </span>
                  <button
                    className="mina-brand-memory-bar__remove button"
                    type="button"
                    aria-label={`Remove ${memory.name}`}
                    onClick={() => setPending((list) => list.filter((_, at) => at !== index))}
                  >
                    <span className="mina-brand-memory-bar__remove-icon" aria-hidden="true" />
                  </button>
                </Row>
                <Rule />
              </Fragment>
            ))}
          </div>
          <Row>
            <button className="paragraph-title underline button" type="button" onClick={addPending}>
              Add {pending.length} {pending.length === 1 ? 'asset' : 'assets'}
            </button>
            <button className="body-text muted button" type="button" onClick={() => setPending([])}>
              Cancel
            </button>
          </Row>
          <Rule />
        </Table>
      )}

      {openMemory && <BrandingAssetsPanel memory={openMemory} onClose={() => setOpenId(null)} />}
    </section>
  )
}

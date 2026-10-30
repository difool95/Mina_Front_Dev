import { Fragment, useState } from 'react'

import { useBrandMemories, useCreateBrandMemory } from '@/hooks/useBrandMemories'
import { useUploadStudioImage } from '@/hooks/useStudioUploads'
import { BRAND_MEMORY_DROP_HINT, BRAND_MEMORY_MAX } from '@/lib/brandMemory'
import { prepareStudioImage } from '@/lib/media'
import { useAuth } from '@/providers/AuthProvider'

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
 * Pictures can also be dragged onto the strip. Dropped ones aren't uploaded
 * straight away: they wait in a list under the strip, where any can be taken
 * out, until "Add" sends them through the same path as the "+".
 */
export function BrandMemoryBar() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { data: memories = [] } = useBrandMemories(userId)
  const uploadImage = useUploadStudioImage()
  const createMemory = useCreateBrandMemory(userId)
  const [previews, setPreviews] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const openMemory = memories.find((memory) => memory.mg_id === openId)
  // True while pictures are dragged over the strip.
  const [isDragging, setIsDragging] = useState(false)
  // The dropped pictures, waiting for "Add" or "Cancel".
  const [dropped, setDropped] = useState<File[]>([])

  const add = async (file: File) => {
    if (!session) return

    let preview = ''
    try {
      const image = await prepareStudioImage(file)
      preview = URL.createObjectURL(image)
      setPreviews((list) => [...list, preview])
      const { url } = await uploadImage.mutateAsync({ token: session.access_token, image })
      // Resolves once the list has refetched, so the memory takes the preview's place without a gap.
      await createMemory.mutateAsync({ token: session.access_token, url })
    } catch {
      // Nothing is said: the preview leaves and no memory is added.
    } finally {
      setPreviews((list) => list.filter((entry) => entry !== preview))
      if (preview) URL.revokeObjectURL(preview)
    }
  }

  // Shared by the "+" and the dropped list's "Add": a batch past the cap keeps only what still fits.
  const addFiles = (files: File[]) => {
    const room = BRAND_MEMORY_MAX - memories.length - previews.length
    files.slice(0, room).forEach((file) => void add(file))
  }

  const addDropped = () => {
    addFiles(dropped)
    setDropped([])
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
          const images = [...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'))
          setDropped((list) => [...list, ...images])
        }}
      >
        <AssetTiles
          size={48}
          isScroll
          isAddFirst
          // At the cap the "+" goes away.
          onAdd={memories.length + previews.length < BRAND_MEMORY_MAX ? addFiles : undefined}
          tiles={[
            ...memories.map((memory) => ({
              url: memory.mg_mma_vars.thumb_url,
              action: `Open ${memory.mg_prompt}`,
              label: memory.mg_prompt,
              onClick: () => setOpenId(memory.mg_id),
            })),
            ...previews.map((url) => ({ url, action: 'Uploading', label: '', isUploading: true, onClick: () => {} })),
          ]}
        />
        {isDragging && <p className="mina-brand-memory-bar__hint body-text">{BRAND_MEMORY_DROP_HINT}</p>}
      </div>
      <Rule />

      {dropped.length > 0 && (
        <Table className="mina-brand-memory-bar__dropped">
          {dropped.map((file, index) => (
            <Fragment key={`${index}-${file.name}`}>
              <Row className="mina-brand-memory-bar__file">
                {/* The file's name without its extension. */}
                <span className="paragraph-title">{file.name.replace(/\.[^.]+$/, '')}</span>
                <span className="body-text muted">1 image</span>
                <button
                  className="mina-brand-memory-bar__remove button"
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setDropped((list) => list.filter((_, at) => at !== index))}
                >
                  <span className="mina-brand-memory-bar__remove-icon" aria-hidden="true" />
                </button>
              </Row>
              <Rule />
            </Fragment>
          ))}
          <Row>
            <button className="paragraph-title underline button" type="button" onClick={addDropped}>
              Add {dropped.length} {dropped.length === 1 ? 'asset' : 'assets'}
            </button>
            <button className="body-text muted button" type="button" onClick={() => setDropped([])}>
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

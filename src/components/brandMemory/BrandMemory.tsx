import { useState } from 'react'

import { useBrandMemories, useCreateBrandMemory } from '@/hooks/useBrandMemories'
import { useUploadStudioImage } from '@/hooks/useStudioUploads'
import { BRAND_MEMORY_MAX } from '@/lib/brandMemory'
import { prepareStudioImage } from '@/lib/media'
import { useAuth } from '@/providers/AuthProvider'

import { AssetTiles } from '../builder/AssetTiles'
import { Rule } from '../builder/Table'
import { BrandingAssetsPanel } from './BrandingAssetsPanel'

import './BrandMemory.css'

/**
 * The profile's brand memories, one tile each, on a line that scrolls sideways.
 *
 * Each picture added from the "+" becomes a memory of its own: it is prepared
 * and put on R2 the way a studio picture is, then the API scans it. Its local
 * preview flashes until the memory is in the list, and simply leaves if any of
 * that fails. A tile opens its memory in the Branding Assets panel.
 */
export function BrandMemory() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { data: memories = [] } = useBrandMemories(userId)
  const uploadImage = useUploadStudioImage()
  const createMemory = useCreateBrandMemory(userId)
  const [previews, setPreviews] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const openMemory = memories.find((memory) => memory.mg_id === openId)

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

  return (
    <section className="mina-brand-memory">
      <AssetTiles
        size={48}
        isScroll
        isAddFirst
        // At the cap the "+" goes away, and a pick past it keeps only what still fits.
        onAdd={
          memories.length + previews.length < BRAND_MEMORY_MAX
            ? (files) =>
                files.slice(0, BRAND_MEMORY_MAX - memories.length - previews.length).forEach((file) => void add(file))
            : undefined
        }
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
      <Rule />

      {openMemory && <BrandingAssetsPanel memory={openMemory} onClose={() => setOpenId(null)} />}
    </section>
  )
}

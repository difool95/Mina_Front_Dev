import type { MegaGeneration } from '@/types/generation.types'

import { supabase } from './supabase.client'

/** The columns the archive renders. `mega_generations` holds far more. */
const COLUMNS =
  'mg_id, mg_record_type, mg_pass_id, mg_generation_id, mg_mma_mode, mg_mma_status, mg_status, mg_mma_vars, mg_prompt, mg_output_url, mg_meta, mg_created_at, mg_updated_at, mg_session_id, mg_platform, mg_title, mg_type, mg_cost_data'

/**
 * Everything this user has made, newest first.
 *
 * `mega_generations` is the platform's whole event log, so the record type has
 * to be pinned as well as the owner — without it this returns their credit
 * transactions and sessions too.
 */
export async function getGenerations(userId: string) {
  const { data, error } = await supabase
    .from('mega_generations')
    .select(COLUMNS)
    .eq('mg_pass_id', `pass:user:${userId}`)
    .eq('mg_record_type', 'generation')
    .order('mg_created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as MegaGeneration[]
}

export async function deleteGeneration(mgId: string) {
  const { error } = await supabase.from('mega_generations').delete().eq('mg_id', mgId)

  if (error) throw new Error(error.message)
}

export async function copyLink(link: string) {
  await navigator.clipboard.writeText(link)
}

/** Repaints a blob as a PNG, the one image type clipboards reliably accept. */
async function toPng(blob: Blob) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')

  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (png) => (png ? resolve(png) : reject(new Error('Could not encode the image'))),
      'image/png',
    )
  })
}

/**
 * Puts the creation itself on the clipboard, ready to paste into anything that
 * takes an image.
 *
 * Images only: no browser will hold a video on the clipboard, so a motion
 * creation throws here and the link is the thing to share instead.
 */
export async function copyMediaToClipboard(url: string) {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`Could not read the file (${response.status})`)

  const blob = await response.blob()

  if (!blob.type.startsWith('image/')) throw new Error(`Cannot copy ${blob.type} to the clipboard`)

  const png = blob.type === 'image/png' ? blob : await toPng(blob)

  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
}

/**
 * Saves a creation to disk.
 *
 * Fetched into a blob rather than pointed at with `<a download>`: the media
 * sits on another origin, where that attribute is ignored and the browser
 * navigates to the file instead of saving it.
 */
export async function downloadMedia(url: string, filename: string) {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`Could not download the file (${response.status})`)

  const objectUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename

  // Firefox ignores a click on an anchor that is not in the document.
  document.body.append(link)
  link.click()
  link.remove()

  // Released a tick later: revoking it in the same frame as the click can pull
  // the blob out from under a download that has not started reading it yet.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

import { unzip, type Unzipped } from 'fflate'

import { BRAND_MEMORY_MAX_IMAGES } from '@/lib/brandMemory'
import type { PendingBrandMemory } from '@/types'

// Turns what the user brings to the Brand Memory bar into the memories it
// would make, listed under the bar until "Add".

const isImage = (file: File) => file.type.startsWith('image/')

// As a file explorer orders names: "assets 2" before "assets 10".
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

// A zip holds bytes, not typed files, so a picture's type comes from its extension.
const ZIP_IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

const zipImageType = (path: string) => ZIP_IMAGE_TYPES[path.split('.').pop()!.toLowerCase()]

// A folder's pictures, BRAND_MEMORY_MAX_IMAGES per memory: "assets5" holds the
// first five, "assets5 2" the next ones, and so on.
function folderMemories(name: string, images: PendingBrandMemory['files']): PendingBrandMemory[] {
  const memories: PendingBrandMemory[] = []

  for (let start = 0; start < images.length; start += BRAND_MEMORY_MAX_IMAGES) {
    const number = start / BRAND_MEMORY_MAX_IMAGES + 1
    memories.push({
      name: number === 1 ? name : `${name} ${number}`,
      files: images.slice(start, start + BRAND_MEMORY_MAX_IMAGES),
    })
  }

  return memories
}

// Everything directly inside a folder, by name as a file explorer lists it.
// The browser hands entries over in batches, so it reads until one comes back empty.
async function folderEntries(folder: FileSystemDirectoryEntry) {
  const reader = folder.createReader()
  const entries: FileSystemEntry[] = []

  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
    if (batch.length === 0) break
    entries.push(...batch)
  }

  return entries.sort((a, b) => byName(a.name, b.name))
}

const entryFile = (entry: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject))

// The pictures directly in the folder make its memories; each subfolder is read
// the same way, after them. A folder with no picture of its own makes none, and
// anything that isn't a picture is left out.
async function readFolder(folder: FileSystemDirectoryEntry): Promise<PendingBrandMemory[]> {
  const entries = await folderEntries(folder)

  const files = await Promise.all(
    entries.filter((entry): entry is FileSystemFileEntry => entry.isFile).map(entryFile),
  )
  const subfolders = await Promise.all(
    entries.filter((entry): entry is FileSystemDirectoryEntry => entry.isDirectory).map(readFolder),
  )

  return [...folderMemories(folder.name, files.filter(isImage)), ...subfolders.flat()]
}

// A zip read like a dropped folder of its own name: the pictures at its root
// make that folder's memories, and every folder inside it makes its own from
// the pictures directly in it. Only pictures are unpacked, and the copies
// macOS tucks under __MACOSX/ are left out.
async function readZip(zip: File): Promise<PendingBrandMemory[]> {
  const bytes = new Uint8Array(await zip.arrayBuffer())
  const unzipped = await new Promise<Unzipped>((resolve, reject) =>
    unzip(
      bytes,
      { filter: (file) => Boolean(zipImageType(file.name)) && !file.name.startsWith('__MACOSX/') },
      (error, data) => (error ? reject(error) : resolve(data)),
    ),
  )

  // Each folder's path inside the zip, with the pictures directly in it.
  const folders = new Map<string, File[]>()
  for (const [path, data] of Object.entries(unzipped)) {
    const parts = [zip.name.replace(/\.zip$/i, ''), ...path.split('/')]
    const fileName = parts.pop()!
    const folderPath = parts.join('/')
    const picture = new File([data], fileName, { type: zipImageType(fileName) })
    folders.set(folderPath, [...(folders.get(folderPath) ?? []), picture])
  }

  // A folder comes before the folders inside it, as when reading a dropped one.
  return [...folders.keys()]
    .sort(byName)
    .flatMap((folderPath) =>
      folderMemories(
        folderPath.split('/').pop()!,
        folders.get(folderPath)!.sort((a, b) => byName(a.name, b.name)),
      ),
    )
}

// A CSV's rows and fields. A quoted field can hold commas, line breaks and
// doubled quotes, which a product description often does.
function csvRows(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let isQuoted = false

  for (let at = 0; at < text.length; at++) {
    const char = text.charAt(at)
    if (isQuoted) {
      if (char === '"' && text.charAt(at + 1) === '"') {
        field += '"'
        at++
      } else if (char === '"') isQuoted = false
      else field += char
    } else if (char === '"') isQuoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      rows.push([...row, field])
      row = []
      field = ''
    } else if (char !== '\r') field += char
  }
  if (field || row.length > 0) rows.push([...row, field])

  return rows
}

// A product export as Shopify writes it: one row per picture, the rows of a
// product sharing its handle and only the first carrying its title. Each
// product is read like a folder named after its title, its pictures in their
// "Image position" order; one without pictures makes none. Columns are found by
// name, current or older, since stores export them in different sets and orders.
async function readCsv(csv: File): Promise<PendingBrandMemory[]> {
  const [header = [], ...rows] = csvRows((await csv.text()).replace(/^﻿/, ''))
  const names = header.map((name) => name.trim().toLowerCase())
  const column = (...candidates: string[]) => names.findIndex((name) => candidates.includes(name))
  const handleAt = column('url handle', 'handle')
  const titleAt = column('title')
  const imageAt = column('product image url', 'image src')
  const positionAt = column('image position')

  const titles = new Map<string, string>()
  const products = new Map<string, { url: string; position: number }[]>()
  for (const row of rows) {
    const handle = row[handleAt]
    if (!handle) continue

    const title = row[titleAt]
    if (title && !titles.has(handle)) titles.set(handle, title)

    const images = products.get(handle) ?? []
    products.set(handle, images)
    const url = row[imageAt]
    if (url) images.push({ url, position: Number(row[positionAt]) || images.length + 1 })
  }

  return [...products].flatMap(([handle, images]) =>
    folderMemories(
      titles.get(handle) ?? handle,
      images.sort((a, b) => a.position - b.position).map(({ url }) => url),
    ),
  )
}

/**
 * A file picked from the "+" or dropped: a zip or a CSV read as above, a
 * picture as a memory of its own named after the file, anything else nothing.
 */
export async function pendingFromFile(file: File): Promise<PendingBrandMemory[]> {
  if (/\.zip$/i.test(file.name)) return readZip(file)
  if (/\.csv$/i.test(file.name)) return readCsv(file)
  return isImage(file) ? [{ name: file.name.replace(/\.[^.]+$/, ''), files: [file] }] : []
}

/**
 * What was dropped on the bar: a loose picture is a memory of its own, and a
 * folder, a zip or a CSV is read inside out as above.
 */
export async function pendingFromDrop(dataTransfer: DataTransfer): Promise<PendingBrandMemory[]> {
  // The browser only gives the entries while the drop event runs, so they are
  // taken before anything is awaited.
  const entries = [...dataTransfer.items]
    .map((item) => item.webkitGetAsEntry())
    .filter((entry) => entry !== null)

  const memories = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) return readFolder(entry as FileSystemDirectoryEntry)

      return pendingFromFile(await entryFile(entry as FileSystemFileEntry))
    }),
  )

  return memories.flat()
}

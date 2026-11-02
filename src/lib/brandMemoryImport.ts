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

/** Each picture as a memory of its own, named after its file without the extension. */
export function pendingFromFiles(files: File[]): PendingBrandMemory[] {
  return files.filter(isImage).map((file) => ({ name: file.name.replace(/\.[^.]+$/, ''), files: [file] }))
}

// A folder's pictures, BRAND_MEMORY_MAX_IMAGES per memory: "assets5" holds the
// first five, "assets5 2" the next ones, and so on.
function folderMemories(name: string, images: File[]): PendingBrandMemory[] {
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

/**
 * What was dropped on the bar: a loose picture is a memory of its own, and a
 * folder or a zip is read inside out as above.
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

      const file = await entryFile(entry as FileSystemFileEntry)
      return /\.zip$/i.test(file.name) ? readZip(file) : pendingFromFiles([file])
    }),
  )

  return memories.flat()
}

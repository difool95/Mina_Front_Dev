import { BRAND_MEMORY_MAX_IMAGES } from '@/lib/brandMemory'
import type { PendingBrandMemory } from '@/types'

// Turns what the user brings to the Brand Memory bar into the memories it
// would make, listed under the bar until "Add".

const isImage = (file: File) => file.type.startsWith('image/')

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

  return entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
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

/**
 * What was dropped on the bar: a loose picture is a memory of its own, and a
 * folder is read inside out as above.
 */
export async function pendingFromDrop(dataTransfer: DataTransfer): Promise<PendingBrandMemory[]> {
  // The browser only gives the entries while the drop event runs, so they are
  // taken before anything is awaited.
  const entries = [...dataTransfer.items]
    .map((item) => item.webkitGetAsEntry())
    .filter((entry) => entry !== null)

  const memories = await Promise.all(
    entries.map(async (entry) =>
      entry.isDirectory
        ? readFolder(entry as FileSystemDirectoryEntry)
        : pendingFromFiles([await entryFile(entry as FileSystemFileEntry)]),
    ),
  )

  return memories.flat()
}

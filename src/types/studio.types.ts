export type StudioMode = 'create' | 'animate'

//** The kind of upload, which determines which library it can be picked from. */
export type UploadKind = 'scene' | 'logo' | 'product'

///** One picture added under a "+" pill, in the order it was added. */
/** What the prompt block can ask of its brief through `ref`. */
export interface MinaBlockUserBriefHandle {
  /**
   * Puts `text` in the locked strip, as if it had been selected and locked.
   * One lock at a time: anything already locked goes back into the brief.
   */
  lockText: (text: string) => void
}

export interface MinaBlockHandle extends MinaBlockUserBriefHandle {
 // The long animation that brings in the full block, or the simple one once it has opened.
  animate: () => void
 // This is the same as the "+ Scene" pill in the right panel: it opens the file picker and adds the chosen picture to the uploads of the scene.
  OpenFilePickerScene: () => void
}

///** One picture added under a "+" pill, in the order it was added. */
export interface StudioUpload {
  kind: UploadKind
  // The URL of the picture, which is either a temporary one from the file picker or a permanent one from the library.
  url: string
}

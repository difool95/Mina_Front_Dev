export type StudioMode = 'create' | 'animate'

//** The kind of upload, which determines which library it can be picked from. */
export type UploadKind = 'scene' | 'logo' | 'product'

///** One picture added under a "+" pill, in the order it was added. */
/** What the prompt block can ask of its brief through `ref`. */
export interface MinaBlockUserBriefHandle {
  /**
   * Replaces the whole brief: `locked` goes in the locked strip (an empty one
   * leaves nothing locked) and `brief` in the editable text above it.
   */
  setupBrief: (locked: string, brief: string) => void
}

export interface MinaBlockHandle {
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

/** Create mode's settings, kept in sessionStorage so a refresh does not lose them. */
export interface StudioSession {
  brief: string
  locked: string
  uploads: StudioUpload[]
  isCreative: boolean
  ratioIndex: number
  isLandscape: boolean
  /** This tab's studio session. Gone with the tab, so a reopened one starts a new session row. */
  studioSessionId: string
}

/** Where the output is meant to go, read off the ratio picked in the studio. Same as the API's. */
export type MmaPlatform = 'tiktok' | 'instagram-post' | 'print' | 'square'

/** `POST /api/mma/still`: the generation it started and the balance after its charge. */
export interface StillGenerationResult {
  generationId: string
  credits: number
}

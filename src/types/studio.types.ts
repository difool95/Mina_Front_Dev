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
  /** Its R2 URL — or, while `isUploading`, the browser's local preview of the picked file. */
  url: string
  origin: 'upload' | 'scene_library'
  isUploading?: boolean
  /** Sent in a Create: removing it leaves it on R2, where that generation still reads it. */
  isSent?: boolean
}

/** Create mode's settings, kept in sessionStorage so a refresh does not lose them. */
export interface StudioSession {
  brief: string
  locked: string
  uploads: StudioUpload[]
  lane: StillLane
  ratioIndex: number
  isLandscape: boolean
  /** This tab's studio session. Gone with the tab, so a reopened one starts a new session row. */
  studioSessionId: string
  /** The R2 URLs of the pictures this tab's Creates made, newest first. */
  generations: string[]
}

/** Where the output is meant to go, read off the ratio picked in the studio. Same as the API's. */
export type MmaPlatform = 'tiktok' | 'instagram-post' | 'print' | 'square'

/** The ratio on the studio's ratio pill, landscape flip included. Same as the API's. */
export type AspectRatio = '9:16' | '16:9' | '3:4' | '4:3' | '2:3' | '3:2' | '1:1'

/** Create mode's lane pill: Niche, Creative or Creative+. Same as the API's. */
export type StillLane = 'niche' | 'creative' | 'creative_plus'

/** `POST /api/mma/still`: the generation it started and the balance after its charge. */
export interface StillGenerationResult {
  generationId: string
  credits: number
}

/**
 * A generation's `mg_mma_status`: the step its pipeline is on, which picks what
 * Mina types in the brief meanwhile. Same as the API's.
 */
export type MmaStatus = 'progressing' | 'scanning' | 'prompting' | 'generating' | 'done' | 'error'

/** A running generation as the studio polls it: its step, and its picture once done. */
export interface GenerationProgress {
  status: MmaStatus
  /** Empty until the generation is done. */
  outputUrl: string
}

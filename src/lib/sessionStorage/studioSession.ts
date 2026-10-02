import type { StudioSession } from '@/types'

const KEY = 'mina.studio'

/**
 * The one place the studio's settings are kept for the tab's lifetime: they
 * survive a refresh and go when the tab closes.
 *
 * A module is evaluated once, so this object is already a singleton. All of
 * it lives as one JSON object under one key; `save` merges a part into it, so
 * each component writes only its own fields.
 */
export const studioSession = {
  read(): Partial<StudioSession> {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    } catch {
      return {}
    }
  },

  save(part: Partial<StudioSession>) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...this.read(), ...part }))
    } catch {
      // Over the ~5 MB quota (large uploads): the tab keeps working, the last save is skipped.
    }
  },
}

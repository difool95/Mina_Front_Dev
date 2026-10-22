import type { OnboardContent } from '@/types'

/**
 * First row of a content_type, or undefined.
 *
 * `title` narrows within a content_type that holds several rows — `cta_label`
 * keys its two by `login_button` / `tutorial_button`.
 */
export function pickRow(rows: OnboardContent[] | undefined, contentType: string, title?: string) {
  return rows?.find(
    (row) => row.content_type === contentType && (title === undefined || row.title === title),
  )
}

//This method is used to filter an array of OnboardContent objects based on a specific content type.
export function pickRows(rows: OnboardContent[] | undefined, contentType: string) {
  return rows?.filter((row) => row.content_type === contentType) ?? []
}

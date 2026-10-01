import { useEffect, useRef } from 'react'

import { ContentCreatorLibrary } from './ContentCreatorLibrary'
import { SceneLibrary } from './SceneLibrary'

import './StudioLibrary.css'

/**
 * The studio's libraries, full screen over the studio.
 *
 * A native `<dialog>` opened with `showModal()`, like the other panels: it sits
 * in the top layer, so the prompt block's transformed parents cannot pin it
 * inside themselves, and Escape closes it for free.
 */
export function StudioLibrary({
  library,
  onClose,
  onPickScene,
}: {
  library: 'scene' | 'content'
  onClose: () => void
  onPickScene: (url: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="mina-library" onClose={onClose}>
      {library === 'scene' ? <SceneLibrary onClose={onClose} onPick={onPickScene} /> : <ContentCreatorLibrary onClose={onClose} />}
    </dialog>
  )
}

import { TUTORIAL_VIDEO_URL } from '@/lib/constants'

import { VideoPlayer } from './VideoPlayer'

import './TutorialPanel.css'

/**
 * The tutorial screen. Covers the page rather than routing away — `/` owns both
 * this and the login view.
 *
 * Both header actions close it and return to login; they differ only in label.
 */
export function TutorialPanel({
  signUpLabel,
  onClose,
}: {
  signUpLabel: string
  onClose: () => void
}) {
  return (
    <section className="mina-tutorial">
      <header className="mina-tutorial__bar">
        <h1 className="mina-tutorial__title">Mina tutorial</h1>
        <div className="mina-tutorial__actions">
          <button className="mina-tutorial__signup" type="button" onClick={onClose}>
            {signUpLabel}
          </button>
          <button className="mina-tutorial__skip" type="button" onClick={onClose}>
            Skip
          </button>
        </div>
      </header>

      <div className="mina-tutorial__stage">
        <VideoPlayer src={TUTORIAL_VIDEO_URL} />
      </div>
    </section>
  )
}

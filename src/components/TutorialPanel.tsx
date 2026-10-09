import { TUTORIAL_VIDEO_URL } from '@/lib/constants'

import { VideoPlayer } from './VideoPlayer'

import './TutorialPanel.css'

/**
 * The tutorial screen. Covers the page rather than routing away — `/` owns both
 * this and the login view.
 *
 * Both actions close it and return to login. Skip is phones only, where
 * "Sign in" sits centred under the video; on desktop "Sign in" takes Skip's
 * place in the header. One button either way — the CSS grid moves it.
 */
export function TutorialPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="mina-tutorial">
      <header className="mina-tutorial__bar">
        <h1 className="mina-tutorial__title">Mina tutorial</h1>
        <button className="mina-tutorial__skip" type="button" onClick={onClose}>
          Skip
        </button>
      </header>

      <div className="mina-tutorial__stage">
        <VideoPlayer src={TUTORIAL_VIDEO_URL} />
      </div>

      <button className="mina-tutorial__signin" type="button" onClick={onClose}>
        Sign in
      </button>
    </section>
  )
}

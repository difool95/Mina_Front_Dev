import { Fragment, useState, type CSSProperties } from 'react'

import {
  EDIT_PROMPT_MIN_LENGTH,
  EDIT_PROMPT_PLACEHOLDER,
  EDIT_TOOL_BARS,
  EDIT_TOOL_GROUPS,
  RATIO_ICONS,
  STUDIO_RATIOS,
} from '@/lib/studio'
import type { EditTool, Ratio } from '@/types'

/**
 * The right panel's bar while editing: the edit menu, or the bar of the tool
 * picked in it. The tools do nothing yet.
 *
 * Its styles live in `StudioPage.css`, beside the panel's.
 */
export function RightStudioEditBar({
  editing,
  onEditingChange,
  isBusy,
  onStartEditTool,
  pictureCount,
  expandRatio,
  onExpandRatio,
}: {
  editing: EditTool | 'menu'
  /** null goes back to the panel's normal bar. */
  onEditingChange: (next: EditTool | 'menu' | null) => void
  /** While Mina is busy with a Create or an edit: the tools wait. */
  isBusy: boolean
  /** Starts the tool on the picture on show, or on every picture (`isAll`); false when it did not start. */
  onStartEditTool: (tool: EditTool, brief?: string, isAll?: boolean) => boolean
  /** The pictures in the panel, shown on the "all" buttons. */
  pictureCount: number
  /** Held by the panel, which draws Expand's frame in it. */
  expandRatio: Ratio
  onExpandRatio: (ratio: Ratio) => void
}) {
  const [prompt, setPrompt] = useState('')

  //the back button returns the user to the bottom normal bar if the user is in the menu (editting == 'menu') and returns theuser to the menu if the user is in any
  //other editting mode
  const back = (
    <button
      className="mina-studio__action mina-studio__back button muted"
      type="button"
      aria-label="Back"
      onClick={() => onEditingChange(editing === 'menu' ? null : 'menu')}
    >
      <svg width="8" height="16" viewBox="0 0 9 16" fill="none" stroke="currentColor" aria-hidden="true">
        <polyline points="8,1 1,8 8,15" />
      </svg>
    </button>
  )

  if (editing === 'menu') {
    return (
      <div className="mina-studio__actions mina-studio__actions--edit">
        {back}
        {EDIT_TOOL_GROUPS.map((group, index) => (
          <Fragment key={group[0]}>
            {index > 0 && (
              <span className="mina-studio__separator body-text faint" aria-hidden="true">
                |
              </span>
            )}
            {group.map((tool) => (
              <button
                className="mina-studio__action body-text-button button"
                type="button"
                key={tool}
                //this line changes the editting mode to the tool that was clicked on (it changes the editing state to the tool that was clicked on)
                onClick={() => onEditingChange(tool)}
              >
                {tool}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    )
  }

  const { all, cta } = EDIT_TOOL_BARS[editing]

  return (
    <div className="mina-studio__actions mina-studio__actions--edit">
      {back}
      <div className={`mina-studio__tool${editing === 'Expand' ? ' mina-studio__tool--centered' : ''}`}>
        {editing === 'Prompt' && (
          <input
            className="mina-studio__tweak body-text-button placeholder-faint"
            value={prompt}
            placeholder={EDIT_PROMPT_PLACEHOLDER}
            onChange={(event) => setPrompt(event.target.value)}
            autoFocus
          />
        )}
        {/* The "all" buttons only show when there are multiple pictures */}
        {all && pictureCount > 1 && (
          <button
            className="mina-studio__action body-text-button button"
            type="button"
            disabled={isBusy}
            // The "all" buttons: Vectorize All, Remove all Subject and Remove all BG.
            onClick={editing === 'SVG' || editing === 'No Subject' || editing === 'No Background' ? () => onStartEditTool(editing, '', true) : undefined}
          >
            {all} ({pictureCount})
          </button>
        )}
        {editing === 'Expand' &&
          STUDIO_RATIOS.map(({ value }) => (
            <button
              className={`mina-studio__action mina-studio__ratio body-text-button button${value === expandRatio ? '' : ' muted'}`}
              type="button"
              key={value}
              onClick={() => onExpandRatio(value)}
            >
              <span
                className="mina-pills__ratio-icon"
                style={{ '--icon': `url('${RATIO_ICONS[value]}')` } as CSSProperties}
              />
              {value}
            </button>
          ))}
      </div>
      <button
        className="mina-studio__action body-text-button button underline"
        type="button"
        //The CTA button is disabled only when Mina is busy or when the user is in the prompt mode and the prompt is too short (less than 3 characters)
        disabled={isBusy || (editing === 'Prompt' && prompt.trim().length <= EDIT_PROMPT_MIN_LENGTH)}
        // The CTA button: Vectorize, Remove Subject, Remove Background, Expand, Erase, or Edit Prompt.
        onClick={() => onStartEditTool(editing, prompt.trim()) && setPrompt('')}
      >
        {cta}
      </button>
    </div>
  )
}

import { useState } from 'react'

import type { UploadKind } from '@/types'

import { Rule } from '../builder/Table'
import { MinaBlockPills } from './MinaBlockPills'
import { MinaBlockUploadAndLibraries } from './MinaBlockUploadAndLibraries'
import { MinaBlockUserBrief } from './MinaBlockUserBrief'

import './MinaBlock.css'

/** The studio's prompt: pills, brief, uploads, vision switch and the call to action. */
export function MinaBlock({ placeholder }: { placeholder: string }) {
  // Shared by the pills, which pick it, and the upload row, which follows it.
  const [upload, setUpload] = useState<UploadKind>('scene')

  return (
    <div className="mina-block">
      <MinaBlockPills upload={upload} onUpload={setUpload} />
      <MinaBlockUserBrief placeholder={placeholder} />
      <Rule />
      <MinaBlockUploadAndLibraries upload={upload} />
      <Rule />
      <MinaBlockVisionIntelligence />
      <MinaBlockCTA />
    </div>
  )
}

function MinaBlockVisionIntelligence() {
  const [isOn, setIsOn] = useState(true)

  return (
    <button className="mina-block__vision" type="button" onClick={() => setIsOn((was) => !was)}>
      Mina vision intelligence: {isOn ? 'ON' : 'OFF'}
    </button>
  )
}

function MinaBlockCTA() {
  return (
    <button className="mina-block__cta" type="button">
      Describe more
    </button>
  )
}

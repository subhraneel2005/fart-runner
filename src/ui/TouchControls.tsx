import type { PointerEvent } from 'react'
import { input } from '../lib/input'

function startJump(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
  event.currentTarget.setPointerCapture(event.pointerId)
  input.push('jumpPress')
}

function endJump(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
  input.push('jumpRelease')
}

function startBoost(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
  event.currentTarget.setPointerCapture(event.pointerId)
  input.boost = true
}

function endBoost(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
  input.boost = false
}

export function TouchControls() {
  return (
    <div className="touch-controls">
      <div className="touch-lanes">
        <button
          className="touch-btn lane-btn"
          type="button"
          aria-label="Move left"
          onPointerDown={() => input.push('left')}
        >
          ◀
        </button>
        <button
          className="touch-btn lane-btn"
          type="button"
          aria-label="Move right"
          onPointerDown={() => input.push('right')}
        >
          ▶
        </button>
      </div>

      <div className="touch-actions">
        <button
          className="touch-btn boost-btn"
          type="button"
          onPointerDown={startBoost}
          onPointerUp={endBoost}
          onPointerCancel={endBoost}
          onPointerLeave={endBoost}
        >
          <span>BOOST</span>
          <small>hold</small>
        </button>
        <button
          className="touch-btn jump-btn"
          type="button"
          onPointerDown={startJump}
          onPointerUp={endJump}
          onPointerCancel={endJump}
          onPointerLeave={endJump}
        >
          <span>JUMP</span>
          <small>hold to charge</small>
        </button>
      </div>
    </div>
  )
}

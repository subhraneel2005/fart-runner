import { useRef } from 'react'
import { GameCanvas } from '../game/GameCanvas'
import { input } from '../lib/input'
import { useGameStore } from '../store/gameStore'
import { GameOver } from './GameOver'
import { Hud } from './Hud'
import { PauseOverlay } from './PauseOverlay'
import { TouchControls } from './TouchControls'

interface SwipeStart {
  x: number
  y: number
}

export function GameView() {
  const phase = useGameStore((state) => state.phase)
  const start = useRef<SwipeStart | null>(null)

  return (
    <div className={`game-view phase-${phase}`}>
      <div className="canvas-wrap">
        <GameCanvas />
      </div>

      <div
        className="gesture-layer"
        aria-hidden="true"
        onTouchStart={(event) => {
          if (phase !== 'playing' || event.touches.length === 0) return
          const touch = event.touches[0]
          start.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchEnd={(event) => {
          if (phase !== 'playing' || !start.current || event.changedTouches.length === 0) return
          const touch = event.changedTouches[0]
          const dx = touch.clientX - start.current.x
          const dy = touch.clientY - start.current.y
          start.current = null
          if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
            input.push(dx < 0 ? 'left' : 'right')
          } else if (dy < -42) {
            input.push('jumpPress')
            window.setTimeout(() => input.push('jumpRelease'), 32)
          }
        }}
        onTouchCancel={() => {
          start.current = null
        }}
      />

      <p className="sr-only">
        Fart-powered 3D endless runner. Switch lanes with the left and right arrow keys or A and D.
        Hold space to charge a jump, release to launch, and press space in the air for a fart dash.
        Hold shift or F to boost. Collect beans, dodge obstacles, and grab power-ups.
      </p>

      <Hud />
      {phase === 'playing' && <TouchControls />}
      {phase === 'paused' && <PauseOverlay />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}

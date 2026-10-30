import { useEffect } from 'react'
import { input, isTypingTarget } from './lib/input'
import { useGameStore } from './store/gameStore'
import { GameView } from './ui/GameView'
import { Landing } from './ui/Landing'

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])
const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW'])
const BOOST_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyF'])

export default function App() {
  const phase = useGameStore((state) => state.phase)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      const store = useGameStore.getState()

      if (event.code === 'KeyM') {
        store.toggleMuted()
        return
      }

      if (store.phase === 'landing') return

      if (event.code === 'Escape' || event.code === 'KeyP') {
        event.preventDefault()
        store.togglePause()
        return
      }

      if (store.phase === 'gameover') {
        if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyR') {
          event.preventDefault()
          store.restart()
        }
        return
      }

      if (store.phase === 'paused') {
        if (event.code === 'Enter') {
          event.preventDefault()
          store.resume()
        }
        return
      }

      if (store.phase !== 'playing') return

      if (LEFT_KEYS.has(event.code)) {
        event.preventDefault()
        if (!event.repeat) input.push('left')
      } else if (RIGHT_KEYS.has(event.code)) {
        event.preventDefault()
        if (!event.repeat) input.push('right')
      } else if (JUMP_KEYS.has(event.code)) {
        event.preventDefault()
        if (!event.repeat) input.push('jumpPress')
      } else if (BOOST_KEYS.has(event.code)) {
        event.preventDefault()
        input.boost = true
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (JUMP_KEYS.has(event.code)) {
        input.push('jumpRelease')
      } else if (BOOST_KEYS.has(event.code)) {
        input.boost = false
      }
    }

    function onBlur() {
      input.boost = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return <div className="app">{phase === 'landing' ? <Landing /> : <GameView />}</div>
}

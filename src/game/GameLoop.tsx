import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { CONFIG } from '../config'
import { useGameStore } from '../store/gameStore'
import { fx, isRocketActive, runtime } from './runtime'

export function GameLoop() {
  const setHud = useGameStore((state) => state.setHud)
  const publish = useRef(0)

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)

    if (runtime.running) {
      runtime.time += dt
      const rocket = isRocketActive()
      runtime.baseSpeed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + runtime.distance * CONFIG.speedRamp)
      const boost = runtime.boosting ? CONFIG.boostMul : 1
      const impulse = 1 + runtime.impulse * 0.3
      runtime.speed = runtime.baseSpeed * (rocket ? CONFIG.rocketMul : 1) * boost * impulse
      runtime.distance += runtime.speed * dt
      runtime.fartPower = Math.max(0, runtime.fartPower - dt * 1.7)
      runtime.impulse = Math.max(0, runtime.impulse - dt * 2.4)
    }

    fx.shake = Math.max(0, fx.shake - dt * 4.2)

    if (useGameStore.getState().phase !== 'playing') return
    publish.current += dt
    if (publish.current < 0.09) return
    publish.current = 0
    setHud({
      distance: runtime.distance,
      gas: runtime.gas,
      charge: runtime.charge,
      boosting: runtime.boosting,
      rocketLeft: Math.max(0, runtime.rocketUntil - runtime.time),
      antigravLeft: Math.max(0, runtime.antigravUntil - runtime.time),
    })
  })

  return null
}
